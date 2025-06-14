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
