import MetaMaskSDK from "@metamask/sdk";
import { ethers } from "ethers";

enum ChainId {
  MAINNET = 1,
  SEPOLIA = 11155111,
}

interface NetworkConfig {
  name: string;
  chainId: ChainId;
  bettingEscrow: string;
  usdt: string;
  blockExplorer: string;
}

const NETWORK_CONFIGS: Record<ChainId, NetworkConfig> = {
  [ChainId.MAINNET]: {
    name: "Ethereum Mainnet",
    chainId: ChainId.MAINNET,
    bettingEscrow: "0x...",
    usdt: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    blockExplorer: "https://etherscan.io",
  },
  [ChainId.SEPOLIA]: {
    name: "Sepolia Testnet",
    chainId: ChainId.SEPOLIA,
    bettingEscrow: "0x1eaB9910590855cD49ce890d0e0030E4CAee4B13",
    usdt: "0x0fe922d26fde4a9160bb2d145e851e2d9c2f3f84",
    blockExplorer: "https://sepolia.etherscan.io",
  },
} as const;

const BETTING_ESCROW_ABI = [
  {
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    name: "placeBet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "participant", type: "address" },
    ],
    name: "containsParticipant",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "marketEscrow",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "usdtToken",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "volume",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "activeBetCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const USDT_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export enum BettingErrorType {
  NETWORK_MISMATCH = "NETWORK_MISMATCH",
  INVALID_AMOUNT = "INVALID_AMOUNT",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  INSUFFICIENT_ALLOWANCE = "INSUFFICIENT_ALLOWANCE",
  ALREADY_PARTICIPATED = "ALREADY_PARTICIPATED",
  CONTRACT_NOT_FOUND = "CONTRACT_NOT_FOUND",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  USER_REJECTED = "USER_REJECTED",
  RATE_LIMITED = "RATE_LIMITED",
  INVALID_MARKET = "INVALID_MARKET",
}

export class BettingError extends Error {
  constructor(
    public type: BettingErrorType,
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = "BettingError";
  }
}

export interface BetResult {
  success: boolean;
  transactionHash?: string;
  error?: BettingError;
  gasUsed?: string;
}

interface SecurityValidation {
  isValidNetwork: boolean;
  isValidAmount: boolean;
  hasValidContracts: boolean;
  isRateLimited: boolean;
}

// TODO: DRY and optimise.
export class BettingService {
  private provider: any = null;
  private signer: ethers.Signer | null = null;
  private currentNetwork: NetworkConfig | null = null;
  private bettingContract: ethers.Contract | null = null;
  private usdtContract: ethers.Contract | null = null;
  private readonly MAX_UINT256 = 2 ** 256 - 1;
  private readonly MAX_GAS_PRICE = ethers.parseUnits("1000", "gwei"); // 100 gwei max

  /**
   * Validates and sanitizes input for number or address types.
   * @param input The input string to validate.
   * @param type The type of input to validate ("number" or "address").
   * @returns {string} The sanitized input string.
   */
  private validateAndSanitizeInput(
    input: string,
    type: "number" | "address"
  ): string {
    const trimmed = input.trim();

    if (type === "number") {
      if (!/^\d*\.?\d*$/.test(trimmed)) {
        throw new BettingError(
          BettingErrorType.INVALID_AMOUNT,
          "Invalid number format"
        );
      }
    }

    if (type === "address") {
      if (!ethers.isAddress(trimmed)) {
        throw new BettingError(
          BettingErrorType.INVALID_AMOUNT,
          "Invalid address format"
        );
      }
    }

    return trimmed;
  }

  /**
   * Validates the current network and switches to Sepolia if not already connected.
   * @returns {Promise<NetworkConfig>} The current network configuration.
   * @throws {Error} If the provider is not initialized or network switch fails.
   */
  private async validateNetwork(): Promise<NetworkConfig> {
    if (!this.provider) throw new Error("Provider not initialized");

    const network = await this.provider.getNetwork();
    const curChainId = Number(network.chainId) as ChainId;

    if (curChainId !== ChainId.SEPOLIA) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }], // Hex chainId for Sepolia
        });
      } catch (switchError: any) {
        throw new Error("Switch to Sepolia failed");
      }
    }

    return NETWORK_CONFIGS[
      (await this.provider
        .getNetwork()
        .then((n: any) => Number(n.chainId))) as ChainId
    ];
  }

  /**
   * Validates the presence and correctness of the betting and USDT contracts.
   * @param config The network configuration containing contract addresses.
   */
  private async validateContracts(config: NetworkConfig): Promise<void> {
    if (!this.provider) throw new Error("Provider not initialized");

    const bettingCode = await this.provider.getCode(config.bettingEscrow);
    const usdtCode = await this.provider.getCode(config.usdt);

    if (bettingCode === "0x" || usdtCode === "0x") {
      throw new BettingError(
        BettingErrorType.CONTRACT_NOT_FOUND,
        "One or more contracts not found at specified addresses"
      );
    }

    // Verify USDT token address matches contract's expectation
    const bettingContract = new ethers.Contract(
      config.bettingEscrow,
      BETTING_ESCROW_ABI,
      this.provider
    );
    const contractUsdtAddress = await bettingContract.usdtToken();

    if (contractUsdtAddress.toLowerCase() !== config.usdt.toLowerCase()) {
      throw new BettingError(
        BettingErrorType.CONTRACT_NOT_FOUND,
        "USDT token address mismatch between config and contract"
      );
    }
  }

  /**
   * Connects to MetaMask and initializes the betting service.
   * @returns {Promise<string>} The connected account address.
   */
  async connectToMetaMask(): Promise<string> {
    try {
      const MMSDK = new MetaMaskSDK();
      const accounts = await MMSDK.connect();

      if (!accounts.length) {
        throw new Error("No accounts found");
      }

      const account = accounts[0];

      this.provider = new ethers.BrowserProvider((window as any).ethereum);
      this.signer = await this.provider.getSigner();
      this.currentNetwork = await this.validateNetwork();
      await this.validateContracts(this.currentNetwork);

      this.bettingContract = new ethers.Contract(
        this.currentNetwork.bettingEscrow,
        BETTING_ESCROW_ABI,
        this.signer
      );

      this.usdtContract = new ethers.Contract(
        this.currentNetwork.usdt,
        USDT_ABI,
        this.signer
      );

      return account;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new BettingError(
          BettingErrorType.USER_REJECTED,
          "User rejected connection"
        );
      }
      throw error;
    }
  }

  /**
   * Checks the user's USDT balance.
   * @param {string} userAddress The user's wallet address.
   * @return {Promise<string>} The user's USDT balance formatted as a string.
   * @throws {Error} If the USDT contract is not initialized or balance retrieval fails.
   */
  async checkUserBalance(userAddress: string): Promise<string> {
    if (!this.usdtContract) throw new Error("USDT contract not initialized");

    const balance = await this.usdtContract.balanceOf(userAddress);
    const decimals = await this.usdtContract.decimals();

    return ethers.formatUnits(balance, decimals);
  }

  /**
   * Checks the user's USDT allowance for the betting escrow contract.
   * @param {string} userAddress The user's wallet address.
   * @return {Promise<string>} The user's USDT allowance formatted as a string.
   * @throws {Error} If the USDT contract or current network is not initialized.
   */
  async checkAllowance(userAddress: string): Promise<string> {
    if (!this.usdtContract || !this.currentNetwork)
      throw new Error("Contracts not initialized");

    const allowance = await this.usdtContract.allowance(
      userAddress,
      this.currentNetwork.bettingEscrow
    );
    const decimals = await this.usdtContract.decimals();

    return ethers.formatUnits(allowance, decimals);
  }

  /**
   * Approves USDT for the betting escrow contract.
   * @param {string} amount The amount of USDT to approve.
   * @return {Promise<[boolean, string?]>} A tuple indicating success and transaction hash if successful.
   * @throws {Error} If the USDT contract or current network is not initialized, or if approval fails.
   */
  async approveUSDT(amount: string): Promise<[boolean, string?]> {
    if (!this.usdtContract || !this.currentNetwork)
      throw new Error("Contracts not initialized");

    const sanitizedAmount = this.validateAndSanitizeInput(amount, "number");
    const decimals = await this.usdtContract.decimals();
    const amountWei = ethers.parseUnits(sanitizedAmount, decimals);

    // Check current allowance
    const userAddress = await this.signer!.getAddress();
    const currentAllowance = await this.usdtContract.allowance(
      userAddress,
      this.currentNetwork.bettingEscrow
    );

    if (currentAllowance >= amountWei) {
      return [true];
    }

    const gasEstimate = await this.usdtContract.approve.estimateGas(
      this.currentNetwork.bettingEscrow,
      amountWei
    );

    // Get current gas price and validate
    const gasPrice = await this.provider!.getFeeData();
    if (gasPrice.gasPrice && gasPrice.gasPrice > this.MAX_GAS_PRICE) {
      throw new Error(
        `Gas price too high: ${ethers.formatUnits(
          gasPrice.gasPrice,
          "gwei"
        )} gwei`
      );
    }

    const tx = await this.usdtContract.approve(
      this.currentNetwork.bettingEscrow,
      amountWei,
      {
        gasLimit: (gasEstimate * 120n) / 100n, // 20% buffer
        gasPrice: gasPrice.gasPrice,
      }
    );

    await tx.wait();
    return [true, tx.hash];
  }

  /**
   * Places a bet on a specified market.
   * @param {number} marketId The ID of the market to bet on.
   * @param {string} amount The amount of USDT to bet.
   * @return {Promise<BetResult>} The result of the bet placement.
   */
  async placeBet(marketId: number, amount: string): Promise<BetResult> {
    try {
      if (!this.bettingContract || !this.signer || !this.currentNetwork) {
        throw new BettingError(
          BettingErrorType.CONTRACT_NOT_FOUND,
          "Contracts not initialized"
        );
      }

      const sanitizedAmount = this.validateAndSanitizeInput(amount, "number");

      if (marketId < 0 || !Number.isInteger(marketId)) {
        throw new BettingError(
          BettingErrorType.INVALID_MARKET,
          "Invalid market ID"
        );
      }

      const userAddress = await this.signer.getAddress();
      const decimals = await this.usdtContract!.decimals();
      const amountWei = ethers.parseUnits(sanitizedAmount, decimals);

      if (amountWei <= 0n) {
        console.error("Amount must be greater than zero");
        throw new BettingError(
          BettingErrorType.INVALID_AMOUNT,
          "Amount must be greater than zero"
        );
      }

      if (amountWei > this.MAX_UINT256) {
        throw new BettingError(
          BettingErrorType.INVALID_AMOUNT,
          "Amount exceeds uint256 maximum"
        );
      }

      await this.approveUSDT(sanitizedAmount);
      const validations = await this.performSecurityValidations(
        userAddress,
        amountWei,
        decimals
      );

      if (!validations.isValidNetwork || !validations.hasValidContracts) {
        throw new BettingError(
          BettingErrorType.NETWORK_MISMATCH,
          "Security validation failed"
        );
      }

      const tx = await this.bettingContract.placeBet(marketId, amountWei);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
        gasUsed: receipt?.gasUsed?.toString(),
      };
    } catch (error: any) {
      if (error instanceof BettingError) {
        return { success: false, error };
      }

      if (error.code === 4001) {
        console.warn("Transaction rejected by user");
        return {
          success: false,
          error: new BettingError(
            BettingErrorType.USER_REJECTED,
            "Transaction rejected by user"
          ),
        };
      }

      return {
        success: false,
        error: new BettingError(
          BettingErrorType.TRANSACTION_FAILED,
          error.message || "Unknown error occurred"
        ),
      };
    }
  }

  // Comprehensive security validations
  private async performSecurityValidations(
    userAddress: string,
    amountWei: bigint,
    decimals: number
  ): Promise<SecurityValidation> {
    const results: SecurityValidation = {
      isValidNetwork: false,
      isValidAmount: false,
      hasValidContracts: false,
      isRateLimited: false,
    };

    try {
      await this.validateNetwork();
      results.isValidNetwork = true;

      await this.validateContracts(this.currentNetwork!);
      results.hasValidContracts = true;

      // Balance validation
      const balance = await this.usdtContract!.balanceOf(userAddress);
      if (balance < amountWei) {
        throw new BettingError(
          BettingErrorType.INSUFFICIENT_BALANCE,
          `Insufficient balance. You have ${ethers.formatUnits(
            balance,
            decimals
          )} USDT`
        );
      }

      // Allowance validation
      const allowance = await this.usdtContract!.allowance(
        userAddress,
        this.currentNetwork!.bettingEscrow
      );
      if (allowance < amountWei) {
        throw new BettingError(
          BettingErrorType.INSUFFICIENT_ALLOWANCE,
          `Insufficient allowance. Please approve ${ethers.formatUnits(
            amountWei,
            decimals
          )} USDT`
        );
      }

      results.isValidAmount = true;
      results.isRateLimited = false;
    } catch (error) {
      if (error instanceof BettingError) {
        throw error;
      }
      throw new BettingError(
        BettingErrorType.TRANSACTION_FAILED,
        "Security validation failed"
      );
    }

    return results;
  }

  /**
   * Retrieves market information including total escrow, user participation, and validity.
   * @param {number} marketId The ID of the market to retrieve information for.
   * @return {Promise<{ totalEscrow: string; userParticipated: boolean; isValid: boolean }>} Market information.
   * @throws {Error} If contracts are not initialized or if retrieval fails.
   */
  async getMarketInfo(marketId: number): Promise<{
    totalEscrow: string;
    userParticipated: boolean;
    isValid: boolean;
  }> {
    if (!this.bettingContract || !this.signer) {
      throw new Error("Contracts not initialized");
    }

    const userAddress = await this.signer.getAddress();
    const decimals = await this.usdtContract!.decimals();

    try {
      const [totalEscrow, userParticipated] = await Promise.all([
        this.bettingContract.marketEscrow(marketId),
        this.bettingContract.containsParticipant(marketId, userAddress),
      ]);

      return {
        totalEscrow: ethers.formatUnits(totalEscrow, decimals),
        userParticipated,
        isValid: true,
      };
    } catch (error) {
      return {
        totalEscrow: "0",
        userParticipated: false,
        isValid: false,
      };
    }
  }

  async fetchVolume(): Promise<bigint> {
    if (!this.bettingContract || !this.usdtContract) {
      throw new Error("Contracts not initialized");
    }

    const decimals: number = await this.usdtContract.decimals();
    const volume: number = await this.bettingContract.volume();
    return BigInt(volume) / BigInt(10) ** BigInt(decimals);
  }

  async fetchNumActiveBets(): Promise<bigint> {
    if (!this.bettingContract || !this.usdtContract) {
      throw new Error("Contracts not initialized");
    }

    return await this.bettingContract.activeBetCount();
  }
}
