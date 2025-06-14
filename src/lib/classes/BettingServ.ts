import MetaMaskSDK from "@metamask/sdk";
import { ethers } from "ethers";
import { BETTING_ESCROW_ABI, NETWORK_CONFIGS, USDT_ABI } from "../constants";
import { CheckContractsInitialised } from "../decorators";
import { ValidationError } from "../errors/validationError";
import { Web3Error } from "../errors/web3Error";
import { ChainId, type NetworkConfig } from "../types/networkConfig";

class BettingService {
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

  get isConnected(): boolean {
    return !!(
      this.signer &&
      this.bettingContract &&
      this.usdtContract &&
      this.usdtDecimals
    );
  }

  private async validateNetwork(): Promise<NetworkConfig> {
    if (!this.provider) throw new Web3Error("Provider not initialised.");

    const chainNetworkConfig = NETWORK_CONFIGS[this.targetChainId];

    let network = await this.provider.getNetwork();
    const curChainId = Number(network.chainId) as ChainId;

    if (curChainId !== this.targetChainId) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainNetworkConfig.hexChainId }], // Hex chainId for Sepolia
        });
      } catch (error) {
        throw new Web3Error("Switch to Sepolia failed");
      }
    }

    return chainNetworkConfig;
  }

  private async validateAndLoadContracts(
    networkConfig: NetworkConfig
  ): Promise<void> {
    const [bettingCode, usdtCode] = await Promise.all([
      this.provider!.getCode(networkConfig.bettingEscrow),
      this.provider!.getCode(networkConfig.usdt),
    ]);

    if (bettingCode === "0x" || usdtCode === "0x") {
      throw new Web3Error(
        "One or more contracts not found at specified addresses"
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
        "USDT token address mismatch between config and contract"
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

  private cleanUp(): void {
    this.usdtContract = undefined;
    this.bettingContract = undefined;
    this.usdtDecimals = undefined;
    this.provider = undefined;
    this.signer = undefined;
  }

  async connect(): Promise<string> {
    if (this.signer) return await this.signer.getAddress();

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

      if ((error as any).code === 4001)
        throw new Web3Error("User rejected connection.");

      throw error;
    }
  }

  private sanitiseInput(input: string, type: "number" | "address"): string {
    const trimmed = input.trim();

    if (type === "number") {
      if (!/^\d+(\.\d+)?$/.test(trimmed))
        throw new ValidationError("Invalid number format");
    }

    if (type === "address") {
      if (!ethers.isAddress(trimmed))
        throw new ValidationError("Invalid address format");
    }

    return trimmed;
  }

  @CheckContractsInitialised
  private async validateUSDT(amountWei: bigint) {
    const address = await this.signer?.getAddress();

    const balance = await this.usdtContract!.balanceOf(address);
    if (balance < amountWei) throw new ValidationError("Insufficient balance.");

    const allowance = await this.usdtContract!.allowance(
      address,
      this.currentNetwork!.bettingEscrow
    );
    if (allowance < amountWei)
      throw new ValidationError(
        `Insufficient allowance. Please approve ${ethers.formatUnits(
          amountWei,
          this.usdtDecimals
        )} USDT`
      );
  }

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

  @CheckContractsInitialised
  async placeBet(marketId: number, amount: string): Promise<string> {
    try {
      // Validating
      const sanitisedAmount = this.sanitiseInput(amount, "number");
      if (marketId < 0 || !Number.isInteger(marketId)) {
        throw new ValidationError("Invalid market ID");
      }

      const amountWei = ethers.parseUnits(sanitisedAmount, this.usdtDecimals);
      if (amountWei <= 0n)
        throw new ValidationError("Amount must be greater than zero");

      const maximumAmountWei = 2n ** 256n - 1n;
      if (amountWei > maximumAmountWei)
        throw new ValidationError(
          `Amount exceeds maximum ${maximumAmountWei}.`
        );

      await this.validateUSDT(amountWei);

      // Placing
      const tx = await this.bettingContract!.placeBet(marketId, amountWei);
      const receipt = await tx.wait();
      console.log("Tx Receipt:", receipt);

      return tx.hash as string;
    } catch (error) {
      if (error instanceof ValidationError) throw error;

      if (
        (error as any).code === 4001 ||
        (error as any).code === "ACTION_REJECTED"
      ) {
        throw new Web3Error("Transaction rejected by user.");
      }

      throw new Web3Error(`Transaction failed: ${(error as Error).message}`);
    }
  }
}
