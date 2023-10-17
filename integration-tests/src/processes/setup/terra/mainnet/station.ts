/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from "chalk";
import { LCDClient, LocalTerra, Wallet } from "@terra-money/terra.js";

import { storeCode, instantiateContract } from "../../../../utils/terra/helpers";
import { wasm_path } from "../../../../config/wasmPaths";
import { mainnet } from '../../../../config/terraConstants';

// -------------------------------------------------------------------------------------
// Variables
// -------------------------------------------------------------------------------------

let terra: LocalTerra | LCDClient;
let wallet1: Wallet;
let wallet2: Wallet; // reg_user_fee_veri_forwarder
let wallet3: Wallet; // router_user_fee_veri_forwarder

let timeConditions: string;
let fundsRouter: string;
let counter: string;


// -------------------------------------------------------------------------------------
// setup all contracts for LocalTerra and mainNet
// -------------------------------------------------------------------------------------
export async function setupStation(
    terra: LocalTerra | LCDClient,
    wallets: {
        wallet1: Wallet,
        wallet2: Wallet,
        wallet3: Wallet,
    },
    auto: string,
    registryStake: string,
): Promise<void> {
    terra = terra;
    wallet1 = wallets.wallet1;
    wallet2 = wallets.wallet2;
    wallet3 = wallets.wallet3;

    await setup(terra, wallet1, registryStake);

    console.log(chalk.green(" Done!"));
}

async function setup(
    terra: LocalTerra | LCDClient,
    wallet1: Wallet,
    registryStake: string,
): Promise<void> {
    // // Step 1. Upload all local wasm files and capture the codes for each....

    // process.stdout.write("Uploading FundsRouter Wasm");
    // const fundsRouterCodeId = await storeCode(
    //     terra, 
    //     wallet1,
    //     `${wasm_path.station}/funds_router.wasm`
    // );

    // console.log(chalk.green(" Done!"), `${chalk.blue("codeId")}=${fundsRouterCodeId}`);

    // process.stdout.write("Uploading TimeConditions Wasm");
    // const timeConditionsCodeId = await storeCode(
    //     terra, 
    //     wallet1,
    //     `${wasm_path.station}/time_conditions.wasm`
    // );

    // console.log(chalk.green(" Done!"), `${chalk.blue("codeId")}=${timeConditionsCodeId}`);

    // process.stdout.write("Uploading (Test)Counter Wasm");
    // const counterCodeId = await storeCode(
    //     terra,
    //     wallet1, 
    //     `${wasm_path.station}/counter.wasm`
    // );
    // console.log(chalk.green(" Done!"), `${chalk.blue("codeId")} = ${counterCodeId}`);

    // // Step 2. Instantiate contracts

    // // FundsRouter
    // process.stdout.write("Instantiating FundsRouter contract");
    
    // const fundsRouterResult = await instantiateContract(
    //     terra,
    //     wallet1,
    //     wallet1,
    //     fundsRouterCodeId,
    //     {
    //         "registry": registryStake,
    //         "reg_user_fee_veri_forwarder": mainnet.contractConsts.reg_user_fee_veri_forwarder,
    //         // "router_user_veri_forwarder": mainnet.contractConsts.router_user_veri_forwarder,
    //         "fund_denom": mainnet.contractConsts.fundsRouterDenom,
    //     }
    //   );
    // fundsRouter = fundsRouterResult.logs[0].events
    //     .find((event) => {
    //         return event.type == "instantiate";
    //     })
    //     ?.attributes.find((attribute) => {
    //         return attribute.key == "_contract_address";
    //     })?.value as string;
    // console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${fundsRouter}`);

    // // TimeConditions
    // process.stdout.write("Instantiating TimeConditions contract");
    
    // const timeConditionsResult = await instantiateContract(
    //     terra,
    //     wallet1,
    //     wallet1,
    //     timeConditionsCodeId,
    //     {
    //         "router_user_veri_forwarder": mainnet.contractConsts.router_user_veri_forwarder,
    //     }
    //   );
    // timeConditions = timeConditionsResult.logs[0].events
    //     .find((event) => {
    //         return event.type == "instantiate";
    //     })
    //     ?.attributes.find((attribute) => {
    //         return attribute.key == "_contract_address";
    //     })?.value as string;
    // console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${timeConditions}`);
     
    // // counter
    // process.stdout.write("Instantiating counter contract");

    // const counterResult = await instantiateContract(
    //     terra,
    //     wallet1,
    //     wallet1,
    //     counterCodeId,
    //     {
    //         "count": 0,
    //     }
    // );
    // counter = counterResult.logs[0].events
    //     .find((event) => {
    //         return event.type == "instantiate";
    //     })
    //     ?.attributes.find((attribute) => {
    //         return attribute.key == "_contract_address";
    //     })?.value as string;
    // console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${counter}`);
}