import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { coin, DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import chalk from "chalk";
import { localosmosis } from "../../../config/localosmosisConstants";
import { toEncodedBinary } from "../../../utils/osmosis/helpers";

chai.use(chaiAsPromised);
const { expect } = chai;

export async function testExecuteStation(
  client: SigningCosmWasmClient,
  wallet1: DirectSecp256k1HdWallet,
  wallet2: DirectSecp256k1HdWallet,
  wallet3: DirectSecp256k1HdWallet,
  auto: string,
  stakeManager: string,
  registry: string,
  fundsRouter: string,
  timeConditions: string,
  counter: string,
): Promise<void> {
  console.log(chalk.yellow("\nStep 3. Running Tests"));
  // Test FundsRouter
  await testFundsRouterForwardCallsFails(client, wallet1, wallet2, wallet3, fundsRouter, "1000000", "100000");
  await testFundsRouterForwardCallsSuccess(
    client,
    wallet1,
    wallet2,
    wallet3,
    fundsRouter,
    [{ target: counter, call_data: toEncodedBinary({ increment: {} }), ucosm_for_call: "0"}],
    "1000000",
    "1000000",
    counter,
  );
  await testFundsRouterDepositNativeSuccess(client, wallet3, fundsRouter, "100", localosmosis.addresses.wallet3);
  await testFundsRouterWithdrawNativeSuccess(client, wallet3, fundsRouter, "100", localosmosis.addresses.wallet3);

  // Query
  await testQueryFundsRouterState(client, fundsRouter);

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
  client: SigningCosmWasmClient,
  wallet1: DirectSecp256k1HdWallet,
  wallet2: DirectSecp256k1HdWallet,
  wallet3: DirectSecp256k1HdWallet,
  fundsRouter: string,
  fee_amount: string,
  ucosm_amount: string,
): Promise<void> {
  process.stdout.write("Test - FundsRouter ForwardCalls fails");

  let wallet3_client = await SigningCosmWasmClient.connectWithSigner(
    localosmosis.networkInfo.url,
    wallet3,
    {gasPrice: GasPrice.fromString("0.1uosmo")},
  );

  await expect(
    wallet3_client.execute(localosmosis.addresses.wallet3, fundsRouter, {
      forward_calls: {
        user: localosmosis.addresses.wallet1,
        fee_amount: fee_amount,
        fcn_data: [],
      },
    }, "auto", undefined, [coin(ucosm_amount, "ucosm")])
  ).to.be.rejected; // rejectedWith("FRouter: not userFeeForw");

  const wallet2_client = await SigningCosmWasmClient.connectWithSigner(
    localosmosis.networkInfo.url,
    wallet2,
    {gasPrice: GasPrice.fromString("0.1uosmo")},
  );
  await expect(
    wallet2_client.execute(localosmosis.addresses.wallet2, fundsRouter, {
      forward_calls: {
        user: localosmosis.addresses.wallet1,
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
  client: SigningCosmWasmClient,
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

  const beforeCountQuery: any = await client.queryContractSmart(counter, {
    get_count: {},
  });

 let wallet2_client = await SigningCosmWasmClient.connectWithSigner(
   localosmosis.networkInfo.url,
   wallet2,
   {gasPrice: GasPrice.fromString("0.1uosmo")},
  );
  const result = await wallet2_client.execute(
    localosmosis.addresses.wallet2,
    fundsRouter,
    {
      forward_calls: {
        user: localosmosis.addresses.wallet1,
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
  const afterCountQuery: any = await client.queryContractSmart(counter, {
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
  client: SigningCosmWasmClient,
  wallet3: DirectSecp256k1HdWallet,
  fundsRouter: string,
  ucosm_amount: string,
  spender: string,
): Promise<void> {
  process.stdout.write("Test - FundsRouter DepositNative Success");

  const beforeBalanceQuery: any = await client.queryContractSmart(fundsRouter, {
    get_balance: { user_addr: spender },
  });

 let wallet3_client = await SigningCosmWasmClient.connectWithSigner(
   localosmosis.networkInfo.url,
   wallet3,
   {gasPrice: GasPrice.fromString("0.1uosmo")},
  );
  const result = await wallet3_client.execute(
    localosmosis.addresses.wallet3,
    fundsRouter,
    {
      deposit_native: { spender: spender },
    },
    "auto",
    undefined,
    [coin(ucosm_amount, "ucosm")],
  );
  expect(result).to.be.ok;

  // Check the "deposit_native" result.
  // process.stdout.write(`\nQuery the Balance of ${spender}`);
  const afterBalanceQuery: any = await client.queryContractSmart(fundsRouter, {
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
  client: SigningCosmWasmClient,
  wallet3: DirectSecp256k1HdWallet,
  fundsRouter: string,
  ucosm_amount: string,
  recipient: string,
): Promise<void> {
  process.stdout.write("Test - FundsRouter WithdrawNative Success");

  const beforeBalanceQuery: any = await client.queryContractSmart(fundsRouter, {
    get_balance: { user_addr: recipient },
  });

 let wallet3_client = await SigningCosmWasmClient.connectWithSigner(
   localosmosis.networkInfo.url,
   wallet3,
   {gasPrice: GasPrice.fromString("0.1uosmo")},
  );
  const result = await wallet3_client.execute(
    localosmosis.addresses.wallet3,
    fundsRouter,
    {
      withdraw_native: { recipient: recipient, amount: ucosm_amount },
    },
    "auto",
    undefined,
    [],
  );
  expect(result).to.be.ok;

  // Check the "deposit_native" result.
  // process.stdout.write(`\nQuery the Balance of ${recipient}`);
  const afterBalanceQuery: any = await client.queryContractSmart(fundsRouter, {
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
//  Querying tests
// -----------------------
async function testQueryFundsRouterState(
  client: SigningCosmWasmClient,
  fundsRouter: string,
): Promise<void> {
  process.stdout.write("Test - Query FundsRouter state");
  const result: any = await client.queryContractSmart(fundsRouter, {
    get_state: {},
  });

  // console.log(result);
  console.log(chalk.green(" Passed!"));
}
