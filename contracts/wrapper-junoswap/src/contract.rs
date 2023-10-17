use std::ops::Sub;

use autonomy::{
    asset::{Asset, AssetInfo},
    querier::{query_balance, query_token_balance},
};
#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;

use cosmwasm_std::{
    to_binary, BankMsg, Binary, Coin, CosmosMsg, Deps, DepsMut, Env, MessageInfo, Response,
    StdError, StdResult, Uint128, WasmMsg,
};
use cw20::Cw20ExecuteMsg;

use crate::{
    msg::{ExecuteMsg, InstantiateMsg, MigrateMsg, QueryMsg},
    state::{store_config, Config},
};

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    _msg: InstantiateMsg,
) -> StdResult<Response> {
    store_config(deps.storage, &Config {})?;

    Ok(Response::default())
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn migrate(_deps: DepsMut, _env: Env, _msg: MigrateMsg) -> StdResult<Response> {
    Ok(Response::new())
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> StdResult<Response> {
    match msg {
        ExecuteMsg::Swap {
            user,
            contract_addr,
            swap_msg,
            input_token,
            output_token,
            input_amount,
            min_output,
            max_output,
            recipient_exist,
        } => execute_swap(
            deps,
            env,
            info,
            user,
            contract_addr,
            swap_msg,
            input_token,
            output_token,
            input_amount,
            min_output,
            max_output,
            recipient_exist,
        ),
        ExecuteMsg::CheckRange {
            user,
            asset,
            balance_before,
            min_output,
            max_output,
        } => execute_check_range(
            deps,
            env,
            info,
            user,
            asset,
            balance_before,
            min_output,
            max_output,
        ),
    }
}

pub fn execute_swap(
    deps: DepsMut,
    env: Env,
    _info: MessageInfo,
    user: String,
    contract_addr: String,
    swap_msg: Binary,
    input_token: AssetInfo,
    output_token: AssetInfo,
    input_amount: Uint128,
    min_output: Uint128,
    max_output: Uint128,
    recipient_exist: bool,
) -> StdResult<Response> {
    let target_addr = deps.api.addr_validate(&contract_addr)?;

    let mut funds = vec![];
    let mut msgs: Vec<CosmosMsg> = vec![];
    match input_token.clone() {
        AssetInfo::NativeToken { denom } => {
            funds.push(Coin {
                denom,
                amount: input_amount,
            });
        }
        AssetInfo::Token { contract_addr } => {
            msgs.push(CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr: contract_addr.to_string(),
                msg: to_binary(&Cw20ExecuteMsg::IncreaseAllowance {
                    spender: target_addr.to_string(),
                    amount: input_amount,
                    expires: None,
                })?,
                funds: vec![],
            }));
        }
    };

    let balance_before;
    match output_token.clone() {
        AssetInfo::NativeToken { denom } => {
            balance_before = query_balance(&deps.querier, env.contract.address.clone(), denom)?;
        }
        AssetInfo::Token { contract_addr } => {
            balance_before =
                query_token_balance(&deps.querier, contract_addr, env.contract.address.clone())?;
        }
    };

    msgs.push(CosmosMsg::Wasm(WasmMsg::Execute {
        contract_addr: target_addr.to_string(),
        funds,
        msg: swap_msg,
    }));
    // There are 3 possible swap cases for `JunoSwap`(wasmswap) -
    // `Swap`, `PassThroughSwap` & `SwapAndSendTo`.
    // In case of `SwapAndSendTo`, there exist a field -
    // `recipient` address which directly receives the swap result.
    // In this case, no need to do `check_range`.
    if !recipient_exist {
        msgs.push(CosmosMsg::Wasm(WasmMsg::Execute {
            contract_addr: env.contract.address.to_string(),
            msg: to_binary(&ExecuteMsg::CheckRange {
                asset: output_token,
                user: user.to_string(),
                balance_before,
                min_output,
                max_output,
            })?,
            funds: vec![],
        }));
    }
    Ok(Response::new()
        .add_messages(msgs)
        .add_attributes(vec![("action", "execute_swap")]))
}

pub fn execute_check_range(
    deps: DepsMut,
    env: Env,
    _info: MessageInfo,
    user: String,
    asset: AssetInfo,
    balance_before: Uint128,
    min_output: Uint128,
    max_output: Uint128,
) -> StdResult<Response> {
    let user_addr = deps.api.addr_validate(&user)?;
    let current_balance;
    match asset.clone() {
        AssetInfo::NativeToken { denom } => {
            current_balance = query_balance(&deps.querier, env.contract.address, denom)?;
        }
        AssetInfo::Token { contract_addr } => {
            current_balance =
                query_token_balance(&deps.querier, contract_addr, env.contract.address)?;
        }
    };

    let output = current_balance.sub(balance_before);
    if output.lt(&min_output) || output.gt(&max_output) {
        return Err(StdError::generic_err("invalid output"));
    }

    let mut msgs: Vec<CosmosMsg> = vec![];
    let output_asset = Asset {
        info: asset.clone(),
        amount: output,
    };
    match asset.clone() {
        AssetInfo::NativeToken { denom: _ } => {
            msgs.push(CosmosMsg::Bank(BankMsg::Send {
                to_address: user_addr.to_string(),
                amount: vec![output_asset.deduct_tax(&deps.querier)?],
            }));
        }
        AssetInfo::Token { contract_addr } => {
            msgs.push(CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr: contract_addr.to_string(),
                msg: to_binary(&Cw20ExecuteMsg::Transfer {
                    recipient: user_addr.to_string(),
                    amount: output,
                })?,
                funds: vec![],
            }));
        }
    };

    Ok(Response::new()
        .add_messages(msgs)
        .add_attributes(vec![("action", "execute_check_range")]))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(_deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {}
}
