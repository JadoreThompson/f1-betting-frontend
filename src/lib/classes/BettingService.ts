import MetaMaskSDK from "@metamask/sdk";
import { ethers } from "ethers";
import { BETTING_ESCROW_ABI, NETWORK_CONFIGS, USDT_ABI } from "../constants";
import { CheckContractsInitialised } from "../decorators";
import type { EthersRevert } from "../errors/EthersRevert";

import {
  ValidationError,
  ValidationErrorType,
} from "../errors/ValidationError";
import { Web3Error } from "../errors/Web3Error";
import { ChainId, type NetworkConfig } from "../types/networkConfig";

export class BettingService {
  private targetChainId: ChainId;
  private MMSDK: MetaMaskSDK;

  private currentNetwork: NetworkConfig | undefined = undefined;
  private provider: ethers.BrowserProvider | undefined = undefined;
  private signer: ethers.Signer | undefined = undefined;

  private usdtContract: ethers.Contract | undefined = undefined;
  private usdtDecimals: number | undefined = undefined;
  private bettingContract: ethers.Contract | undefined = undefined;

  constructor(chainId: ChainId) {
    this.MMSDK = new MetaMaskSDK();
    this.targetChainId = chainId;
  }

  /**
   * Validates the connected network matches the target chain ID.
   * If not, attempts to switch to the target network via MetaMask.
   * @returns The target network configuration.
   * @throws {Web3Error} if provider is uninitialized or switch fails.
   */
  private async validateNetwork(): Promise<NetworkConfig> {
    if (!this.provider) {
      throw new Web3Error("Provider not initialised.");
    }

    const chainNetworkConfig = NETWORK_CONFIGS[this.targetChainId];

    let network = await this.provider.getNetwork();
    const curChainId = Number(network.chainId) as ChainId;

    if (curChainId !== this.targetChainId) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainNetworkConfig.hexChainId }],
        });
      } catch (error) {
        throw new Web3Error("Switch to Sepolia failed");
      }
    }

    return chainNetworkConfig;
  }

  /**
   * Checks the presence of betting and USDT contracts on the network,
   * initializes contract instances, and validates the USDT token address.
   * Also fetches USDT token decimals.
   * @param networkConfig Configuration of the target network.
   * @throws {Web3Error} if contracts are missing or USDT address mismatches.
   */
  private async validateAndLoadContracts(
    networkConfig: NetworkConfig
  ): Promise<void> {
    const [bettingCode, usdtCode] = await Promise.all([
      this.provider!.getCode(networkConfig.bettingEscrow),
      this.provider!.getCode(networkConfig.usdt),
    ]);

    if (bettingCode === "0x" || usdtCode === "0x") {
      throw new Web3Error(
        "One or more contracts not found at specified addresses."
      );
    }

    const bettingContract = new ethers.Contract(
      networkConfig.bettingEscrow,
      BETTING_ESCROW_ABI,
      this.signer
    );

    const contractUsdtAddress = await bettingContract.usdtToken();

    if (
      contractUsdtAddress.toLowerCase() !== networkConfig.usdt.toLowerCase()
    ) {
      throw new Web3Error(
        "USDT token address mismatch between config and contract."
      );
    }

    this.bettingContract = bettingContract;

    this.usdtContract = new ethers.Contract(
      networkConfig.usdt,
      USDT_ABI,
      this.signer
    );

    this.usdtDecimals = Number(await this.usdtContract.decimals());
  }

  /** Resets all contract instances, provider, signer, and decimals to undefined. */
  private cleanUp(): void {
    this.usdtContract = undefined;
    this.bettingContract = undefined;
    this.usdtDecimals = undefined;
    this.provider = undefined;
    this.signer = undefined;
  }

  /**
   * Connects to MetaMask, initializes provider, signer, network, and contracts.
   * @returns The first connected account address.
   * @throws {Web3Error} if no accounts or user rejects connection.
   */
  async connect(): Promise<string> {
    if (this.signer) {
      const address = await this.signer.getAddress();
      return address;
    }

    try {
      const accounts = await this.MMSDK.connect();

      if (!accounts.length) {
        throw new Web3Error("No accounts available.");
      }

      this.provider = new ethers.BrowserProvider((window as any).ethereum);
      this.signer = await this.provider.getSigner();
      this.currentNetwork = await this.validateNetwork();
      await this.validateAndLoadContracts(this.currentNetwork);

      return accounts[0];
    } catch (error) {
      this.cleanUp();

      if ((error as EthersRevert).code === 4001) {
        throw new Web3Error("User rejected connection.");
      }

      throw error;
    }
  }

  /**
   * Validates and sanitizes input based on type: number or address.
   * @param input Raw input string.
   * @param type The expected type of input ("number" or "address").
   * @returns Sanitised input string.
   * @throws {ValidationError} if input format is invalid.
   */
  private sanitiseInput(input: string, type: "number" | "address"): string {
    const trimmed = input.trim();

    if (type === "number") {
      if (!/^\d+(\.\d+)?$/.test(trimmed)) {
        throw new ValidationError("Invalid number format.");
      }
    }

    if (type === "address") {
      if (!ethers.isAddress(trimmed)) {
        throw new ValidationError("Invalid address format.");
      }
    }

    return trimmed;
  }

  /**
   * Validates USDT balance and allowance for a given amount.
   * Mints USDT if on Sepolia and balance is insufficient.
   * @param amountWei Amount in wei units.
   * @throws {ValidationError} if balance or allowance is insufficient.
   */
  @CheckContractsInitialised
  private async validateUSDT(amountWei: bigint) {
    const address = await this.signer?.getAddress();
    const usdtContract = this.usdtContract!;
    const balance = await usdtContract.balanceOf(address);

    if (balance < amountWei) {
      if (this.targetChainId == ChainId.SEPOLIA) {
        const mintTx = await usdtContract.mint(address, amountWei);
        await mintTx.wait();
      } else {
        throw new ValidationError("Insufficient balance.");
      }
    }

    const allowance = await usdtContract.allowance(
      address,
      this.currentNetwork!.bettingEscrow
    );

    if (allowance < amountWei) {
      const formattedAmount = ethers.formatUnits(amountWei, this.usdtDecimals);
      throw new ValidationError(
        `Insufficient allowance. Please approve ${formattedAmount} USDT.`,
        ValidationErrorType.REQUIRES_APPROVAL
      );
    }
  }

  /**
   * Approves the betting escrow contract to spend a specified USDT amount.
   * @param amount Amount of USDT to approve (as string).
   * @returns Transaction hash of the approval.
   */
  @CheckContractsInitialised
  async approveUSDT(amount: string): Promise<string> {
    const sanitizedAmount = this.sanitiseInput(amount, "number");
    const amountWei = ethers.parseUnits(sanitizedAmount, this.usdtDecimals);
    const tx = await this.usdtContract!.approve(
      this.currentNetwork!.bettingEscrow,
      amountWei
    );
    await tx.wait();
    return tx.hash;
  }

  /**
   * Places a bet on a specified market with a given USDT amount.
   * Validates input, USDT balance, allowance, and handles approval if needed.
   * @param marketId The ID of the betting market.
   * @param amount Amount of USDT to bet (as string).
   * @returns Transaction hash of the bet placement.
   * @throws {ValidationError, Web3Error} on input, balance, allowance, or transaction failure.
   */
  @CheckContractsInitialised
  async placeBet(marketId: number, amount: string): Promise<string> {
    try {
      const sanitisedAmount = this.sanitiseInput(amount, "number");

      if (marketId < 0 || !Number.isInteger(marketId)) {
        throw new ValidationError("Invalid market ID.");
      }

      const amountWei = ethers.parseUnits(sanitisedAmount, this.usdtDecimals);
      if (amountWei <= 0n) {
        throw new ValidationError("Amount must be greater than zero.");
      }

      const maximumAmountWei = 2n ** 256n - 1n;
      if (amountWei > maximumAmountWei) {
        throw new ValidationError(
          `Amount exceeds maximum ${maximumAmountWei}.`
        );
      }

      try {
        await this.validateUSDT(amountWei);
      } catch (error: any) {
        if (
          (error as ValidationError).type ===
          ValidationErrorType.REQUIRES_APPROVAL
        ) {
          await this.approveUSDT(amount);
        } else {
          throw error;
        }
      }

      const tx = await this.bettingContract!.placeBet(marketId, amountWei);
      await tx.wait();

      return tx.hash as string;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }

      const ethersRevertError = error as EthersRevert;
      if (
        ethersRevertError.code === 4001 ||
        ethersRevertError.code === "ACTION_REJECTED"
      ) {
        throw new Web3Error("Transaction rejected by user.");
      }

      if (ethersRevertError.code === "CALL_EXCEPTION")
        throw new Web3Error(ethersRevertError.reason);

      if (ethersRevertError.revert)
        throw new Web3Error(ethersRevertError.reason);

      throw new Error((error as Error).message);
    }
  }
}
