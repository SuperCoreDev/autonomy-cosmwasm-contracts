/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from "chalk";
import { LCDClient, LocalTerra, MsgExecuteContract, Wallet } from "@terra-money/terra.js";

import { storeCode, instantiateContract, sendTransaction } from "../../../../utils/terra/helpers";
import { wasm_path } from "../../../../config/wasmPaths";
import { testnet } from '../../../../config/terraConstants';


// -------------------------------------------------------------------------------------
// Variables
// -------------------------------------------------------------------------------------

let terra: LocalTerra | LCDClient;
let wallet1: Wallet;
let wallet2: Wallet; 
let wallet3: Wallet;

let tcw: string;
let astroportFactory: string;
let tcwUlunaSwap: string;
let tcw_auto_swap: string;
let wrapperAstroport: string;


// -------------------------------------------------------------------------------------
// setup all contracts for LocalTerra and TestNet
// -------------------------------------------------------------------------------------
export async function setupWrapperAstroport(
    terra: LocalTerra | LCDClient,
    wallets: {
        wallet1: Wallet,
        wallet2: Wallet,
        wallet3: Wallet,
    }
): Promise<void> {
    terra = terra;
    wallet1 = wallets.wallet1;
    wallet2 = wallets.wallet2;
    wallet3 = wallets.wallet3;
    
    await setup(terra, wallet1);

    console.log(chalk.green(" Done!"));
    process.exit();
}

async function setup(
    terra: LocalTerra | LCDClient,
    wallet1: Wallet,
): Promise<void> {
    // Step 1. Upload all local wasm files and capture the codes for each....

    process.stdout.write("Uploading WrapperAstroport Wasm");
    const wrapperAstroportCodeId = await storeCode(
        terra,
        wallet1, 
        `${wasm_path.station}/wrapper_astroport.wasm`
    );
    console.log(chalk.green(" Done!"), `${chalk.blue("codeId")} = ${wrapperAstroportCodeId}`);

    // Step 2. Instantiate contracts

    // TCW token 
    process.stdout.write("Instantiating TCW token contract");

    const tcwTokenResult = await instantiateContract(
        terra,
        wallet1,
        wallet1,
        testnet.codes.cw20TokenCodeId,
        {
            "name": "Test Cw20 TOKEN",
            "symbol": "TCW",
            "decimals": 6,
            "initial_balances": [
                {
                    "address": wallet1.key.accAddress,
                    "amount": "10000000000"
                }
            ]   
        }
        );
    tcw = tcwTokenResult.logs[0].events
        .find((event) => {
            return event.type == "instantiate";
        })
        ?.attributes.find((attribute) => {
            return attribute.key == "_contract_address";
        })?.value as string;
    console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${tcw}`);
    
    // tcwUlunaSwap
    process.stdout.write("Instantiating TcwUlunaSwap(Pair) contract");
    
    const tcwulunaSwapResult = await sendTransaction(
        terra,
        wallet1,[
            new MsgExecuteContract(
                wallet1.key.accAddress,
                testnet.contracts.astroportFactory,
                {
                    "create_pair": {
                        "pair_type": {
                          "xyk": {}
                        },
                        "asset_infos": [
                          {
                            "token": {
                              "contract_addr": tcw,
                            }
                          },
                          {
                            "native_token": {
                              "denom": "uluna"
                            }
                          }
                        ],
                        "init_params": undefined,
                    }
                },
            )
        ]
      );

    tcwUlunaSwap = tcwulunaSwapResult.logs[0].events
        .find((event) => {
            return event.type == "instantiate";
        })
        ?.attributes.find((attribute) => {
            return attribute.key == "_contract_address";
        })?.value as string;
    console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${tcwUlunaSwap}`);


    // tcw-auto Swap
    process.stdout.write("Instantiating TCW-AUTO Swap(Pair) contract");
    
    const tcw_auto_SwapResult = await sendTransaction(
        terra,
        wallet1,[
            new MsgExecuteContract(
                wallet1.key.accAddress,
                astroportFactory,
                {
                    "create_pair": {
                        "pair_type": {
                          "xyk": {}
                        },
                        "asset_infos": [
                          {
                            "token": {
                              "contract_addr": tcw,
                            }
                          },
                          {
                            "token": {
                              "contract_addr": testnet.contracts.auto,
                            }
                          }
                        ],
                        "init_params": undefined,
                    }
                },
            )
        ]
      );

    tcw_auto_swap = tcw_auto_SwapResult.logs[0].events
        .find((event) => {
            return event.type == "instantiate";
        })
        ?.attributes.find((attribute) => {
            return attribute.key == "_contract_address";
            // return attribute.key == "pair_contract_addr";
        })?.value as string;
    console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${tcw_auto_swap}`);


    // WrapperAstroport
    process.stdout.write("Instantiating WrapperAstroport contract");
    
    const wrapperAstroportResult = await instantiateContract(
        terra,
        wallet1,
        wallet1,
        wrapperAstroportCodeId,
        { }
      );
    wrapperAstroport = wrapperAstroportResult.logs[0].events
        .find((event) => {
            return event.type == "instantiate";
        })
        ?.attributes.find((attribute) => {
            return attribute.key == "_contract_address";
        })?.value as string;
    console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${wrapperAstroport}`);

}