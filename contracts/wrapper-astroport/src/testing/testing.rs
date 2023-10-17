use crate::contract::{execute, instantiate};
use crate::msg::{ExecuteMsg, InstantiateMsg};
use crate::testing::mock_querier::mock_dependencies;

use autonomy::asset::{Asset, AssetInfo};
use cosmwasm_std::testing::{mock_env, mock_info};
use cosmwasm_std::{
    attr, to_binary, Addr, Coin, CosmosMsg, Decimal, StdError, SubMsg, Uint128, WasmMsg,
};
use cw20::Cw20ExecuteMsg;

#[test]
fn proper_initialization() {
    let mut deps = mock_dependencies(&[]);

    let msg = InstantiateMsg {};

    let info = mock_info("addr0000", &[]);
    let _res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();
}

#[test]
fn execute_swap_cw20() {
    let mut deps = mock_dependencies(&[]);

    let msg = InstantiateMsg {};

    let info = mock_info("addr0000", &[]);
    let _res = instantiate(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();

    let msg = ExecuteMsg::Swap {
        user: "user".to_string(),
        contract_addr: "contract0000".to_string(),
        swap_msg: to_binary("swap_msg").unwrap(),
        offer_asset: Asset {
            amount: Uint128::from(100u128),
            info: AssetInfo::Token {
                contract_addr: Addr::unchecked("input"),
            },
        },
        output_asset: AssetInfo::Token {
            contract_addr: Addr::unchecked("output"),
        },
        min_output: Uint128::from(10u128),
        max_output: Uint128::from(100u128),
        recipient_exist: false,
    };

    let env = mock_env();
    let res = execute(deps.as_mut(), env.clone(), info, msg).unwrap();
    assert_eq!(res.attributes, vec![attr("action", "execute_swap"),]);

    assert_eq!(res.messages.len(), 2);
}

#[test]
fn execute_swap_native() {
    let mut deps = mock_dependencies(&[]);
    deps.querier.with_tax(
        Decimal::percent(5),
        &[
            (&"uluna".to_string(), &Uint128::new(1000000u128)),
            (&"ukrw".to_string(), &Uint128::new(1000000u128)),
        ],
    );

    let msg = InstantiateMsg {};

    let info = mock_info("addr0000", &[]);
    let _res = instantiate(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();

    let offer_asset = Asset {
        amount: Uint128::from(1000000u128),
        info: AssetInfo::NativeToken {
            denom: "uluna".to_string(),
        },
    };
    let msg = ExecuteMsg::Swap {
        user: "user".to_string(),
        contract_addr: "contract0000".to_string(),
        swap_msg: to_binary("swap_msg").unwrap(),
        offer_asset,
        output_asset: AssetInfo::Token {
            contract_addr: Addr::unchecked("output"),
        },
        min_output: Uint128::from(10u128),
        max_output: Uint128::from(100u128),
        recipient_exist: false,
    };

    let env = mock_env();
    let res = execute(deps.as_mut(), env.clone(), info, msg).unwrap();
    assert_eq!(res.attributes, vec![attr("action", "execute_swap"),]);

    assert_eq!(
        res.messages,
        vec![
            SubMsg::new(CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr: "contract0000".to_string(),
                funds: vec![Coin {
                    denom: "uluna".to_string(),
                    amount: Uint128::from(1000000u128)
                }],
                msg: to_binary("swap_msg").unwrap(),
            })),
            SubMsg::new(CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr: env.contract.address.to_string(),
                msg: to_binary(&ExecuteMsg::CheckRange {
                    asset: AssetInfo::Token {
                        contract_addr: Addr::unchecked("output")
                    },
                    user: "user".to_string(),
                    balance_before: Uint128::zero(),
                    min_output: Uint128::from(10u128),
                    max_output: Uint128::from(100u128)
                })
                .unwrap(),
                funds: vec![]
            })),
        ],
    );
}

#[test]
fn execute_check_range() {
    let mut deps = mock_dependencies(&[]);

    deps.querier.with_token_balances(&[(
        &String::from("token0000"),
        &[(&String::from("contract0000"), &Uint128::from(100u128))],
    )]);

    let msg = InstantiateMsg {};

    let info = mock_info("addr0000", &[]);
    let _res = instantiate(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();

    let asset = AssetInfo::Token {
        contract_addr: Addr::unchecked("token0000"),
    };
    let msg = ExecuteMsg::CheckRange {
        user: "addr0000".to_string(),
        asset: asset.clone(),
        balance_before: Uint128::zero(),
        min_output: Uint128::from(101u128),
        max_output: Uint128::from(101u128),
    };

    let env = mock_env();
    let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);
    match res {
        Err(StdError::GenericErr { msg, .. }) => assert_eq!(msg, "invalid output"),
        _ => panic!("DO NOT ENTER HERE"),
    }

    let msg = ExecuteMsg::CheckRange {
        user: "addr0000".to_string(),
        asset,
        balance_before: Uint128::zero(),
        min_output: Uint128::from(99u128),
        max_output: Uint128::from(101u128),
    };

    let mut env = mock_env();
    env.contract.address = Addr::unchecked("contract0000");
    let res = execute(deps.as_mut(), env.clone(), info, msg).unwrap();
    assert_eq!(res.attributes, vec![attr("action", "execute_check_range"),]);
}
