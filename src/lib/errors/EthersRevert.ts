export interface EthersRevert {
  reason?: string;
  code?: string | number;
  revert?: {
    args?: any[];
    name?: string;
    signature?: string;
  };
}
