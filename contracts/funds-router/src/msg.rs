use cosmwasm_std::{Addr, Binary, Uint128};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    pub registry: String,
    pub reg_user_fee_veri_forwarder: String,
    pub fund_denom: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct MigrateMsg {}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    // Deposit funds to fund the execution of requests by `spender`
    DepositFund {
        spender: String,
    },
    // Withdraw funds from `info.sender` to `recipient`
    WithdrawFund {
        recipient: String,
        amount: Uint128,
    },
    // Forward an arbitrary number of calls.  These could be to
    // contracts that just test a condition, such as time or a price,
    // or to contracts to execute an action and change the state of
    // that contract, such as rebalancing a portfolio, or simply
    // sending fund. This function takes into account any fund received
    // during any of the calls and adds it to `user`'s balance, enabling
    // requests to be made without any deposited funds if the receiving
    // contract pays some kind of reward for calling it.
    ForwardCalls {
        user: String,
        fee_amount: Uint128,
        fcn_data: Vec<FcnData>,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct FcnData {
    pub target: Addr,
    pub call_data: Binary,
    pub fund_for_call: Uint128,
}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    // Config returns the current configuration(Registry address, ...)
    Config {},
    // GetBalance returns the current balance of user wallet address
    GetBalance { user_addr: String },
}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct ConfigResponse {
    pub registry: String,
    pub reg_user_fee_veri_forwarder: String,
    pub fund_denom: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct UsrBalanceResponse {
    pub user_addr: String,
    pub balance: Uint128,
}
