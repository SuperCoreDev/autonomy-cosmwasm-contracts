use cosmwasm_std::Addr;
use cw_storage_plus::{Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct State {
    pub router_user_veri_forwarder: Addr,
}

// Storage to save "router_user_veri_forwarder"
pub const STATE: Item<State> = Item::new("state");

// Mapping a user to last execution date of its ongoing requests
// - because a user can have multiple requests, we introduce an arbitrary requestID (also refered as `callId`)
// - users can know their previous `callId`s by looking at emitted `Started` events
// mapping : Address(String) => (uint(String) => uint(u64))
pub const USER_2_ID_2_LAST_EXEC_TIME: Map<(String, String), u64> =
    Map::new("userToIdToLastExecTime");
