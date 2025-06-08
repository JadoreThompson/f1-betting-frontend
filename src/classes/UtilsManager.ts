export class UtilsManager {
  static BASE_URL: string = import.meta.env.VITE_BASE_URL;
  static TX_PREFIX: string = import.meta.env.VITE_TXN_PREFIX;

  static toCamelCase(value: string): string {
    return value
      .split("_")
      .map((val) => val.charAt(0).toUpperCase() + val.slice(1))
      .join(" ");
  }
}
