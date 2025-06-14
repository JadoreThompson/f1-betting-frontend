export interface SecurityValidation {
  isValidNetwork: boolean;
  isValidAmount: boolean;
  hasValidContracts: boolean;
  isRateLimited: boolean;
}