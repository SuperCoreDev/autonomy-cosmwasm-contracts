import chalk from "chalk";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { Coin, coin, DirectSecp256k1HdWallet, Registry } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";

import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";

import { localjuno } from "../../../../config/localjunoConstants";
import {toEncodedBinary } from "../../../../utils/juno/helpers";

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
  tcwUcosmSwap: string,
  wrapperJunoSwap: string,
): Promise<void> {
  console.log(chalk.yellow("\nStep 3. Running Tests"));

  // // Wallet1 add liquidity
  // await walletAddLiquidity(wallet1, localjuno.addresses.wallet1, tcw, tcwUcosmSwap, "1000000", "1000000");

  // // Test "WrapperJunoswap"
  // await testWrapperSuccessSwap(junod, wallet1, wallet2, wallet3, wrapperJunoSwap, tcwUcosmSwap, tcw, "1000");
  
  // // Test the whole flow of swapping ucosm(native) -> TCW(cw20)
  // await testWrapperNative2Cw20Token(junod, wallet1, wallet2, wallet3, wrapperJunoSwap, registryStake, tcwUcosmSwap, tcw, "1000");

  // // Test the whole flow of swapping TCW(cw20) -> ucosm(native)
  // await testWrapperCw20Token2Native(junod, wallet1, wallet2, wallet3, wrapperJunoSwap, registryStake, tcwUcosmSwap, tcw, "1000");
  
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
  ucosm_amount: string,
  tcw_amount: string,
): Promise<void> {
  process.stdout.write(`Wallet1 add liquidity to TCW-ucosm swap :`);

  let sender_client = await SigningCosmWasmClient.connectWithSigner(
    localjuno.networkInfo.url, 
    senderWallet, 
    { gasPrice: GasPrice.fromString("0.1ujunox") },
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
      token1_amount: ucosm_amount,
      min_liquidity: ucosm_amount,
      max_token2: tcw_amount,
      expiration: undefined,
    }
  }, "auto", undefined, [coin(ucosm_amount, "ucosm")]);

  console.log(chalk.green(" Success!\n"));
}

// -----------------------------------------------
//  TEST: "WrapperJunoSwap" successfully performs swap
//  
//  SCENARIO: 
//    Wallet1(liquidity provider) provides 1:1 TCW-ucosm liquidity.
//    Wallet3(executor) sends the "swap" request through "WrapperJunoSwap".
//    Wallet2(user) receives the "swap" result - some TCW tokens.
// ------------------------------------------------
async function testWrapperSuccessSwap(
  junod: SigningCosmWasmClient,
  wallet1: DirectSecp256k1HdWallet, 
  wallet2: DirectSecp256k1HdWallet,
  wallet3: DirectSecp256k1HdWallet,
  wrapperJunoSwap: string,
  tcwUcosmSwap: string,
  tcw: string,
  ucosm_amount: string,
): Promise<void> {
  process.stdout.write("Test - JunoSwapWrapper performs swap");

  const beforeTcw: any = await junod.queryContractSmart(tcw, {
    balance: {
      address: localjuno.addresses.wallet2,
    }
  });
  const beoreTcwBalance = beforeTcw.balance;

  let wallet3_client = await SigningCosmWasmClient.connectWithSigner(
    localjuno.networkInfo.url, 
    wallet3, 
    {gasPrice: GasPrice.fromString("0.1ujunox")},
  );

  let swapMsg = toEncodedBinary({
    swap: {
      input_token: "Token1",
      input_amount: ucosm_amount,
      min_output: (parseInt(ucosm_amount) - 10).toString(),
      max_output: (parseInt(ucosm_amount) + 20).toString(),
      expiration: undefined,
    } 
  });

  const result: any = await wallet3_client.execute(localjuno.addresses.wallet3, wrapperJunoSwap, {
      swap: {
        user: localjuno.addresses.wallet2,
        contract_addr: tcwUcosmSwap,
        swap_msg: swapMsg,
        input_token: {
          native_token: {
            denom: "ucosm",
          }
        },
        output_token: {
          token: {
            contract_addr: tcw,
          }
        },
        input_amount: ucosm_amount,
        min_output: (parseInt(ucosm_amount) - 10).toString(),
        max_output: (parseInt(ucosm_amount) + 10).toString(),
        recipient_exist: false,
      },
    }, "auto", undefined, [coin(ucosm_amount, "ucosm")]);

  const afterTcw: any = await junod.queryContractSmart(tcw, {
    balance: {
      address: localjuno.addresses.wallet2,
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
  tcwUcosmSwap: string,
  tcw: string,
  ucosm_amount: string,
): Promise<void> {
  process.stdout.write("Test - JunoSwapWrapper native to cw20 token");

  // 1. Walle2 creates request
  let wallet2_client = await SigningCosmWasmClient.connectWithSigner(
    localjuno.networkInfo.url, 
    wallet2, 
    {gasPrice: GasPrice.fromString("0.1ujunox")},
  );

  // // "update_executor" to prevent the unexpected error
  // await wallet2_client.execute(localjuno.addresses.wallet2, registryStake, {
  //   update_executor: {}
  // }, "auto", undefined, []);
 
  // Create request of `swap` in `junoswap`
  let realSwapMsg = toEncodedBinary({
    swap: {
      input_token: "Token1",
      input_amount: ucosm_amount,
      min_output: (parseInt(ucosm_amount) - 10).toString(),
      max_output: (parseInt(ucosm_amount) + 10).toString(),
      expiration: undefined,
    } 
  });

  let wrapperSwapMsg = toEncodedBinary({
    swap: {
      user: localjuno.addresses.wallet2,
      contract_addr: tcwUcosmSwap,
      swap_msg: realSwapMsg,
      input_token: {
        native_token: {
          denom: "ucosm",
        }
      },
      output_token: {
        token: {
          contract_addr: tcw,
        }
      },
      input_amount: ucosm_amount,
      min_output: (parseInt(ucosm_amount) - 10).toString(),
      max_output: (parseInt(ucosm_amount) + 10).toString(),
      recipient_exist: false,
    },
  });

  const createReqResult = await wallet2_client.execute(localjuno.addresses.wallet2, registryStake, {
    create_request: {
      target: wrapperJunoSwap,
      msg: wrapperSwapMsg,
      input_asset: {
        info: {
            native_token: {
              denom: "ucosm",
          },
        },
        amount: ucosm_amount,
      }
    },
  }, "auto", undefined, [coin(parseInt(ucosm_amount) + parseInt("1000000"), "ucosm")]);

  // Check if the request created
  const requestsQuery: any = await junod.queryContractSmart(registryStake, {
    requests: {},
  });
  const requestId = requestsQuery.requests[0].id;

  // Record the TCW balance of Wallet2
  const beforeTcw: any = await junod.queryContractSmart(tcw, {
    balance: {
      address: localjuno.addresses.wallet2,
    }
  });
  const beoreTcwBalance = beforeTcw.balance;

  // Record the ucosm balance of Wallet3
  const beforeUcosm: Coin = await junod.getBalance(localjuno.addresses.wallet3, "ucosm"); 
  const beforeUcosmBalance = beforeUcosm.amount;

  // 2. Wallet3 executes the request
  let wallet3_client = await SigningCosmWasmClient.connectWithSigner(
    localjuno.networkInfo.url, 
    wallet3, 
    {gasPrice: GasPrice.fromString("0.1ujunox")},
  );

  // 3. Wallet2 receives some TCW tokens.
  const result: any = await wallet3_client.execute(localjuno.addresses.wallet3, registryStake, {
      execute_request: {
        id: requestId,
      },
    }, "auto", undefined, [coin(ucosm_amount, "ucosm")]);


  // Check the TCW balance of Wallet2
  const afterTcw: any = await junod.queryContractSmart(tcw, {
    balance: {
      address: localjuno.addresses.wallet2,
    }
  });
  const afterTcwBalance = afterTcw.balance;

  // Check the ucosm balance of Wallet3
  const afterUcosm: Coin = await junod.getBalance(localjuno.addresses.wallet3, "ucosm"); 
  const afterUcosmBalance = afterUcosm.amount;

  // console.log(beoreTcwBalance,":", beforeUcosmBalance);
  // console.log(afterTcwBalance,":", afterUcosmBalance);
  // console.log(ucosm_amount, ":", "1000000");

  expect(parseInt(afterTcwBalance) != parseInt(beoreTcwBalance)).to.be.ok;
  expect(parseInt(afterUcosmBalance) != parseInt(beforeUcosmBalance)).to.be.ok;

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
  tcwUcosmSwap: string,
  tcw: string,
  tcw_amount: string,
): Promise<void> {
  process.stdout.write("Test - JunoSwapWrapper cw20 to native token");

  // 1. Walle2 creates request
  let wallet2_client = await SigningCosmWasmClient.connectWithSigner(
    localjuno.networkInfo.url, 
    wallet2, 
    {gasPrice: GasPrice.fromString("0.1ujunox")},
  );

  // // "update_executor" to prevent the unexpected error
  // await wallet2_client.execute(localjuno.addresses.wallet2, registryStake, {
  //   update_executor: {}
  // }, "auto", undefined, []);
 
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
      user: localjuno.addresses.wallet2,
      contract_addr: tcwUcosmSwap,
      swap_msg: realSwapMsg,
      output_token: {
        native_token: {
          denom: "ucosm",
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
  await wallet2_client.execute(localjuno.addresses.wallet2, tcw, {
    increase_allowance: {
      spender: registryStake,
      amount: tcw_amount,
      expires: undefined,
    }
  }, "auto", undefined);

  const createReqResult = await wallet2_client.execute(localjuno.addresses.wallet2, registryStake, {
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
  }, "auto", undefined, [coin("1000000", "ucosm")]);

  // Check if the request created
  const requestsQuery: any = await junod.queryContractSmart(registryStake, {
    requests: {},
  });
  const requestId = requestsQuery.requests[0].id;


  // Record the ucosm balance of Wallet2
  const beforeUcosm: Coin = await junod.getBalance(localjuno.addresses.wallet2, "ucosm"); 
  const beforeUcosmBalance = beforeUcosm.amount;

  // 2. Wallet3 executes the request
  let wallet3_client = await SigningCosmWasmClient.connectWithSigner(
    localjuno.networkInfo.url, 
    wallet3, 
    {gasPrice: GasPrice.fromString("0.1ujunox")},
  );

  // 3. Wallet2 receives some TCW tokens.
  const result: any = await wallet3_client.execute(localjuno.addresses.wallet3, registryStake, {
      execute_request: {
        id: requestId,
      },
    }, "auto", undefined);


  // Check the ucosm balance of Wallet2
  const afterUcosm: Coin = await junod.getBalance(localjuno.addresses.wallet2, "ucosm"); 
  const afterUcosmBalance = afterUcosm.amount;

  // console.log("before :", beforeUcosmBalance);
  // console.log("after :", afterUcosmBalance);
  // console.log(tcw_amount);

  expect(parseInt(afterUcosmBalance) != parseInt(beforeUcosmBalance)).to.be.ok;

  console.log(chalk.green(" Passed!"));
}
