import chalk from "chalk";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { Coin, coin, DirectSecp256k1HdWallet, Registry } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";

import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";

import { localosmosis } from "../../../config/localosmosisConstants";
import {toEncodedBinary } from "../../../utils/osmosis/helpers";

chai.use(chaiAsPromised);
const { expect } = chai;

export async function testExecuteWrapperOsmosis(
  client: SigningCosmWasmClient,
  wallet1: DirectSecp256k1HdWallet,
  wallet2: DirectSecp256k1HdWallet,
  wallet3: DirectSecp256k1HdWallet,
  auto: string,
  stakeManager: string,
  registry: string,
  poolId: number,
  out_denom: string,
  wrapperOsmosis: string,
): Promise<void> {
  console.log(chalk.yellow("\nStep 3. Running Tests"));

  // Wallet1 add liquidity
  // await walletAddLiquidity(wallet1, localosmosis.addresses.wallet1, tcw, tcwUosmoSwap, "1000000", "1000000");

  // Test "wrapperOsmosis"
  await testWrapperSuccessSwap(client, wallet1, wallet2, wallet3, wrapperOsmosis, poolId, out_denom, "1000");

  await testWrapperWholeFlow(client, wallet1, wallet2, wallet3, wrapperOsmosis, registry, stakeManager, poolId, out_denom, "1000");

  process.exit();
}

// -----------------------------------------------
//  TEST: "wrapperOsmosis" successfully performs swap
//
//  SCENARIO:
//    Wallet1(liquidity provider) provides 1:1 TCW-uosmo liquidity.
//    Wallet3(executor) sends the "swap" request through "wrapperOsmosis".
//    Wallet2(user) receives the "swap" result - some TCW tokens.
// ------------------------------------------------
async function testWrapperSuccessSwap(
  client: SigningCosmWasmClient,
  wallet1: DirectSecp256k1HdWallet,
  wallet2: DirectSecp256k1HdWallet,
  wallet3: DirectSecp256k1HdWallet,
  wrapperOsmosis: string,
  poolId: number,
  out_denom: string,
  uosmo_amount: string,
): Promise<void> {
  process.stdout.write("Test - OsmosisWrapper performs swap");

  const beforeTcw: any = await client.getBalance(localosmosis.addresses.wallet2, out_denom);
  const beoreTcwBalance = beforeTcw.amount;

  let wallet3_client = await SigningCosmWasmClient.connectWithSigner(
    localosmosis.networkInfo.url,
    wallet3,
    {gasPrice: GasPrice.fromString("0.1uosmo")},
  );

  const result: any = await wallet3_client.execute(localosmosis.addresses.wallet3, wrapperOsmosis, {
      swap: {
        user: localosmosis.addresses.wallet2,
        pool_id: poolId,
        denom_in: "uosmo",
        denom_out: out_denom,
        amount: uosmo_amount,
        min_output: (parseInt(uosmo_amount) / 10).toString(),
        max_output: (parseInt(uosmo_amount) * 10).toString(),
      },
    }, "auto", undefined, [coin(uosmo_amount, "uosmo")]);

  const afterTcw: any = await client.getBalance(localosmosis.addresses.wallet2, out_denom);
  const afterTcwBalance = afterTcw.amount;

  expect(parseInt(afterTcwBalance) != parseInt(beoreTcwBalance)).to.be.ok;

  console.log(chalk.green(" Passed!"));
}

// -----------------------------------------------
//  TEST: "wrapperOsmosis" whole workflow
//
//  SCENARIO:
//    1. Wallet2(user) creates "(swap)request".
//
//    2. Wallet3(executor) sends the "swap" request through "wrapperOsmosis".
//        - Here, we assume that the condition(limit order/stop loss) already met.
//
//    3. Wallet2(user) receives the "swap" result - some TCW tokens.
// ------------------------------------------------
async function testWrapperWholeFlow(
  client: SigningCosmWasmClient,
  wallet1: DirectSecp256k1HdWallet,
  wallet2: DirectSecp256k1HdWallet,
  wallet3: DirectSecp256k1HdWallet,
  wrapperOsmosis: string,
  registry: string,
  stakeManager: string,
  poolId: number,
  out_denom: string,
  uosmo_amount: string,
): Promise<void> {
  process.stdout.write("Test - OsmosisWrapper whole workflow");

  // 1. Walle2 creates request
  let wallet2_client = await SigningCosmWasmClient.connectWithSigner(
    localosmosis.networkInfo.url,
    wallet2,
    {gasPrice: GasPrice.fromString("0.1uosmo")},
  );

  // "update_executor" to prevent the unexpected error
  await wallet2_client.execute(localosmosis.addresses.wallet2, stakeManager, {
    update_executor: {}
  }, "auto", undefined, []);

  // Create request of `swap` in `osmosis`
  let wrapperSwapMsg = toEncodedBinary({
    swap: {
      user: localosmosis.addresses.wallet2,
      pool_id: poolId,
      denom_in: "uosmo",
      denom_out: out_denom,
      amount: uosmo_amount,
      min_output: (parseInt(uosmo_amount) / 10).toString(),
      max_output: (parseInt(uosmo_amount) * 10).toString(),
    },
  });

  const createReqResult = await wallet2_client.execute(localosmosis.addresses.wallet2, registry, {
    create_request: {
      target: wrapperOsmosis,
      msg: wrapperSwapMsg,
      input_asset: {
        info: {
            native_token: {
            denom: "uosmo",
          },
        },
        amount: uosmo_amount,
      }
    },
  }, "auto", undefined, [coin(parseInt(uosmo_amount) + parseInt("1000"), "uosmo")]);

  // Check if the request created
  const requestsQuery: any = await client.queryContractSmart(registry, {
    requests: {},
  });
  const requestId = requestsQuery.requests[0].id;

  // Record the TCW balance of Wallet2
  const beforeTcw = await client.getBalance(localosmosis.addresses.wallet2, out_denom);
  const beoreTcwBalance = beforeTcw.amount;

  // Record the uosmo balance of Wallet3
  const beforeUosmo: Coin = await client.getBalance(localosmosis.addresses.wallet3, "uosmo");
  const beforeUosmoBalance = beforeUosmo.amount;

  // 2. Wallet3 executes the request
  let wallet3_client = await SigningCosmWasmClient.connectWithSigner(
    localosmosis.networkInfo.url,
    wallet3,
    {gasPrice: GasPrice.fromString("0.1uosmo")},
  );

  // 3. Wallet2 receives some TCW tokens.
  const result: any = await wallet3_client.execute(localosmosis.addresses.wallet3, registry, {
      execute_request: {
        id: requestId,
      },
    }, "auto", undefined, [coin(uosmo_amount, "uosmo")]);


  // Check the TCW balance of Wallet2
  const afterTcw: any = await client.getBalance(localosmosis.addresses.wallet2, out_denom);
  const afterTcwBalance = afterTcw.amount;

  // Check the uosmo balance of Wallet3
  const afterUosmo: Coin = await client.getBalance(localosmosis.addresses.wallet3, "uosmo");
  const afterUosmoBalance = afterUosmo.amount;

  // console.log(beoreTcwBalance,":", beforeUosmoBalance);
  // console.log(afterTcwBalance,":", afterUosmoBalance);
  // console.log(uosmo_amount, ":", "1000000");

  expect(parseInt(afterTcwBalance) != parseInt(beoreTcwBalance)).to.be.ok;
  expect(parseInt(afterUosmoBalance) != parseInt(beforeUosmoBalance)).to.be.ok;

  console.log(chalk.green(" Passed!"));
}

// -------------------------------
// "Sender"(wallet) adds the liquidity
// to the "swap" contract
// -------------------------------
async function walletAddLiquidity(
  senderWallet: DirectSecp256k1HdWallet,
  senderAddress: string,
  tcw: string,
  swap: string,
  uosmo_amount: string,
  tcw_amount: string,
): Promise<void> {
  process.stdout.write(`Wallet1 add liquidity to TCW-uosmo swap :`);

  let sender_client = await SigningCosmWasmClient.connectWithSigner(
    localosmosis.networkInfo.url,
    senderWallet,
    { gasPrice: GasPrice.fromString("0.1uosmo") },
  );

  // First, increase the allowance
  const res = await sender_client.execute(senderAddress, tcw, {
    increase_allowance: {
      spender: swap,
      amount: tcw_amount,
      expires: undefined,
    }
  }, "auto", undefined, []);

  // Add liquidity
  const result = await sender_client.execute(senderAddress, swap, {
    add_liquidity: {
      token1_amount: uosmo_amount,
      min_liquidity: uosmo_amount,
      max_token2: tcw_amount,
      expiration: undefined,
    }
  }, "auto", undefined, [coin(uosmo_amount, "uosmo")]);

  console.log(chalk.green(" Success!\n"));
}
