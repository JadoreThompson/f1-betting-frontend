import { ValidationError } from "./errors/ValidationError";

export function CheckContractsInitialised<
  T extends { bettingContract: any; usdtContract: any; usdtDecimals: any }
>(target: any, propertyKey: string, descriptor: PropertyDescriptor): any {
  const originalMethod = descriptor.value;

  descriptor.value = function (this: T, ...args: any[]) {
    if (!this.bettingContract || !this.usdtContract || !this.usdtDecimals)
      throw new ValidationError("Contracts not initialised!");
    return originalMethod.apply(this, args);
  };

  return descriptor;
}
