#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;

use cosmwasm_std::{
    attr, to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdError, StdResult,
};

use crate::msg::{
    ExecuteMsg, InstantiateMsg, LastExecTimeResponse, MigrateMsg, QueryMsg, StateResponse,
};
use crate::state::{STATE, USER_2_ID_2_LAST_EXEC_TIME};

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    let router_user_veri_forwarder = deps.api.addr_validate(&msg.router_user_veri_forwarder)?;
    STATE.save(
        deps.storage,
        &crate::state::State {
            router_user_veri_forwarder,
        },
    )?;
    Ok(Response::default())
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn migrate(_deps: DepsMut, _env: Env, _msg: MigrateMsg) -> StdResult<Response> {
    Ok(Response::new())
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> StdResult<Response> {
    match msg {
        ExecuteMsg::EveryTimePeriod {
            user,
            call_id,
            start_time,
            period_length,
        } => save_exec_time(deps, env, info, user, call_id, start_time, period_length),
    }
}

fn save_exec_time(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    user: String,
    call_id: u64,
    start_time: u64,
    period_length: u64,
) -> StdResult<Response> {
    let mut res = Response::default();
    let router_user_veri_forwarder = STATE.load(deps.storage)?.router_user_veri_forwarder;
    if info.sender != router_user_veri_forwarder {
        return Err(StdError::GenericErr {
            msg: "TimeConditions: not userForw".to_string(),
        });
    }

    let last_exec_time = USER_2_ID_2_LAST_EXEC_TIME
        .may_load(deps.storage, (user.to_string(), call_id.to_string()))?
        .unwrap_or(0_u64);
    let curr_epoch = env.block.time.seconds();

    // immediately execute the first time
    if last_exec_time == 0 {
        if curr_epoch < start_time {
            return Err(StdError::GenericErr {
                msg: "TimeConditions: not passed start".to_string(),
            });
        }
        USER_2_ID_2_LAST_EXEC_TIME.save(
            deps.storage,
            (user.clone(), call_id.to_string()),
            &start_time,
        )?;

        res = res.add_attributes(vec![
            attr("status", "started"),
            attr("user", user),
            attr("call_id", call_id.to_string()),
        ]);
    } else {
        let next_exec_time = last_exec_time + period_length;
        if curr_epoch < next_exec_time {
            return Err(StdError::GenericErr {
                msg: "TimeConditions: too early period".to_string(),
            });
        }
        USER_2_ID_2_LAST_EXEC_TIME.save(
            deps.storage,
            (user, call_id.to_string()),
            &next_exec_time,
        )?;
    }

    Ok(res)
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::BetweenTimes {
            after_time,
            before_time,
        } => to_binary(&query_between_times(env, after_time, before_time)?),
        QueryMsg::GetState {} => to_binary(&query_state(deps)?),
        QueryMsg::GetLastExecTime { user, id } => to_binary(&query_last_exec_time(deps, user, id)?),
    }
}

pub fn query_state(deps: Deps) -> StdResult<StateResponse> {
    let router_user_veri_forwarder = STATE
        .load(deps.storage)?
        .router_user_veri_forwarder
        .to_string();

    Ok(StateResponse {
        router_user_veri_forwarder,
    })
}

fn query_between_times(env: Env, after_time: u64, before_time: u64) -> StdResult<bool> {
    let curr_epoch = env.block.time.seconds();
    Ok(after_time <= curr_epoch && curr_epoch <= before_time)
}

fn query_last_exec_time(deps: Deps, user: String, id: u64) -> StdResult<LastExecTimeResponse> {
    let user_addr = deps.api.addr_validate(&user)?;
    let last_exec_time = USER_2_ID_2_LAST_EXEC_TIME
        .may_load(deps.storage, (user_addr.to_string(), id.to_string()))?
        .unwrap_or(0_u64);
    Ok(LastExecTimeResponse {
        user,
        id,
        last_exec_time,
    })
}
