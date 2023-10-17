use autonomy::asset::{Asset, AssetInfo};
#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    attr, to_binary, BankMsg, Binary, Coin, CosmosMsg, Deps, DepsMut, Env, MessageInfo, Response,
    StdError, StdResult, Uint128, WasmMsg,
};
use cw2::set_contract_version;

use crate::msg::{
    ConfigResponse, ExecuteMsg, FcnData, InstantiateMsg, MigrateMsg, QueryMsg, UsrBalanceResponse,
};
use crate::state::{Config, BALANCES, CONFIG};

// version info for migration info
const CONTRACT_NAME: &str = "crates.io:funds-router";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    let registry = deps.api.addr_validate(&msg.registry)?;
    let reg_user_fee_veri_forwarder = deps.api.addr_validate(&msg.reg_user_fee_veri_forwarder)?;

    CONFIG.save(
        deps.storage,
        &Config {
            registry,
            reg_user_fee_veri_forwarder,
            fund_denom: msg.fund_denom,
        },
    )?;

    Ok(Response::new().add_attribute("method", "instantiate"))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn migrate(_deps: DepsMut, _env: Env, _msg: MigrateMsg) -> StdResult<Response> {
    Ok(Response::new())
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> StdResult<Response> {
    match msg {
        ExecuteMsg::DepositFund { spender } => deposit_fund(deps, info, spender),
        ExecuteMsg::WithdrawFund { recipient, amount } => {
            withdraw_fund(deps, info, recipient, amount)
        }
        ExecuteMsg::ForwardCalls {
            user,
            fee_amount,
            fcn_data,
        } => forward_calls(deps, env, info, user, fee_amount, fcn_data),
    }
}

fn deposit_fund(deps: DepsMut, info: MessageInfo, spender: String) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;
    let sent_funds = info
        .funds
        .into_iter()
        .filter(|c| c.denom == config.fund_denom)
        .collect::<Vec<Coin>>();
    if sent_funds.is_empty() || sent_funds[0].amount == Uint128::zero() {
        return Err(StdError::GenericErr {
            msg: "Insufficient funds".to_string(),
        });
    }
    let sent_fund_amount = sent_funds[0].amount;

    let spender = deps.api.addr_validate(&spender)?;
    let origin_balance = BALANCES
        .may_load(deps.storage, spender.clone())
        .map(|bal| bal.unwrap_or(Uint128::zero()))?;
    let new_balance = origin_balance + sent_fund_amount;
    BALANCES.save(deps.storage, spender.clone(), &new_balance)?;

    Ok(Response::new().add_attributes(vec![
        attr("method", "deposit_fund"),
        attr("spender", spender.to_string()),
        attr("amount", sent_fund_amount.to_string()),
    ]))
}

fn withdraw_fund(
    mut deps: DepsMut,
    info: MessageInfo,
    recipient: String,
    amount: Uint128,
) -> StdResult<Response> {
    if amount.is_zero() {
        return Err(StdError::GenericErr {
            msg: "Requested zero amount".to_string(),
        });
    }
    let sender = deps.api.addr_validate(info.sender.as_str())?;
    let recipient = deps.api.addr_validate(&recipient)?;

    let start_bal = BALANCES
        .may_load(deps.storage, sender.clone())
        .map(|bal| bal.unwrap_or(Uint128::zero()))?;
    if start_bal < amount {
        return Err(StdError::GenericErr {
            msg: "Insufficient funds".to_string(),
        });
    }

    let new_bal = start_bal - amount;
    BALANCES.save(deps.storage, sender, &new_bal)?;

    let fund_denom = CONFIG.load(deps.storage)?.fund_denom;
    let amount_to_send = calc_tax_deducted_asset(deps.branch(), fund_denom, amount)?;
    let msgs: Vec<CosmosMsg> = vec![CosmosMsg::Bank(BankMsg::Send {
        to_address: recipient.to_string(),
        amount: amount_to_send,
    })];
    Ok(Response::new().add_messages(msgs).add_attributes(vec![
        attr("method", "withdraw_fund"),
        attr("recipient", recipient.to_string()),
        attr("amount", amount.to_string()),
    ]))
}

fn forward_calls(
    mut deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    user: String,
    fee_amount: Uint128,
    fcn_data: Vec<FcnData>,
) -> StdResult<Response> {
    let Config {
        registry,
        reg_user_fee_veri_forwarder,
        fund_denom,
    } = CONFIG.load(deps.storage)?;

    let received_fund = info
        .funds
        .iter()
        .find(|c| c.denom == fund_denom.clone())
        .map(|c| c.amount)
        .unwrap_or(Uint128::zero());

    if info.sender != reg_user_fee_veri_forwarder {
        return Err(StdError::GenericErr {
            msg: "FRouter: not userFeeForw".to_string(),
        });
    }

    // Get the `user` balance
    let user = deps.api.addr_validate(&user)?;
    let user_balance = BALANCES
        .may_load(deps.storage, user.clone())
        .map(|bal| bal.unwrap_or(Uint128::zero()))?;

    let mut fund_sent: Uint128 = Uint128::zero();

    // Execute every `FcnData`
    let mut msgs: Vec<CosmosMsg> = vec![];
    for data in fcn_data {
        let fund_for_call = data.fund_for_call;
        fund_sent += fund_for_call;
        let funds = if fund_for_call.is_zero() {
            vec![]
        } else {
            calc_tax_deducted_asset(deps.branch(), fund_denom.clone(), fund_for_call)?
        };
        msgs.push(CosmosMsg::Wasm(WasmMsg::Execute {
            contract_addr: data.target.to_string(),
            msg: data.call_data,
            funds,
        }));
    }

    // Make sure that the user has enough balance
    if user_balance + received_fund < fund_sent + fee_amount {
        return Err(StdError::GenericErr {
            msg: "Insufficient funds".to_string(),
        });
    }

    // Update `user` balance
    let new_user_balance = user_balance + received_fund - fund_sent - fee_amount;
    BALANCES.save(deps.storage, user, &new_user_balance)?;

    // Send `fee` to `registry` contract
    let fee_amount = calc_tax_deducted_asset(deps.branch(), fund_denom, fee_amount)?;
    msgs.push(CosmosMsg::Bank(BankMsg::Send {
        to_address: registry.to_string(),
        amount: fee_amount,
    }));

    Ok(Response::new()
        .add_messages(msgs)
        .add_attributes(vec![attr("method", "forward_calls")]))
}

fn calc_tax_deducted_asset(deps: DepsMut, denom: String, amount: Uint128) -> StdResult<Vec<Coin>> {
    let asset = Asset {
        info: AssetInfo::NativeToken { denom },
        amount,
    };
    asset.deduct_tax(&deps.querier).map(|coin| vec![coin])
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => to_binary(&query_config(deps)?),
        QueryMsg::GetBalance { user_addr } => to_binary(&query_balance(deps, user_addr)?),
    }
}

fn query_config(deps: Deps) -> StdResult<ConfigResponse> {
    let config = CONFIG.load(deps.storage)?;
    Ok(ConfigResponse {
        registry: config.registry.to_string(),
        reg_user_fee_veri_forwarder: config.reg_user_fee_veri_forwarder.to_string(),
        fund_denom: config.fund_denom,
    })
}

fn query_balance(deps: Deps, user_addr: String) -> StdResult<UsrBalanceResponse> {
    let usr_addr = deps.api.addr_validate(&user_addr)?;
    let balance = BALANCES
        .may_load(deps.storage, usr_addr)
        .map(|bal| bal.unwrap_or(Uint128::zero()))?;
    Ok(UsrBalanceResponse { user_addr, balance })
}
