import { ChainId, type NetworkConfig } from "./types/networkConfig";

const NETWORK_CONFIGS: Record<ChainId, NetworkConfig> = {
  [ChainId.MAINNET]: {
    name: "Ethereum Mainnet",
    chainId: ChainId.MAINNET,
    hexChainId: "0x1",
    bettingEscrow: "0x...",
    usdt: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    blockExplorer: "https://etherscan.io",
  },
  [ChainId.SEPOLIA]: {
    name: "Sepolia Testnet",
    chainId: ChainId.SEPOLIA,
    hexChainId: "0xaa36a7",
    bettingEscrow: "0x4a1d32242f6a589D49060eC26E4f18B29e8a19FA",
    usdt: "0x92A1c620751ba38e885461c3e356D41a226962f3",
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
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
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

export { BETTING_ESCROW_ABI, NETWORK_CONFIGS, USDT_ABI };
