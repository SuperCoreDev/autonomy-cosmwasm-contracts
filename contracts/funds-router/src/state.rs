use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct Config {
    // The Autonomy Registry to send the execution fee to
    pub registry: Addr,
    // The forwarder used by the Registry to guarantee that calls from it
    // have the correct `user` and `fee_amt` arguments
    pub reg_user_fee_veri_forwarder: Addr,
    pub fund_denom: String,
}

pub const CONFIG: Item<Config> = Item::new("config");

// UST balances to pay for execution fees
pub const BALANCES: Map<Addr, Uint128> = Map::new("balances");
