use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{StdResult, Storage};
use cosmwasm_storage::{singleton, singleton_read};

const KEY_CONFIG: &[u8] = b"config";

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct Config {}

pub fn store_config(storage: &mut dyn Storage, config: &Config) -> StdResult<()> {
    singleton::<Config>(storage, KEY_CONFIG).save(config)
}

pub fn read_config(storage: &dyn Storage) -> StdResult<Config> {
    singleton_read::<Config>(storage, KEY_CONFIG).load()
}
