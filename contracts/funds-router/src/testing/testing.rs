use crate::contract::{execute, instantiate, query};
use crate::msg::{ConfigResponse, ExecuteMsg, InstantiateMsg, QueryMsg, UsrBalanceResponse};
use crate::testing::mock_querier::mock_dependencies;
use cosmwasm_std::testing::{mock_env, mock_info};
use cosmwasm_std::{attr, coins, from_binary, StdError, Uint128};

#[test]
fn proper_initialization() {
    let registry = "registry-address";
    let reg_user_fee_veri_forwarder = "regi-user-fee-veri-forwarder";

    let mut deps = mock_dependencies(&[]);

    let msg = InstantiateMsg {
        registry: registry.to_string(),
        reg_user_fee_veri_forwarder: reg_user_fee_veri_forwarder.to_string(),
        fund_denom: "uluna".to_string(),
    };
    let info = mock_info("creator", &coins(1000, "earth"));

    // we can just call .unwrap() to assert this was a success
    let res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();
    assert_eq!(0, res.messages.len());

    // it worked, let's query the config
    let res = query(deps.as_ref(), mock_env(), QueryMsg::Config {}).unwrap();
    let config: ConfigResponse = from_binary(&res).unwrap();
    assert_eq!(registry.to_string(), config.registry);
}

#[test]
fn test_deposit_fund() {
    let registry = "registry-address";
    let reg_user_fee_veri_forwarder = "regi-user-fee-veri-forwarder";
    let router_user_veri_forwarder = "router-user-veri-forwarder";

    let mut deps = mock_dependencies(&[]);

    let msg = InstantiateMsg {
        registry: registry.to_string(),
        reg_user_fee_veri_forwarder: reg_user_fee_veri_forwarder.to_string(),
        fund_denom: "uluna".to_string(),
    };
    let info = mock_info("creator", &coins(1000, "earth"));

    // we can just call .unwrap() to assert this was a success
    let _res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();

    // Try to "deposit_fund"
    let spender = "spender";
    let msg = ExecuteMsg::DepositFund {
        spender: spender.to_string(),
    };
    let info = mock_info("anyone", &coins(100, "uluna"));

    let res = execute(deps.as_mut(), mock_env(), info, msg).unwrap();
    assert_eq!(
        res.attributes,
        vec![
            attr("method", "deposit_fund"),
            attr("spender", spender.to_string()),
            attr("amount", "100"),
        ]
    );

    // Try to query the `spender` balance
    let res = query(
        deps.as_ref(),
        mock_env(),
        QueryMsg::GetBalance {
            user_addr: spender.to_string(),
        },
    )
    .unwrap();
    let usr_balance: UsrBalanceResponse = from_binary(&res).unwrap();
    assert_eq!(usr_balance.balance, Uint128::from(100_u128));
}

#[test]
fn test_withdraw_fund() {
    let registry = "registry-address";
    let reg_user_fee_veri_forwarder = "regi-user-fee-veri-forwarder";

    let mut deps = mock_dependencies(&[]);

    let msg = InstantiateMsg {
        registry: registry.to_string(),
        reg_user_fee_veri_forwarder: reg_user_fee_veri_forwarder.to_string(),
        fund_denom: "uluna".to_string(),
    };
    let info = mock_info("creator", &coins(1000, "earth"));

    // we can just call .unwrap() to assert this was a success
    let _res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();

    // Deposits 100 uluna to `spender`
    let spender = "spender";
    let msg = ExecuteMsg::DepositFund {
        spender: spender.to_string(),
    };
    let info = mock_info("anyone", &coins(100, "uluna"));

    let _res = execute(deps.as_mut(), mock_env(), info, msg).unwrap();

    // Try to withdraw UST from non-`spender`
    let info = mock_info("non-spender", &[]);
    let msg = ExecuteMsg::WithdrawFund {
        recipient: "recipient".to_string(),
        amount: Uint128::from(30_u128),
    };
    let err = execute(deps.as_mut(), mock_env(), info, msg).unwrap_err();
    assert_eq!(
        err,
        StdError::GenericErr {
            msg: "Insufficient funds".to_string()
        }
    );

    // Try to over-withdraw UST from `spender`
    let info = mock_info("spender", &[]);
    let msg = ExecuteMsg::WithdrawFund {
        recipient: "recipient".to_string(),
        amount: Uint128::from(130_u128),
    };
    let err = execute(deps.as_mut(), mock_env(), info, msg).unwrap_err();
    assert_eq!(
        err,
        StdError::GenericErr {
            msg: "Insufficient funds".to_string()
        }
    );

    // Try to withdraw 0 UST from `spender`
    let info = mock_info("spender", &[]);
    let msg = ExecuteMsg::WithdrawFund {
        recipient: "recipient".to_string(),
        amount: Uint128::zero(),
    };
    let err = execute(deps.as_mut(), mock_env(), info, msg).unwrap_err();
    assert_eq!(
        err,
        StdError::GenericErr {
            msg: "Requested zero amount".to_string()
        }
    );

    // Succeed to withdraw the UST
    let info = mock_info("spender", &[]);
    let msg = ExecuteMsg::WithdrawFund {
        recipient: "recipient".to_string(),
        amount: Uint128::from(30_u128),
    };
    let res = execute(deps.as_mut(), mock_env(), info, msg).unwrap();
    assert_eq!(1, res.messages.len());
    assert_eq!(
        res.attributes,
        vec![
            attr("method", "withdraw_fund"),
            attr("recipient", "recipient"),
            attr("amount", "30"),
        ]
    )
}

#[test]
fn test_forward_calls() {
    let registry = "registry-address";
    let reg_user_fee_veri_forwarder = "regi-user-fee-veri-forwarder";

    let mut deps = mock_dependencies(&[]);

    let msg = InstantiateMsg {
        registry: registry.to_string(),
        reg_user_fee_veri_forwarder: reg_user_fee_veri_forwarder.to_string(),
        fund_denom: "uluna".to_string(),
    };
    let info = mock_info("creator", &coins(1000, "earth"));

    // we can just call .unwrap() to assert this was a success
    let _res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();

    // Try to "deposit_fund"
    let spender = "spender";
    let msg = ExecuteMsg::DepositFund {
        spender: spender.to_string(),
    };
    let info = mock_info("anyone", &coins(100, "uluna"));

    let _res = execute(deps.as_mut(), mock_env(), info, msg).unwrap();

    // Fail to "forward_call" since `info.sender` is not forward contract
    let info = mock_info("anyone", &coins(100, "uluna"));
    let msg = ExecuteMsg::ForwardCalls {
        user: "anyone".to_string(),
        fee_amount: Uint128::from(10_u128),
        fcn_data: vec![],
    };
    let err = execute(deps.as_mut(), mock_env(), info, msg).unwrap_err();
    assert_eq!(
        err,
        StdError::GenericErr {
            msg: "FRouter: not userFeeForw".to_string()
        }
    );

    // Fail to "forward_call" since there is no enough funds
    let info = mock_info(reg_user_fee_veri_forwarder, &[]);
    let msg = ExecuteMsg::ForwardCalls {
        user: "anyone".to_string(),
        fee_amount: Uint128::from(10_u128),
        fcn_data: vec![],
    };
    let err = execute(deps.as_mut(), mock_env(), info, msg).unwrap_err();
    assert_eq!(
        err,
        StdError::GenericErr {
            msg: "Insufficient funds".to_string()
        }
    );

    // Succeed to "forward_call"
    let info = mock_info(reg_user_fee_veri_forwarder, &[]);
    let msg = ExecuteMsg::ForwardCalls {
        user: "spender".to_string(),
        fee_amount: Uint128::from(10_u128),
        fcn_data: vec![],
    };
    let res = execute(deps.as_mut(), mock_env(), info, msg).unwrap();
    // There is only 1 message, which sends the `fee` to `registry` contract
    assert_eq!(1, res.messages.len());

    // Try to query the `spender` balance
    let res = query(
        deps.as_ref(),
        mock_env(),
        QueryMsg::GetBalance {
            user_addr: spender.to_string(),
        },
    )
    .unwrap();
    let usr_balance: UsrBalanceResponse = from_binary(&res).unwrap();
    assert_eq!(usr_balance.balance, Uint128::from(90_u128));
}
