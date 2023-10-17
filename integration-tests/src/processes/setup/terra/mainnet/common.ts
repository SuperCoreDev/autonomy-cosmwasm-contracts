/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from "chalk";
import { LocalTerra, Wallet, MsgExecuteContract, LCDClient } from "@terra-money/terra.js";

import { storeCode, instantiateContract, sendTransaction, toEncodedBinary } from "../../../../utils/terra/helpers";
import { wasm_path } from "../../../../config/wasmPaths";
import { mainnet } from '../../../../config/terraConstants';


// -------------------------------------------------------------------------------------
// Variables
// -------------------------------------------------------------------------------------

let terra: LocalTerra | LCDClient;
let wallet1: Wallet;
let wallet2: Wallet; // reg_user_fee_veri_forwarder
let wallet3: Wallet; // router_user_fee_veri_forwarder

let auto: string;
let registryStake: string;

// -------------------------------------------------------------------------------------
// setup all contracts for LocalTerra
// -------------------------------------------------------------------------------------
export async function setupCommon(
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

    // // Wallet3 stake some AUTOs to become a executor
    // await stakeAUTO2RegistryStake(terra, wallet3, registryStake, auto, 1);

    console.log(chalk.green(" Done!"));
}

async function setup(
    terra: LocalTerra | LCDClient,
    wallet1: Wallet,
): Promise<void> {
    // Step 1. Upload all local wasm files and capture the codes for each....

    // process.stdout.write("Uploading CW20 Token Wasm");
    // const cw20CodeId = await storeCode(
    //     terra,
    //     wallet1, 
    //     `${wasm_path.station}/cw20_base.wasm`
    // );
    // console.log(chalk.green(" Done!"), `${chalk.blue("codeId")} = ${cw20CodeId}`);

    // process.stdout.write("Uploading RegistryStake Wasm");
    // const registryStakeCodeId = await storeCode(
    //     terra,
    //     wallet1, 
    //     `${wasm_path.station}/registry_stake.wasm`
    // );
    // console.log(chalk.green(" Done!"), `${chalk.blue("codeId")} = ${registryStakeCodeId}`);

    // Step 2. Instantiate contracts

    // // AUTO token 
    // process.stdout.write("Instantiating AUTO token contract");

    // const autoTokenResult = await instantiateContract(
    //     terra,
    //     wallet1,
    //     wallet1,
    //     mainnet.codes.cw20TokenCodeId,
    //     {
    //         "name": "Auto TOKEN",
    //         "symbol": "AUTO",
    //         "decimals": 6,
    //         "initial_balances": [
    //             {
    //                 "address": wallet1.key.accAddress,
    //                 "amount": "1000000000000"
    //             },
    //             // {
    //             //     "address": wallet2.key.accAddress,
    //             //     "amount": "10000000000"
    //             // },
    //             // {
    //             //     "address": wallet3.key.accAddress,
    //             //     "amount": "10000000000"
    //             // }
    //         ]   
    //     }
    //     );
    // auto = autoTokenResult.logs[0].events
    //     .find((event) => {
    //         return event.type == "instantiate";
    //     })
    //     ?.attributes.find((attribute) => {
    //         return attribute.key == "_contract_address";
    //     })?.value as string;
    // console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${auto}`);
    

    // // registryStake
    // process.stdout.write("Instantiating RegistryStake contract");
    // let auto = mainnet.contracts.auto;
    // const registryStakeResult = await instantiateContract(
    //     terra,
    //     wallet1,
    //     wallet1,
    //     mainnet.codes.registryStakeCodeId,
    //     {
    //         "auto": {
    //             "token": {
    //                 "contract_addr": auto, // AUTO token address
    //             }
    //         },
    //         "fee_amount": mainnet.contractConsts.registryFeeAmt,
    //         "fee_denom": mainnet.contractConsts.registryFeeDenom,
    //     }
    //   );
    // registryStake = registryStakeResult.logs[0].events
    //     .find((event) => {
    //         return event.type == "instantiate";
    //     })
    //     ?.attributes.find((attribute) => {
    //         return attribute.key == "_contract_address";
    //     })?.value as string;
    // console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${registryStake}`);
}

async function stakeAUTO2RegistryStake(
    terra: LocalTerra | LCDClient,
    wallet: Wallet,
    registryStake: string,
    auto: string,
    numStakes: number,
): Promise<void> {

    await sendTransaction(terra, wallet, [
        new MsgExecuteContract(
            wallet.key.accAddress,
            auto,
            {
                increase_allowance: {
                  spender: registryStake,
                  amount: (numStakes * 1000000).toString(),
                  expires: undefined,
                }
            },
          ),
    ]);

    await sendTransaction(terra, wallet, [
        new MsgExecuteContract(
            wallet.key.accAddress,
            auto,
            {
                send: {
                    contract: registryStake,
                    amount: (numStakes * 1000000).toString(),
                    msg: toEncodedBinary({
                        stake: {
                            num_stakes: numStakes,
                        }
                    })
                }
            },
          ),
    ]);
}