/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from "chalk";
import { storeCode, instantiateContract } from "../../../../utils/juno/helpers";
import { wasm_path } from "../../../../config/wasmPaths";

import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";

import { testnet } from '../../../../config/junoConstants';

// -------------------------------------------------------------------------------------
// Variables
// -------------------------------------------------------------------------------------

let junod: SigningCosmWasmClient;
let wallet1: DirectSecp256k1HdWallet;
let wallet2: DirectSecp256k1HdWallet; // reg_user_fee_veri_forwarder
let wallet3: DirectSecp256k1HdWallet; // router_user_fee_veri_forwarder

let timeConditions: string;
let fundsRouter: string;
let counter: string;


// -------------------------------------------------------------------------------------
// setup all contracts for LocalJuno and TestNet
// -------------------------------------------------------------------------------------
export async function setupStation(
    junod: SigningCosmWasmClient,
    wallets: {
        wallet1: DirectSecp256k1HdWallet,
        wallet2: DirectSecp256k1HdWallet,
        wallet3: DirectSecp256k1HdWallet,
    },
    auto: string,
    registryStake: string,
): Promise<void> {
    junod = junod;
    wallet1 = wallets.wallet1;
    wallet2 = wallets.wallet2;
    wallet3 = wallets.wallet3;

    await setup(junod, wallet2, registryStake);

    console.log(chalk.green(" Done!"));
    process.exit();
}

async function setup(
    junod: SigningCosmWasmClient,
    wallet: DirectSecp256k1HdWallet,
    registry: string,
): Promise<void> {
    // Step 1. Upload all local wasm files and capture the codes for each....

    process.stdout.write("Uploading FundsRouter Wasm");
    const fundsRouterCodeId = await storeCode(
        junod, 
        wallet,
        `${wasm_path.station}/funds_router.wasm`
    );

    console.log(chalk.green(" Done!"), `${chalk.blue("codeId")}=${fundsRouterCodeId}`);

    process.stdout.write("Uploading TimeConditions Wasm");
    const timeConditionsCodeId = await storeCode(
        junod, 
        wallet,
        `${wasm_path.station}/time_conditions.wasm`
    );

    console.log(chalk.green(" Done!"), `${chalk.blue("codeId")}=${timeConditionsCodeId}`);

    process.stdout.write("Uploading (Test)Counter Wasm");
    const counterCodeId = await storeCode(
        junod,
        wallet, 
        `${wasm_path.station}/counter.wasm`
    );
    console.log(chalk.green(" Done!"), `${chalk.blue("codeId")} = ${counterCodeId}`);

    // Step 2. Instantiate contracts

    // FundsRouter
    process.stdout.write("Instantiating FundsRouter contract");
    
    const fundsRouterResult = await instantiateContract(
        junod,
        wallet,
        wallet,
        fundsRouterCodeId,
        {
            "registry": registry,
            "reg_user_fee_veri_forwarder": testnet.addresses.wallet2,
            "fund_denom": "ujunox",
        }
      );
    fundsRouter = fundsRouterResult.contractAddress
    console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${fundsRouter}`);

    // TimeConditions
    process.stdout.write("Instantiating TimeConditions contract");
    
    const timeConditionsResult = await instantiateContract(
        junod,
        wallet,
        wallet,
        timeConditionsCodeId,
        {
            "router_user_veri_forwarder": testnet.addresses.wallet3,
        }
      );
    timeConditions = timeConditionsResult.contractAddress;
    console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${timeConditions}`);
     
    // counter
    process.stdout.write("Instantiating counter contract");

    const counterResult = await instantiateContract(
        junod,
        wallet,
        wallet,
        counterCodeId,
        {
            "count": 0,
        }
    );
    counter = counterResult.contractAddress;
    console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${counter}`);
}