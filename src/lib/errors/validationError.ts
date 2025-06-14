export enum ValidationErrorType {
  INSUFFICIENT_BALANCE = 0,
  REQUIRES_APPROVAL = 1,
  COMMON = 2,
}

export class ValidationError extends Error {
  public type: ValidationErrorType;

  constructor(message: string, type?: ValidationErrorType) {
    super(message);
    this.type = type || ValidationErrorType.COMMON;
  }
}
