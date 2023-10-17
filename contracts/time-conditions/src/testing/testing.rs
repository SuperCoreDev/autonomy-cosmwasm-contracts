use crate::contract::{execute, instantiate, query};
use crate::msg::{ExecuteMsg, InstantiateMsg, LastExecTimeResponse, QueryMsg, StateResponse};
use crate::testing::mock_querier::mock_dependencies;

use autonomy::asset::{Asset, AssetInfo};
use cosmwasm_std::testing::{mock_env, mock_info};
use cosmwasm_std::{
    attr, from_binary, to_binary, BankMsg, Coin, CosmosMsg, Decimal, StdError, SubMsg, Uint128,
    WasmMsg,
};
const ROUTER_USER_VERI_FORWARDER: &str = "router-user-veri-forwarder";

#[test]
fn proper_initialization() {
    let mut deps = mock_dependencies(&[]);

    let msg = InstantiateMsg {
        router_user_veri_forwarder: ROUTER_USER_VERI_FORWARDER.to_string(),
    };

    let info = mock_info("addr0000", &[]);
    let _res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();

    assert_eq!(
        from_binary::<StateResponse>(
            &query(deps.as_ref(), mock_env(), QueryMsg::GetState {}).unwrap()
        )
        .unwrap(),
        StateResponse {
            router_user_veri_forwarder: ROUTER_USER_VERI_FORWARDER.to_string(),
        }
    );
}

#[test]
fn test_save_exec_time() {
    let mut deps = mock_dependencies(&[]);

    let msg = InstantiateMsg {
        router_user_veri_forwarder: ROUTER_USER_VERI_FORWARDER.to_string(),
    };

    let info = mock_info("addr0000", &[]);
    let _res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();

    // Fail to "save_exec_time", since non-forwarder address sends tx
    let info = mock_info("anyone", &[]);
    let curr_epoch = mock_env().block.time.seconds();
    let msg = ExecuteMsg::EveryTimePeriod {
        user: "user".to_string(),
        call_id: 1,
        start_time: curr_epoch - 1,
        period_length: curr_epoch + 1,
    };
    let err = execute(deps.as_mut(), mock_env(), info, msg).unwrap_err();

    assert_eq!(
        err,
        StdError::GenericErr {
            msg: "TimeConditions: not userForw".to_string()
        }
    );

    // Fail to "save_exec_time", since current time has not passed `start`.
    let info = mock_info(ROUTER_USER_VERI_FORWARDER, &[]);
    let curr_epoch = mock_env().block.time.seconds();
    let msg = ExecuteMsg::EveryTimePeriod {
        user: "user".to_string(),
        call_id: 1,
        start_time: curr_epoch + 1,
        period_length: curr_epoch + 3,
    };
    let err = execute(deps.as_mut(), mock_env(), info, msg).unwrap_err();

    assert_eq!(
        err,
        StdError::GenericErr {
            msg: "TimeConditions: not passed start".to_string()
        }
    );

    // Succeed to "save_exec_time"
    let info = mock_info(ROUTER_USER_VERI_FORWARDER, &[]);
    let start_time = mock_env().block.time.seconds() - 1;
    let period_length = 100;
    let msg = ExecuteMsg::EveryTimePeriod {
        user: "user".to_string(),
        call_id: 1,
        start_time,
        period_length,
    };
    let _res = execute(deps.as_mut(), mock_env(), info, msg).unwrap();

    // Query the `last_exec_time`
    let res = query(
        deps.as_ref(),
        mock_env(),
        QueryMsg::GetLastExecTime {
            user: "user".to_string(),
            id: 1,
        },
    )
    .unwrap();
    let last_exec_time_resp: LastExecTimeResponse = from_binary(&res).unwrap();
    assert_eq!(last_exec_time_resp.last_exec_time, start_time);
}

#[test]
fn test_query_between_times() {
    let mut deps = mock_dependencies(&[]);

    let msg = InstantiateMsg {
        router_user_veri_forwarder: ROUTER_USER_VERI_FORWARDER.to_string(),
    };

    let info = mock_info("addr0000", &[]);
    let _res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();

    // Query the "between_times"
    let after_time = mock_env().block.time.seconds() - 1;
    let before_time = mock_env().block.time.seconds() + 3;
    let res = query(
        deps.as_ref(),
        mock_env(),
        QueryMsg::BetweenTimes {
            after_time,
            before_time,
        },
    )
    .unwrap();
    let resp: bool = from_binary(&res).unwrap();
    assert!(resp, "Should return true");
}
