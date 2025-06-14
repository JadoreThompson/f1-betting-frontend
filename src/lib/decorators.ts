import { Web3Error } from "./errors/web3Error";

export function CheckContractsInitialised<
  T extends BettingService
>(target: any, propertyKey: string, descriptor: PropertyDescriptor): any {
  const originalMethod = descriptor.value;

  descriptor.value = function (this: T, ...args: any[]) {
    if (!this.bettingContract || !this.usdtContract || !this.usdtDecimals)
      throw new Web3Error("Contracts not initialised!");
    return originalMethod.apply(this, args);
  };

  return descriptor;
}
