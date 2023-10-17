import { CosmWasmClient, SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { coin, DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import chalk from "chalk";
import { localjuno } from "../../../../config/localjunoConstants";
import { toEncodedBinary } from "../../../../utils/juno/helpers";

chai.use(chaiAsPromised);
const { expect } = chai;

export async function testExecuteStation(
  junod: SigningCosmWasmClient,
  wallet1: DirectSecp256k1HdWallet,
  wallet2: DirectSecp256k1HdWallet,
  wallet3: DirectSecp256k1HdWallet,
  auto: string,
  registryStake: string,
  fundsRouter: string,
  timeConditions: string,
  counter: string,
): Promise<void> {
  console.log(chalk.yellow("\nStep 3. Running Tests"));
  // // Test FundsRouter 
  // await testFundsRouterForwardCallsFails(junod, wallet1, wallet2, wallet3, fundsRouter, "1000000", "100000");
  // await testFundsRouterForwardCallsSuccess(
  //   junod, 
  //   wallet1, 
  //   wallet2, 
  //   wallet3, 
  //   fundsRouter, 
  //   [{ target: counter, call_data: toEncodedBinary({ increment: {} }), fund_for_call: "0"}], 
  //   "1000000", 
  //   "1000000", 
  //   counter,
  // );
  // await testFundsRouterDepositNativeSuccess(junod, wallet3, fundsRouter, "100", localjuno.addresses.wallet3);
  // await testFundsRouterWithdrawNativeSuccess(junod, wallet3, fundsRouter, "100", localjuno.addresses.wallet3);

  // // Query
  // await testQueryFundsRouterState(junod, fundsRouter);

  // // Test TimeConditions
  // await testTimeConditionsBetweenTimes(junod, timeConditions, 1656085642, 1666095642);
  // await testTimeConditionsGetLastExecTime(junod, timeConditions, localjuno.addresses.wallet1, 10);
  // await testTimeConditionsGetState(junod, timeConditions);

  let start_time = Math.floor(Date.now() / 1000) - 60;
  await testTimeConditionsSaveExecTime(junod, wallet3, timeConditions, localjuno.addresses.wallet1, 1, start_time, 3);

  process.exit();
}

// -----------------------------------------------
//  TEST: "FundsRouter" fails to forward the call
//  
//  SCENARIO: 
//   1. Invalid caller(non-"reg_user_fee_forwarder") sends the "FcnData".
//   2. Valid caller("reg_user_fee_forwarder" wallet2) sends insufficient funds.
// ------------------------------------------------
async function testFundsRouterForwardCallsFails(
  junod: SigningCosmWasmClient,
  wallet1: DirectSecp256k1HdWallet, 
  wallet2: DirectSecp256k1HdWallet,
  wallet3: DirectSecp256k1HdWallet,
  fundsRouter: string,
  fee_amount: string,
  ucosm_amount: string,
): Promise<void> {
  process.stdout.write("Test - FundsRouter ForwardCalls fails");

  let wallet3_client = await SigningCosmWasmClient.connectWithSigner(
    localjuno.networkInfo.url, 
    wallet3, 
    {gasPrice: GasPrice.fromString("0.1ujunox")},
  );

  await expect(
    wallet3_client.execute(localjuno.addresses.wallet3, fundsRouter, {
      forward_calls: {
        user: localjuno.addresses.wallet1,
        fee_amount: fee_amount,
        fcn_data: [],
      },
    }, "auto", undefined, [coin(ucosm_amount, "ucosm")])
  ).to.be.rejected; // rejectedWith("FRouter: not userFeeForw");
  
  const wallet2_client = await SigningCosmWasmClient.connectWithSigner(
    localjuno.networkInfo.url,
    wallet2, 
    {gasPrice: GasPrice.fromString("0.1ujunox")},
  );
  await expect(
    wallet2_client.execute(localjuno.addresses.wallet2, fundsRouter, {
      forward_calls: {
        user: localjuno.addresses.wallet1,
        fee_amount: fee_amount,
        fcn_data: [],
      },
    }, "auto", undefined, [coin(ucosm_amount, "ucosm")])
  ).to.be.rejected;  // rejectedWith("Insufficent funds");
 
  console.log(chalk.green(" Passed!"));
}

// -----------------------------------------------
//  TEST: "FundsRouter" successfully forwards the call
//  
//  SCENARIO: 
//   "reg_user_fee_forwarder"(wallet2) "increment"s the "counter" state
//   by sending the "FcnData"("increment")
// ------------------------------------------------
async function testFundsRouterForwardCallsSuccess(
  junod: SigningCosmWasmClient,
  wallet1: DirectSecp256k1HdWallet, 
  wallet2: DirectSecp256k1HdWallet,
  wallet3: DirectSecp256k1HdWallet,
  fundsRouter: string,
  fcnData: any,
  fee_amount: string,
  ucosm_amount: string,
  counter: string,
): Promise<void> {
  process.stdout.write("Test - FundsRouter ForwardCalls Success");
 
  const beforeCountQuery: any = await junod.queryContractSmart(counter, {
    get_count: {},
  });

 let wallet2_client = await SigningCosmWasmClient.connectWithSigner(
   localjuno.networkInfo.url, 
   wallet2, 
   {gasPrice: GasPrice.fromString("0.1ujunox")},
  );
  const result = await wallet2_client.execute(
    localjuno.addresses.wallet2, 
    fundsRouter, 
    {
      forward_calls: {
        user: localjuno.addresses.wallet1,
        fee_amount: fee_amount,
        fcn_data: fcnData,
      },
    }, 
    "auto", 
    undefined, 
    [coin(ucosm_amount, "ucosm")],
  );
  expect(result).to.be.ok;

  // Check the "increment" result.
  // process.stdout.write("\nQuery the counter contract");
  const afterCountQuery: any = await junod.queryContractSmart(counter, {
    get_count: {},
  })
  // console.log(afterCountQuery);
  expect(afterCountQuery.count == (beforeCountQuery.count + 1)).to.be.ok;

  console.log(chalk.green(" Passed!"));
}

// -----------------------------------------------
//  TEST: Wallet3 successfully "deposit" "ucosm" token to "FundsRouter"
//  
//  SCENARIO: 
//    Wallet3 deposits 100 "ucosm" for himself
// ------------------------------------------------
async function testFundsRouterDepositNativeSuccess(
  junod: SigningCosmWasmClient,
  wallet3: DirectSecp256k1HdWallet,
  fundsRouter: string,
  ucosm_amount: string,
  spender: string,
): Promise<void> {
  process.stdout.write("Test - FundsRouter DepositNative Success");
 
  const beforeBalanceQuery: any = await junod.queryContractSmart(fundsRouter, {
    get_balance: { user_addr: spender },
  });

 let wallet3_client = await SigningCosmWasmClient.connectWithSigner(
   localjuno.networkInfo.url, 
   wallet3, 
   {gasPrice: GasPrice.fromString("0.1ujunox")},
  );
  const result = await wallet3_client.execute(
    localjuno.addresses.wallet3, 
    fundsRouter, 
    {
      deposit_fund: { spender: spender },
    }, 
    "auto", 
    undefined, 
    [coin(ucosm_amount, "ucosm")],
  );
  expect(result).to.be.ok;

  // Check the "deposit_fund" result.
  // process.stdout.write(`\nQuery the Balance of ${spender}`);
  const afterBalanceQuery: any = await junod.queryContractSmart(fundsRouter, {
    get_balance: { user_addr: spender },
  })
  // console.log(afterBalanceQuery);
  expect(
    parseInt(afterBalanceQuery.balance) 
    == parseInt(beforeBalanceQuery.balance) + parseInt(ucosm_amount)
  ).to.be.ok;

  console.log(chalk.green(" Passed!"));
}


// -----------------------------------------------
//  TEST: Wallet3 successfully "deposit" "ucosm" token to "FundsRouter"
//  
//  SCENARIO: 
//    Wallet3 withdraws 100 "ucosm" for himself
// ------------------------------------------------
async function testFundsRouterWithdrawNativeSuccess(
  junod: SigningCosmWasmClient,
  wallet3: DirectSecp256k1HdWallet,
  fundsRouter: string,
  ucosm_amount: string,
  recipient: string,
): Promise<void> {
  process.stdout.write("Test - FundsRouter WithdrawNative Success");
 
  const beforeBalanceQuery: any = await junod.queryContractSmart(fundsRouter, {
    get_balance: { user_addr: recipient },
  });

 let wallet3_client = await SigningCosmWasmClient.connectWithSigner(
   localjuno.networkInfo.url, 
   wallet3, 
   {gasPrice: GasPrice.fromString("0.1ujunox")},
  );
  const result = await wallet3_client.execute(
    localjuno.addresses.wallet3, 
    fundsRouter, 
    {
      withdraw_fund: { recipient: recipient, amount: ucosm_amount },
    }, 
    "auto", 
    undefined, 
    [],
  );
  expect(result).to.be.ok;

  // Check the "deposit_fund" result.
  // process.stdout.write(`\nQuery the Balance of ${recipient}`);
  const afterBalanceQuery: any = await junod.queryContractSmart(fundsRouter, {
    get_balance: { user_addr: recipient },
  })
  // console.log(afterBalanceQuery);
  expect(
    parseInt(afterBalanceQuery.balance) 
    == parseInt(beforeBalanceQuery.balance) - parseInt(ucosm_amount)
  ).to.be.ok;

  console.log(chalk.green(" Passed!"));
}

// -----------------------
//  "FundsRouter" query
// -----------------------
async function testQueryFundsRouterState(
  junod: SigningCosmWasmClient,
  fundsRouter: string,
): Promise<void> {
  process.stdout.write("Test - Query FundsRouter state");
  const result: any = await junod.queryContractSmart(fundsRouter, {
    config: {},
  });

  // console.log(result);
  console.log(chalk.green(" Passed!"));
}

// -----------------------------------------------
//  TEST: "TimeConditions"
//  
//  SCENARIO: 
//   1. Check the query "BetweenTimes"
// ------------------------------------------------
async function testTimeConditionsBetweenTimes(
  junod: CosmWasmClient,
  timeConditions: string,
  after: number,
  before: number,
): Promise<void> {
  process.stdout.write("Test - TimeConditions betweenTimes query")
  let res = await junod.queryContractSmart(timeConditions, {
    between_times: {
      after_time: after,
      before_time: before,
    }
  });
  expect(res == true).to.be.ok;
  console.log(chalk.green(" Passed!"));
}

// -----------------------------------------------
//  TEST: "TimeConditions"
//  
//  SCENARIO: 
//   1. Check the query "GetLastExecTime"
// ------------------------------------------------
async function testTimeConditionsGetLastExecTime(
  junod: CosmWasmClient,
  timeConditions: string,
  user: string,
  id: number,
): Promise<void> {
  process.stdout.write("Test - TimeConditions GetLastExecTime query")
  let res = await junod.queryContractSmart(timeConditions, {
    get_last_exec_time: {
      user: user,
      id: id,
    }
  });
  expect(res.last_exec_time == 0).to.be.ok;
  console.log(chalk.green(" Passed!"));
}

// -----------------------------------------------
//  TEST: "TimeConditions"
//  
//  SCENARIO: 
//   1. Check the query "GetState"
// ------------------------------------------------
async function testTimeConditionsGetState(
  junod: CosmWasmClient,
  timeConditions: string,
): Promise<void> {
  process.stdout.write("Test - TimeConditions GetState query")
  let res = await junod.queryContractSmart(timeConditions, {
    get_state: {}
  });
  expect(res.router_user_veri_forwarder == localjuno.addresses.wallet3).to.be.ok;
  console.log(chalk.green(" Passed!"));
}

// -----------------------------------------------
//  TEST: "TimeConditions"
//  
//  SCENARIO: 
//   1. Try to "save_exec_time"
// ------------------------------------------------
async function testTimeConditionsSaveExecTime(
  junod: CosmWasmClient,
  wallet3: DirectSecp256k1HdWallet,
  timeConditions: string,
  user: string,
  id: number,
  start_time: number,
  period: number,
): Promise<void> {
  process.stdout.write("Test - TimeConditions SaveExecTime")

  let wallet3_client = await SigningCosmWasmClient.connectWithSigner(
    localjuno.networkInfo.url, 
    wallet3, 
    {gasPrice: GasPrice.fromString("0.1ujunox")},
  );

  // Query the last_exec_time
  let query = await wallet3_client.queryContractSmart(timeConditions, {
    get_last_exec_time: {
      user: user,
      id: id,
    }
  });

  await wallet3_client.execute(localjuno.addresses.wallet3, timeConditions, {
    every_time_period: {
      user: user,
      call_id: id,
      start_time: start_time,
      period_length: period,
    },
  }, "auto", undefined, []);

  // Check the result
  let res = await junod.queryContractSmart(timeConditions, {
    get_last_exec_time: {
      user: user,
      id: id,
    }
  });

  if (query.last_exec_time == 0) {
    expect(res.last_exec_time == start_time).to.be.ok;
  } else {
    expect(res.last_exec_time == query.last_exec_time + period).to.be.ok;
  }
  console.log(chalk.green(" Passed!"));
}

