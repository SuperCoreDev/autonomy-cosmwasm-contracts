
import { LCDClient, LocalTerra, MsgExecuteContract, Wallet } from "@terra-money/terra.js";
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import chalk from "chalk";

import { localterra } from "../../../../config/localterraConstants";
import { sendTransaction, toEncodedBinary } from "../../../../utils/terra/helpers";

chai.use(chaiAsPromised);
const { expect } = chai;

export async function testExecuteStation(
  terra: LocalTerra | LCDClient,
  wallet1: Wallet,
  wallet2: Wallet,
  wallet3: Wallet,
  auto: string,
  registryStake: string,
  fundsRouter: string,
  timeConditions: string,
  counter: string,
): Promise<void> {
  console.log(chalk.yellow("\nStep 3. Running Tests"));
  // Test FundsRouter 
  await testFundsRouterForwardCallsFails(terra, wallet1, wallet2, wallet3, fundsRouter, "1000000", "100000");
  await testFundsRouterForwardCallsSuccess(
    terra, 
    wallet1, 
    wallet2, 
    wallet3, 
    fundsRouter, 
    [{ target: counter, call_data: toEncodedBinary({ increment: {} }), fund_for_call: "0"}], 
    "1000000", 
    "1000000", 
    counter,
  );
  await testFundsRouterDepositNativeSuccess(terra, wallet3, fundsRouter, "100", wallet3.key.accAddress);
  await testFundsRouterWithdrawNativeSuccess(terra, wallet3, fundsRouter, "100", wallet3.key.accAddress);

  // Query
  await testQueryFundsRouterState(terra, fundsRouter);

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
  terra: LocalTerra | LCDClient,
  wallet1: Wallet, 
  wallet2: Wallet,
  wallet3: Wallet,
  fundsRouter: string,
  fee_amount: string,
  uluna_amount: string,
): Promise<void> {
  process.stdout.write("Test - FundsRouter ForwardCalls fails");

  await expect(
    sendTransaction(terra, wallet3, [
      new MsgExecuteContract(wallet3.key.accAddress, fundsRouter, {
        forward_calls: {
          user: wallet1.key.accAddress,
          fee_amount: fee_amount,
          fcn_data: [],
        },
      }, { uluna: uluna_amount }),
    ])
  ).to.be.rejected; // rejectedWith("FRouter: not userFeeForw");

  await expect(
    sendTransaction(terra, wallet2, [
      new MsgExecuteContract(wallet2.key.accAddress, fundsRouter, {
        forward_calls: {
          user: wallet1.key.accAddress,
          fee_amount: fee_amount,
          fcn_data: [],
        },
      }, { uluna: uluna_amount }),
    ])
  ).to.be.rejected; // rejectedWith("FRouter: not userFeeForw");
 
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
  terra: LocalTerra | LCDClient,
  wallet1: Wallet, 
  wallet2: Wallet,
  wallet3: Wallet,
  fundsRouter: string,
  fcnData: any,
  fee_amount: string,
  uluna_amount: string,
  counter: string,
): Promise<void> {
  process.stdout.write("Test - FundsRouter ForwardCalls Success");

  const beforeCountQuery: any = await terra.wasm.contractQuery(counter, {
    get_count: {},
  });

  const result = await sendTransaction(
    terra, 
    wallet2,
    [
      new MsgExecuteContract(wallet2.key.accAddress, fundsRouter, {
        forward_calls: {
          user: wallet1.key.accAddress,
          fee_amount: fee_amount,
          fcn_data: fcnData,
        }
      }, { uluna: uluna_amount })
    ]
  );
  expect(result).to.be.ok;

  // Check the "increment" result.
  // process.stdout.write("\nQuery the counter contract");
  const afterCountQuery: any = await terra.wasm.contractQuery(counter, {
    get_count: {},
  })
  // console.log(afterCountQuery);
  expect(afterCountQuery.count == (beforeCountQuery.count + 1)).to.be.ok;

  console.log(chalk.green(" Passed!"));
}

// -----------------------------------------------
//  TEST: Wallet3 successfully "deposit" "uluna" token to "FundsRouter"
//  
//  SCENARIO: 
//    Wallet3 deposits 100 "uluna" for himself
// ------------------------------------------------
async function testFundsRouterDepositNativeSuccess(
  terra: LocalTerra | LCDClient,
  wallet3: Wallet,
  fundsRouter: string,
  uluna_amount: string,
  spender: string,
): Promise<void> {
  process.stdout.write("Test - FundsRouter DepositNative Success");
 
  const beforeBalanceQuery: any = await terra.wasm.contractQuery(fundsRouter, {
    get_balance: { user_addr: spender },
  });

  const result = await sendTransaction(terra, wallet3, [
    new MsgExecuteContract(
      wallet3.key.accAddress,
      fundsRouter,
      {
        deposit_fund: { spender: spender },
      },
      { uluna: uluna_amount },
    )
  ]);
  expect(result).to.be.ok;

  // Check the "deposit_native" result.
  // process.stdout.write(`\nQuery the Balance of ${spender}`);
  const afterBalanceQuery: any = await terra.wasm.contractQuery(fundsRouter, {
    get_balance: { user_addr: spender },
  })
  // console.log(afterBalanceQuery);
  expect(
    parseInt(afterBalanceQuery.balance) 
    == parseInt(beforeBalanceQuery.balance) + parseInt(uluna_amount)
  ).to.be.ok;

  console.log(chalk.green(" Passed!"));
}


// -----------------------------------------------
//  TEST: Wallet3 successfully "deposit" "uluna" token to "FundsRouter"
//  
//  SCENARIO: 
//    Wallet3 withdraws 100 "uluna" for himself
// ------------------------------------------------
async function testFundsRouterWithdrawNativeSuccess(
  terra: LocalTerra | LCDClient,
  wallet3: Wallet,
  fundsRouter: string,
  uluna_amount: string,
  recipient: string,
): Promise<void> {
  process.stdout.write("Test - FundsRouter WithdrawNative Success");
 
  const beforeBalanceQuery: any = await terra.wasm.contractQuery(fundsRouter, {
    get_balance: { user_addr: recipient },
  });

  const result = await sendTransaction(terra, wallet3, [
    new MsgExecuteContract(
      wallet3.key.accAddress,
      fundsRouter,
      {
        withdraw_fund: { recipient: recipient, amount: uluna_amount },
      },
    )
  ])
  expect(result).to.be.ok;

  // Check the "deposit_native" result.
  // process.stdout.write(`\nQuery the Balance of ${recipient}`);
  const afterBalanceQuery: any = await terra.wasm.contractQuery(fundsRouter, {
    get_balance: { user_addr: recipient },
  })
  // console.log(afterBalanceQuery);
  expect(
    parseInt(afterBalanceQuery.balance) 
    == parseInt(beforeBalanceQuery.balance) - parseInt(uluna_amount)
  ).to.be.ok;

  console.log(chalk.green(" Passed!"));
}



// -----------------------
//  Querying tests
// -----------------------
async function testQueryFundsRouterState(
  terra: LocalTerra | LCDClient,
  fundsRouter: string,
): Promise<void> {
  process.stdout.write("Test - Query FundsRouter state");
  const result: any = await terra.wasm.contractQuery(fundsRouter, {
    get_state: {},
  });

  // console.log(result);
  console.log(chalk.green(" Passed!"));
}