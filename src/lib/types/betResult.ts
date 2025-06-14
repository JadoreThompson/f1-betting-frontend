import type { BettingError } from "../errors/bettingError";

export interface BetResult {
  success: boolean;
  transactionHash?: string;
  error?: BettingError;
  gasUsed?: string;
}
