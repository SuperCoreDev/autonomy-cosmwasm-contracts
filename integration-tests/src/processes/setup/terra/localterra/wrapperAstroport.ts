/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from "chalk";
import { LCDClient, LocalTerra, MsgExecuteContract, Wallet } from "@terra-money/terra.js";

import { storeCode, instantiateContract, sendTransaction } from "../../../../utils/terra/helpers";
import { wasm_path } from "../../../../config/wasmPaths";
import { localterra } from '../../../../config/localterraConstants';


// -------------------------------------------------------------------------------------
// Variables
// -------------------------------------------------------------------------------------

let terra: LocalTerra;
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
    
    process.stdout.write("Uploading CW20 Token Wasm");
    const cw20CodeId = await storeCode(
        terra,
        wallet1, 
        `${wasm_path.station}/cw20_base.wasm`
    );
    console.log(chalk.green(" Done!"), `${chalk.blue("codeId")} = ${cw20CodeId}`);

    process.stdout.write("Uploading Astroport Pair Wasm");
    const pairCodeId = await storeCode(
        terra,
        wallet1, 
        `${wasm_path.station}/astroport_pair.wasm`
    );
    console.log(chalk.green(" Done!"), `${chalk.blue("codeId")} = ${pairCodeId}`);

    process.stdout.write("Uploading Astroport Factory Wasm");
    const factoryCodeId = await storeCode(
        terra, 
        wallet1,
        `${wasm_path.station}/astroport_factory.wasm`
    );
    console.log(chalk.green(" Done!"), `${chalk.blue("codeId")} = ${factoryCodeId}`);

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
        cw20CodeId,
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
    
    // AstroportFactory
    process.stdout.write("Instantiating Astroport Factory contract");
    const astroportFactoryResult = await instantiateContract(
        terra,
        wallet1,
        wallet1,
        factoryCodeId,
        {
            "token_code_id": cw20CodeId,
            "fee_address": undefined,
            "owner": wallet1.key.accAddress,
            "generator_address": undefined,
            "whitelist_code_id": 0,
            "pair_configs": [{
                "code_id": pairCodeId,
                "pair_type": {
                    "xyk": {}
                },
                "total_fee_bps": 0,
                "maker_fee_bps": 0,
                "is_disabled": false,
                "is_generator_disabled": true,
            }]
        }
    );
    astroportFactory = astroportFactoryResult.logs[0].events
        .find((event) => {
            return event.type == "instantiate";
        })
        ?.attributes.find((attribute) => {
            return attribute.key == "_contract_address";
        })?.value as string;

    console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${astroportFactory}`);

    // tcwUlunaSwap
    process.stdout.write("Instantiating TCW-LUNA Swap(Pair) contract");
    
    const tcwulunaSwapResult = await sendTransaction(
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
            // return attribute.key == "pair_contract_addr";
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
                              "contract_addr": localterra.contracts.auto,
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