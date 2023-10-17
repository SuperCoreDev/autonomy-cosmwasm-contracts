export interface ConfigResponse {
  auto: AssetInfo;
  stan_stake: string;
  blocks_in_epoch: number;
}

export interface StateResponse {
  curr_executing_request_id: number;
  total_requests: number;
  total_stake_amount: string;
  stakes_len: number;
}

export interface NativeToken {
  denom: string;
}

export interface Token {
  contract_addr: string;
}

export interface AssetInfo {
  token?: Token;
  native_token?: NativeToken;
}

export interface Asset {
  info: AssetInfo;
  amount: string;
}

export interface Request {
  user: string;
  executor: string;
  target: string;
  msg: string;
  input_asset: Asset;
  created_at: number;
  status: string;
}

export interface RequestInfoResponse {
  id: number;
  request: Request;
}

export interface RequestsResponse {
  requests: RequestInfoResponse[];
}
