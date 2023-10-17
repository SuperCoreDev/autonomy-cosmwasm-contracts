// This contract is required in case something does not work with other existing contracts
// It asserts that the error does not come from cosmos-related logic and that it is possible to interact with contracts

#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;

use cosmwasm_std::{
    to_binary, Binary, Deps, DepsMut, Env, MessageInfo,
    Response, StdResult
};

use crate::error::{ ContractError };
use crate::msg::{ InstantiateMsg, ExecuteMsg, QueryMsg, QueryResponse };

// Instantiates a contract
// Immediately returns a response, has no state
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    mut _deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    _msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    Ok(Response::default())
}

// Executes a contract
// Returns most basic response
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    _deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::DoNothing {  } => Ok(Response::new().add_attribute("Execute", "Success"))
    }
}

// Queries a contract 
// Returns most basic response
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(
    _deps: Deps, 
    _env: Env, 
    _msg: QueryMsg
) -> StdResult<Binary> {
    to_binary(&QueryResponse{
        response: "OK".to_owned()
    })
}