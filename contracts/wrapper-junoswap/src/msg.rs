use autonomy::asset::AssetInfo;
use cosmwasm_std::{Binary, Uint128};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct InstantiateMsg {}

#[derive(Serialize, Deserialize, Clone, Debug, JsonSchema)]
pub struct MigrateMsg {}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    Swap {
        user: String,
        contract_addr: String,
        swap_msg: Binary,
        input_token: AssetInfo,
        output_token: AssetInfo,
        input_amount: Uint128,
        min_output: Uint128,
        max_output: Uint128,
        recipient_exist: bool,
    },
    CheckRange {
        user: String,
        asset: AssetInfo,
        balance_before: Uint128,
        min_output: Uint128,
        max_output: Uint128,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {}

// We define a custom struct for each query response
#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct ConfigResponse {
    pub total_requests: u64,
}
