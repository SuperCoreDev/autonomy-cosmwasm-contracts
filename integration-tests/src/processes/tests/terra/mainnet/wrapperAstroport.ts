import chalk from "chalk";
import { LCDClient, LocalTerra, MsgExecuteContract, Wallet } from "@terra-money/terra.js";

import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { sendTransaction, toEncodedBinary } from "../../../../utils/terra/helpers";
import { testnet } from "../../../../config/terraConstants";

chai.use(chaiAsPromised);
const { expect } = chai;

export async function testExecuteWrapperAstroport(
  terra: LocalTerra | LCDClient,
  wallet1: Wallet,
  wallet2: Wallet,
  wallet3: Wallet,
  auto: string,
  registryStake: string,
  tcw: string,
  tcwUlunaSwap: string,
  tcw_auto_swap: string,
  wrapperAstroport: string,
): Promise<void> {
  console.log(chalk.yellow("\nStep 3. Running Tests"));

  // // Wallet1 add liquidity
  // await walletAddLiquidity2TcwUlunaSwap(terra, wallet1, tcwUlunaSwap, tcw, "100000000", "100000000");
  // await walletAddLiquidity2TcwAutoSwap(terra, wallet1, tcw_auto_swap, tcw, auto, "100000000", "100000000")

  // // Test "WrapperAstroport"
  // await testWrapperSuccessSwap(terra, wallet1, wallet2, wallet3, wrapperAstroport, tcwUlunaSwap, tcw, "1000");
  
  // await testWrapperWholeFlowInTcwLunaPair(terra, wallet1, wallet2, wallet3, wrapperAstroport, registryStake, tcwUlunaSwap, tcw, "1000", "100");
  
  // await testWrapperWholeFlowInTcwAutoPair(terra, wallet1, wallet2, wallet3, wrapperAstroport, registryStake, tcw_auto_swap, tcw, auto, "1000", "100");
  
  process.exit();
}

// -------------------------------
// "Sender"(wallet) adds the liquidity to the TCW-LUNA pair
// -------------------------------
async function walletAddLiquidity2TcwUlunaSwap(
  terra: LocalTerra | LCDClient,
  senderWallet: Wallet,
  pair: string,
  tcw: string,
  uluna_amount: string,
  tcw_amount: string,
): Promise<void> {
  process.stdout.write(`Wallet1 add liquidity to TCW-uluna pair :`);

  // First, increase the allowance
  await sendTransaction(terra, senderWallet, [
    new MsgExecuteContract(
      senderWallet.key.accAddress, 
      tcw, {
        increase_allowance: {
          spender: pair,
          amount: tcw_amount,
          expires: undefined,
        }
      }
    )
  ]);
  
  // Provide liquidity
  await sendTransaction(terra, senderWallet, [
    new MsgExecuteContract(
      senderWallet.key.accAddress,
      pair, {
        "provide_liquidity": {
          "assets": [
            {
              "info": {
                "token": {
                  "contract_addr": tcw,
                }
              },
              "amount": tcw_amount,
            },
            {
              "info": {
                "native_token": {
                  "denom": "uluna"
                }
              },
              "amount": uluna_amount,
            }
          ],
          "auto_stake": false,
          "receiver": senderWallet.key.accAddress,
        }
      }, 
      { uluna: uluna_amount },
    )
  ])

  console.log(chalk.green(" Success!\n"));
}

// -------------------------------
// "Sender"(wallet) adds the liquidity to the TCW-AUTO pair
// -------------------------------
async function walletAddLiquidity2TcwAutoSwap(
  terra: LocalTerra | LCDClient,
  senderWallet: Wallet,
  pair: string,
  tcw: string,
  auto: string,
  tcw_amount: string,
  auto_amount: string,
): Promise<void> {
  process.stdout.write(`Wallet1 add liquidity to TCW-AUTO pair :`);

  // First, increase the allowance
  await sendTransaction(terra, senderWallet, [
    new MsgExecuteContract(
      senderWallet.key.accAddress, 
      tcw, {
        increase_allowance: {
          spender: pair,
          amount: tcw_amount,
          expires: undefined,
        }
      }
    )
  ]);

  await sendTransaction(terra, senderWallet, [
    new MsgExecuteContract(
      senderWallet.key.accAddress, 
      auto, {
        increase_allowance: {
          spender: pair,
          amount: auto_amount,
          expires: undefined,
        }
      }
    )
  ]);
  
  
  // Provide liquidity
  await sendTransaction(terra, senderWallet, [
    new MsgExecuteContract(
      senderWallet.key.accAddress,
      pair, {
        "provide_liquidity": {
          "assets": [
            {
              "info": {
                "token": {
                  "contract_addr": tcw,
                }
              },
              "amount": tcw_amount,
            },
            {
              "info": {
                "token": {
                  "contract_addr": auto,
                }
              },
              "amount": auto_amount,
            }
          ],
          "auto_stake": false,
          "receiver": senderWallet.key.accAddress,
        }
      },
    )
  ])

  console.log(chalk.green(" Success!\n"));
}

// -----------------------------------------------
//  TEST: "WrapperAstroport" successfully performs swap
//  
//  SCENARIO: 
//    Wallet3(executor) sends the "swap" request to "WrapperAstroport".
//    Wallet2(user) receives the "swap" result - some TCW tokens.
// ------------------------------------------------
async function testWrapperSuccessSwap(
  terra: LocalTerra | LCDClient,
  wallet1: Wallet, 
  wallet2: Wallet,
  wallet3: Wallet,
  wrapperAstroport: string,
  tcwUlunaSwap: string,
  tcw: string,
  uluna_amount: string,
): Promise<void> {
  process.stdout.write("Test - WrapperAstroport performs swap");

  const beforeTcw: any = await terra.wasm.contractQuery(tcw, {
    balance: {
      address: wallet2.key.accAddress,
    }
  });
  const beoreTcwBalance = beforeTcw.balance;

  let swapMsg = toEncodedBinary({
    "swap": {
      "offer_asset": {
        "info": {
          "native_token": {
            "denom": "uluna"
          }
        },
        "amount": uluna_amount
      },
      "belief_price": undefined, // could be number
      "max_spread": undefined, // could be number
      "to": wallet2.key.accAddress,
      // "to": undefined,
    }
  });

  const result = await sendTransaction(terra, wallet3, [
    new MsgExecuteContract(
      wallet3.key.accAddress,
      wrapperAstroport, {
        swap: {
          user: wallet2.key.accAddress,
          contract_addr: tcwUlunaSwap,
          swap_msg: swapMsg,
          offer_asset: {
            info: {
              native_token: {
                denom: "uluna",
              }
            },
            amount: uluna_amount,
          },
          output_asset: {
            token: {
              contract_addr: tcw,
            }
          },
          min_output: (parseInt(uluna_amount) - 100).toString(),
          max_output: (parseInt(uluna_amount) + 100).toString(),
          recipient_exist: true,
        },
      }, { uluna: uluna_amount }
    )
  ]);

  const afterTcw: any = await terra.wasm.contractQuery(tcw, {
    balance: {
      address: wallet2.key.accAddress,
    }
  });
  const afterTcwBalance = afterTcw.balance;

  expect(parseInt(afterTcwBalance) != parseInt(beoreTcwBalance)).to.be.ok;

  console.log(chalk.green(" Passed!"));
}

// -----------------------------------------------
//  TEST: "WrapperAstroport" whole workflow in TCW-LUNA pair
//  
//  SCENARIO: 
//    1. Wallet2(user) sends "create_request" to "registry".
//    2. Wallet3(executor) sends "execute_request" to "registry".
//        - Here, we assume that the condition(limit order/stop loss) already met.
//    3. Wallet2(user) receives the "swap" result - some TCW tokens.
// ------------------------------------------------
async function testWrapperWholeFlowInTcwLunaPair(
  terra: LocalTerra | LCDClient,
  wallet1: Wallet, 
  wallet2: Wallet,
  wallet3: Wallet,
  wrapperAstroport: string,
  registryStake: string, 
  tcwUlunaSwap: string,
  tcw: string,
  uluna_amount: string,
  max_diff: string,
): Promise<void> {
  process.stdout.write("Test - WrapperAstroport whole workflow in TCW-LUNA pair");


  // Record the TCW balance of Wallet2
  const beforeTcw: any = await terra.wasm.contractQuery(tcw, {
    balance: {
      address: wallet2.key.accAddress,
    }
  });
  const beforeTcwBalance = beforeTcw.balance;
  console.log(`\nbefore: ${beforeTcwBalance} TCW`);

  // 1. Walle2 creates request
  // Create request of `swap` in `astroport-swap`
  let realSwapMsg = toEncodedBinary({
    "swap": {
      "offer_asset": {
        "info": {
          "native_token": {
            "denom": "uluna"
          }
        },
        "amount": uluna_amount
      },
      "belief_price": undefined, // could be number
      "max_spread": undefined, // could be number
      // "to": wallet2.key.accAddress,
      "to": undefined,
    }
  });

  let wrapperSwapMsg = toEncodedBinary({
    swap: {
      user: wallet2.key.accAddress,
      contract_addr: tcwUlunaSwap,
      swap_msg: realSwapMsg,
      offer_asset: {
        info: {
          native_token: {
            denom: "uluna",
          }
        },
        amount: uluna_amount,
      },
      output_asset: {
        token: {
          contract_addr: tcw,
        }
      },
      min_output: (parseInt(uluna_amount) - parseInt(max_diff)).toString(),
      max_output: (parseInt(uluna_amount) + parseInt(max_diff)).toString(),
      recipient_exist: false,
    },
  });

  const createReqResult = await sendTransaction(terra, wallet2, [
    new MsgExecuteContract(
      wallet2.key.accAddress,
      registryStake, {
        create_request: {
          target: wrapperAstroport,
          msg: wrapperSwapMsg,
          input_asset: {
            info: {
                native_token: {
                denom: "uluna",
              },
            },
            amount: uluna_amount,
          }
        },
      }, {uluna: parseInt(uluna_amount) + parseInt(testnet.contractConsts.registryFeeAmt) },
    )
  ])

  // Get the requestId
  const requestsQuery: any = await terra.wasm.contractQuery(registryStake, {
    requests: {},
  });
  const requestId: number = requestsQuery.requests[0].id;

  // 2. Wallet3 executes the request & 3. Wallet2 receives some TCW tokens.
  await sendTransaction(terra, wallet3, [
    new MsgExecuteContract(
      wallet3.key.accAddress,
      registryStake, {
        execute_request: {
          id: requestId,
        },
      }, { uluna: uluna_amount },
    )
  ]);

  // Check the TCW balance of Wallet2
  const afterTcw: any = await terra.wasm.contractQuery(tcw, {
    balance: {
      address: wallet2.key.accAddress,
    }
  });
  const afterTcwBalance = afterTcw.balance;
  console.log(`after: ${afterTcwBalance} TCW`);
  
  expect(parseInt(afterTcwBalance) != parseInt(beforeTcwBalance)).to.be.ok;

  console.log(chalk.green(" Passed!"));
}

// -----------------------------------------------
//  TEST: "WrapperAstroport" workflow in TCW-AUTO pair
//  
//  SCENARIO: 
//    1. Wallet2(user) creates "(swap)request".
//    2. Wallet1(executor) sends the "swap" request through "WrapperAstroport".
//    3. Wallet2(user) receives the "swap" result - some TCW tokens.
// ------------------------------------------------
async function testWrapperWholeFlowInTcwAutoPair(
  terra: LocalTerra | LCDClient,
  wallet1: Wallet, 
  wallet2: Wallet,
  wallet3: Wallet,
  wrapperAstroport: string,
  registryStake: string, 
  tcw_auto_swap: string,
  tcw: string,
  auto: string,
  auto_amount: string,
  max_diff: string,
): Promise<void> {
  process.stdout.write("Test - WrapperAstroport whole workflow in TCW-AUTO pair");

  // Record the TCW balance of Wallet2
  const beforeTcw: any = await terra.wasm.contractQuery(tcw, {
    balance: {
      address: wallet2.key.accAddress,
    }
  });
  const beforeTcwBalance = beforeTcw.balance;
  console.log(`\nbefore: ${beforeTcwBalance} TCW`);

  // 1. Walle2 creates request

  // First, increase the allowance
  await sendTransaction(terra, wallet2, [
    new MsgExecuteContract(
      wallet2.key.accAddress, 
      auto, {
        increase_allowance: {
          spender: registryStake,
          amount: auto_amount,
          expires: undefined,
        }
      }
    )
  ]);

  // Create request of `swap` in `astroport-swap`
  let realSwapMsg = toEncodedBinary({
    "swap": {
      "offer_asset": {
        "info": {
          "token": {
            "contract_addr": auto
          }
        },
        "amount": auto_amount
      },
      "belief_price": undefined, // could be number
      "max_spread": undefined, // could be number
      // "to": wallet2.key.accAddress,
      "to": undefined,
    }
  });

  let wrapperSwapMsg = toEncodedBinary({
    swap: {
      user: wallet2.key.accAddress,
      contract_addr: tcw_auto_swap,
      swap_msg: realSwapMsg,
      offer_asset: {
        info: {
          token: {
            contract_addr: auto,
          }
        },
        amount: auto_amount,
      },
      output_asset: {
        token: {
          contract_addr: tcw,
        }
      },
      min_output: (parseInt(auto_amount) - parseInt(max_diff)).toString(),
      max_output: (parseInt(auto_amount) + parseInt(max_diff)).toString(),
      recipient_exist: false,
    },
  });

  const createReqResult = await sendTransaction(terra, wallet2, [
    new MsgExecuteContract(
      wallet2.key.accAddress,
      registryStake, {
        create_request: {
          target: wrapperAstroport,
          msg: wrapperSwapMsg,
          input_asset: {
            info: {
                token: {
                contract_addr: auto,
              },
            },
            amount: auto_amount,
          }
        },
      }, {uluna: parseInt(testnet.contractConsts.registryFeeAmt) },
    )
  ])

  // Get the requestId
  const requestsQuery: any = await terra.wasm.contractQuery(registryStake, {
    requests: {},
  });
  const requestId: number = requestsQuery.requests[0].id;

  // 2. Wallet3(executor) executes the request
  // 3. Wallet2 receives some TCW tokens.
  await sendTransaction(terra, wallet3, [
    new MsgExecuteContract(
      wallet3.key.accAddress,
      registryStake, {
        execute_request: {
          id: requestId,
        },
      },
    )
  ]);

  // Check the AUTO balance of Wallet2
  const afterTcw: any = await terra.wasm.contractQuery(tcw, {
    balance: {
      address: wallet2.key.accAddress,
    }
  });
  const afterTcwBalance = afterTcw.balance;
  console.log(`after: ${afterTcwBalance} TCW`);

  expect(parseInt(afterTcwBalance) != parseInt(beforeTcwBalance)).to.be.ok;

  console.log(chalk.green(" Passed!"));
}