export enum ChainId {
  MAINNET = 1,
  SEPOLIA = 11155111,
}

export interface NetworkConfig {
  name: string;
  chainId: ChainId;
  hexChainId: string;
  bettingEscrow: string;
  usdt: string;
  blockExplorer: string;
}