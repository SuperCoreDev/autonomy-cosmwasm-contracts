import chalk from "chalk";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { Coin, coin, DirectSecp256k1HdWallet, Registry } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";

import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";

import { mainnet } from "../../../../config/junoConstants";
import {toEncodedBinary } from "../../../../utils/juno/helpers";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";

chai.use(chaiAsPromised);
const { expect } = chai;

export async function testExecuteWrapperJunoswap(
  junod: SigningCosmWasmClient,
  wallet1: DirectSecp256k1HdWallet,
  wallet2: DirectSecp256k1HdWallet,
  wallet3: DirectSecp256k1HdWallet,
  auto: string,
  registryStake: string,
  tcw: string,
  tcwUjunoswap: string,
  wrapperJunoSwap: string,
): Promise<void> {
  console.log(chalk.yellow("\nStep 3. Running Tests"));

  // // Wallet1 add liquidity
  // await walletAddLiquidity(wallet1, mainnet.addresses.wallet1, tcw, tcwUjunoswap, "1000000", "1000000");

  // // Test "WrapperJunoswap"
  // await testWrapperSuccessSwap(junod, wallet1, wallet2, wallet3, wrapperJunoSwap, tcwUjunoswap, tcw, "1000");
  
  // // Test the whole flow of swapping ujunox(native) -> TCW(cw20)
  // await testWrapperNative2Cw20Token(junod, wallet1, wallet2, wallet3, wrapperJunoSwap, registryStake, tcwUjunoswap, tcw, "1000");

  // // Test the whole flow of swapping TCW(cw20) -> ujunox(native)
  // await testWrapperCw20Token2Native(junod, wallet1, wallet2, wallet3, wrapperJunoSwap, registryStake, tcwUjunoswap, tcw, "1000");
  
  process.exit();
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
  ujunox_amount: string,
  tcw_amount: string,
): Promise<void> {
  process.stdout.write(`Wallet1 add liquidity to TCW-ujunox swap :`);

  let sender_client = await SigningCosmWasmClient.connectWithSigner(
    mainnet.networkInfo.url, 
    senderWallet, 
    { gasPrice: GasPrice.fromString("0.1ujuno") },
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
      token1_amount: ujunox_amount,
      min_liquidity: ujunox_amount,
      max_token2: tcw_amount,
      expiration: undefined,
    }
  }, "auto", undefined, [coin(ujunox_amount, "ujuno")]);

  console.log(chalk.green(" Success!\n"));
}

// -----------------------------------------------
//  TEST: "WrapperJunoSwap" successfully performs swap
//  
//  SCENARIO: 
//    Wallet1(liquidity provider) provides 1:1 TCW-ujunox liquidity.
//    Wallet3(executor) sends the "swap" request through "WrapperJunoSwap".
//    Wallet2(user) receives the "swap" result - some TCW tokens.
// ------------------------------------------------
async function testWrapperSuccessSwap(
  junod: SigningCosmWasmClient,
  wallet1: DirectSecp256k1HdWallet, 
  wallet2: DirectSecp256k1HdWallet,
  wallet3: DirectSecp256k1HdWallet,
  wrapperJunoSwap: string,
  tcwUjunoswap: string,
  tcw: string,
  ujunox_amount: string,
): Promise<void> {
  process.stdout.write("Test - JunoSwapWrapper performs swap");

  const beforeTcw: any = await junod.queryContractSmart(tcw, {
    balance: {
      address: mainnet.addresses.wallet2,
    }
  });
  const beoreTcwBalance = beforeTcw.balance;

  let wallet3_client = await SigningCosmWasmClient.connectWithSigner(
    mainnet.networkInfo.url, 
    wallet3, 
    {gasPrice: GasPrice.fromString("0.025ujuno")},
  );

  let swapMsg = toEncodedBinary({
    swap: {
      input_token: "Token1",
      input_amount: ujunox_amount,
      min_output: (parseInt(ujunox_amount) - 10).toString(),
      max_output: (parseInt(ujunox_amount) + 10).toString(),
      expiration: undefined,
    } 
  });

  const result: any = await wallet3_client.execute(mainnet.addresses.wallet3, wrapperJunoSwap, {
      swap: {
        user: mainnet.addresses.wallet2,
        contract_addr: tcwUjunoswap,
        swap_msg: swapMsg,
        input_token: {
          native_token: {
            denom: "ujuno",
          }
        },
        output_token: {
          token: {
            contract_addr: tcw,
          }
        },
        input_amount: ujunox_amount,
        min_output: (parseInt(ujunox_amount) - 10).toString(),
        max_output: (parseInt(ujunox_amount) + 10).toString(),
        recipient_exist: false,
      },
    }, "auto", undefined, [coin(ujunox_amount, "ujuno")]);

  const afterTcw: any = await junod.queryContractSmart(tcw, {
    balance: {
      address: mainnet.addresses.wallet2,
    }
  });
  const afterTcwBalance = afterTcw.balance;

  expect(parseInt(afterTcwBalance) != parseInt(beoreTcwBalance)).to.be.ok;

  console.log(chalk.green(" Passed!"));
}

// -----------------------------------------------
//  TEST: "WrapperJunoSwap" whole workflow(native -> cw20 swap)
//  
//  SCENARIO: 
//    1. Wallet2(user) creates "(swap)request".
//
//    2. Wallet3(executor) sends the "swap" request through "WrapperJunoSwap".
//        - Here, we assume that the condition(limit order/stop loss) already met.
//
//    3. Wallet2(user) receives the "swap" result - some TCW tokens.
// ------------------------------------------------
async function testWrapperNative2Cw20Token(
  junod: SigningCosmWasmClient,
  wallet1: DirectSecp256k1HdWallet, 
  wallet2: DirectSecp256k1HdWallet,
  wallet3: DirectSecp256k1HdWallet,
  wrapperJunoSwap: string,
  registryStake: string, 
  tcwUjunoswap: string,
  tcw: string,
  ujunox_amount: string,
): Promise<void> {
  process.stdout.write("Test - JunoSwapWrapper native to cw20 token");

  // 1. Walle2 creates request
  let wallet2_client = await SigningCosmWasmClient.connectWithSigner(
    mainnet.networkInfo.url, 
    wallet2, 
    {gasPrice: GasPrice.fromString("0.025ujuno")},
  );
 
  // Create request of `swap` in `junoswap`
  let realSwapMsg = toEncodedBinary({
    swap: {
      input_token: "Token1",
      input_amount: ujunox_amount,
      min_output: (parseInt(ujunox_amount) - 10).toString(),
      max_output: (parseInt(ujunox_amount) + 10).toString(),
      expiration: undefined,
    } 
  });

  let wrapperSwapMsg = toEncodedBinary({
    swap: {
      user: mainnet.addresses.wallet2,
      contract_addr: tcwUjunoswap,
      swap_msg: realSwapMsg,
      input_token: {
        native_token: {
          denom: "ujuno",
        }
      },
      output_token: {
        token: {
          contract_addr: tcw,
        }
      },
      input_amount: ujunox_amount,
      min_output: (parseInt(ujunox_amount) - 10).toString(),
      max_output: (parseInt(ujunox_amount) + 10).toString(),
      recipient_exist: false,
    },
  });

  const createReqResult = await wallet2_client.execute(mainnet.addresses.wallet2, registryStake, {
    create_request: {
      target: wrapperJunoSwap,
      msg: wrapperSwapMsg,
      input_asset: {
        info: {
            native_token: {
              denom: "ujuno",
          },
        },
        amount: ujunox_amount,
      }
    },
  }, "auto", undefined, [coin(parseInt(ujunox_amount) + parseInt("1000"), "ujuno")]);

  // Check if the request created
  const requestsQuery: any = await junod.queryContractSmart(registryStake, {
    requests: {},
  });
  const requestId = requestsQuery.requests[0].id;

  // Record the TCW balance of Wallet2
  const beforeTcw: any = await junod.queryContractSmart(tcw, {
    balance: {
      address: mainnet.addresses.wallet2,
    }
  });
  const beoreTcwBalance = beforeTcw.balance;

  // Record the ujunox balance of Wallet3
  const beforeUjuno: Coin = await junod.getBalance(mainnet.addresses.wallet3, "ujuno"); 
  const beforeUjunoBalance = beforeUjuno.amount;

  // 2. Wallet3 executes the request
  let wallet3_client = await SigningCosmWasmClient.connectWithSigner(
    mainnet.networkInfo.url, 
    wallet3, 
    {gasPrice: GasPrice.fromString("0.025ujuno")},
  );

  // 3. Wallet2 receives some TCW tokens.
  const result: any = await wallet3_client.execute(mainnet.addresses.wallet3, registryStake, {
      execute_request: {
        id: requestId,
      },
    }, "auto", undefined, [coin(ujunox_amount, "ujuno")]);


  // Check the TCW balance of Wallet2
  const afterTcw: any = await junod.queryContractSmart(tcw, {
    balance: {
      address: mainnet.addresses.wallet2,
    }
  });
  const afterTcwBalance = afterTcw.balance;

  // Check the ujunox balance of Wallet3
  const afterUjuno: Coin = await junod.getBalance(mainnet.addresses.wallet3, "ujuno"); 
  const afterUjunoBalance = afterUjuno.amount;

  expect(parseInt(afterTcwBalance) != parseInt(beoreTcwBalance)).to.be.ok;
  expect(parseInt(afterUjunoBalance) != parseInt(beforeUjunoBalance)).to.be.ok;

  console.log(chalk.green(" Passed!"));
}

// -----------------------------------------------
//  TEST: "WrapperJunoSwap" whole workflow(cw20 -> native swap)
//  
//  SCENARIO: 
//    1. Wallet2(user) creates "(swap)request".
//
//    2. Wallet3(executor) sends the "swap" request through "WrapperJunoSwap".
//        - Here, we assume that the condition(limit order/stop loss) already met.
//
//    3. Wallet2(user) receives the "swap" result - some UCOSM.
// ------------------------------------------------
async function testWrapperCw20Token2Native(
  junod: SigningCosmWasmClient,
  wallet1: DirectSecp256k1HdWallet, 
  wallet2: DirectSecp256k1HdWallet,
  wallet3: DirectSecp256k1HdWallet,
  wrapperJunoSwap: string,
  registryStake: string, 
  tcwUjunoswap: string,
  tcw: string,
  tcw_amount: string,
): Promise<void> {
  process.stdout.write("Test - JunoSwapWrapper cw20 to native token");

  // 1. Walle2 creates request
  let wallet2_client = await SigningCosmWasmClient.connectWithSigner(
    mainnet.networkInfo.url, 
    wallet2, 
    {gasPrice: GasPrice.fromString("0.025ujuno")},
  );
 
  // Create request of `swap` in `junoswap`
  let realSwapMsg = toEncodedBinary({
    swap: {
      input_token: "Token2",
      input_amount: tcw_amount,
      min_output: (parseInt(tcw_amount) - 20).toString(),
      max_output: (parseInt(tcw_amount) + 20).toString(),
      expiration: undefined,
    } 
  });

  let wrapperSwapMsg = toEncodedBinary({
    swap: {
      user: mainnet.addresses.wallet2,
      contract_addr: tcwUjunoswap,
      swap_msg: realSwapMsg,
      output_token: {
        native_token: {
          denom: "ujuno",
        }
      },
      input_token: {
        token: {
          contract_addr: tcw,
        }
      },
      input_amount: tcw_amount,
      min_output: (parseInt(tcw_amount) - 20).toString(),
      max_output: (parseInt(tcw_amount) + 20).toString(),
      recipient_exist: false,
    },
  });

  // increase allowance before "create_request"
  await wallet2_client.execute(mainnet.addresses.wallet2, tcw, {
    increase_allowance: {
      spender: registryStake,
      amount: tcw_amount,
      expires: undefined,
    }
  }, "auto", undefined);

  const createReqResult = await wallet2_client.execute(mainnet.addresses.wallet2, registryStake, {
    create_request: {
      target: wrapperJunoSwap,
      msg: wrapperSwapMsg,
      input_asset: {
        info: {
          token: {
            contract_addr: tcw,
          }
        },
        amount: tcw_amount,
      }
    },
  }, "auto", undefined, [coin("1000", "ujuno")]);

  // Check if the request created
  const requestsQuery: any = await junod.queryContractSmart(registryStake, {
    requests: {},
  });
  const requestId = requestsQuery.requests[0].id;


  // Record the ujunox balance of Wallet2
  const beforeUjuno: Coin = await junod.getBalance(mainnet.addresses.wallet2, "ujuno"); 
  const beforeUjunoBalance = beforeUjuno.amount;

  // 2. Wallet3 executes the request
  let wallet3_client = await SigningCosmWasmClient.connectWithSigner(
    mainnet.networkInfo.url, 
    wallet3, 
    {gasPrice: GasPrice.fromString("0.025ujuno")},
  );

  // 3. Wallet2 receives some TCW tokens.
  const result: any = await wallet3_client.execute(mainnet.addresses.wallet3, registryStake, {
      execute_request: {
        id: requestId,
      },
    }, "auto", undefined);


  // Check the ujunox balance of Wallet2
  const afterUjuno: Coin = await junod.getBalance(mainnet.addresses.wallet2, "ujuno"); 
  const afterUjunoBalance = afterUjuno.amount;

  expect(parseInt(afterUjunoBalance) != parseInt(beforeUjunoBalance)).to.be.ok;

  console.log(chalk.green(" Passed!"));
}
