/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from "chalk";
import { storeCode, instantiateContract } from "../../../../utils/juno/helpers";
import { wasm_path } from "../../../../config/wasmPaths";

import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { coin, DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";

import { localjuno } from '../../../../config/localjunoConstants';

// -------------------------------------------------------------------------------------
// Variables
// -------------------------------------------------------------------------------------

let junod: SigningCosmWasmClient;
let wallet1: DirectSecp256k1HdWallet;
let wallet2: DirectSecp256k1HdWallet; 
let wallet3: DirectSecp256k1HdWallet;

let tcw: string;
let tcwUcosmSwap: string;
let wrapperJunoswap: string;


// -------------------------------------------------------------------------------------
// setup all contracts for LocalJuno and TestNet
// -------------------------------------------------------------------------------------
export async function setupWrapperJunoswap(
    junod: SigningCosmWasmClient,
    wallets: {
        wallet1: DirectSecp256k1HdWallet,
        wallet2: DirectSecp256k1HdWallet,
        wallet3: DirectSecp256k1HdWallet,
    }
): Promise<void> {
    junod = junod;
    wallet1 = wallets.wallet1;
    wallet2 = wallets.wallet2;
    wallet3 = wallets.wallet3;
    
    await setup(junod, wallet1);

    console.log(chalk.green(" Done!"));
    process.exit();
}

async function setup(
    junod: SigningCosmWasmClient,
    wallet1: DirectSecp256k1HdWallet,
): Promise<void> {
    // Step 1. Upload all local wasm files and capture the codes for each....
    
    process.stdout.write("Uploading CW20 Token Wasm");
    const cw20CodeId = await storeCode(
        junod,
        wallet1, 
        `${wasm_path.station}/cw20_base.wasm`
    );
    console.log(chalk.green(" Done!"), `${chalk.blue("codeId")} = ${cw20CodeId}`);

    process.stdout.write("Uploading WasmSwap Wasm");
    const wasmswapCodeId = await storeCode(
        junod,
        wallet1, 
        `${wasm_path.station}/wasmswap.wasm`
    );
    console.log(chalk.green(" Done!"), `${chalk.blue("codeId")} = ${wasmswapCodeId}`);

    process.stdout.write("Uploading WrapperJunoswap Wasm");
    const wrapperJunoswapCodeId = await storeCode(
        junod,
        wallet1, 
        `${wasm_path.station}/wrapper_junoswap.wasm`
    );
    console.log(chalk.green(" Done!"), `${chalk.blue("codeId")} = ${wrapperJunoswapCodeId}`);

    // Step 2. Instantiate contracts

    // TCW token 
    process.stdout.write("Instantiating TCW token contract");

    const tcwTokenResult = await instantiateContract(
        junod,
        wallet1,
        wallet1,
        cw20CodeId,
        {
            "name": "Test Cw20 TOKEN",
            "symbol": "TCW",
            "decimals": 6,
            "initial_balances": [
                {
                    "address": localjuno.addresses.wallet1,
                    "amount": "10000000000"
                }
            ]   
        }
        );
    tcw = tcwTokenResult.contractAddress;
    console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${tcw}`);
    

    // tcwUcosmSwap
    process.stdout.write("Instantiating TcwUcosmSwap contract");
    
    const tcwUcosmSwapResult = await instantiateContract(
        junod,
        wallet1,
        wallet1,
        wasmswapCodeId,
        {
            "token1_denom": {"native": "ucosm"},
            "token2_denom": {"cw20": tcw },
            "lp_token_code_id": cw20CodeId,
        }
      );
    tcwUcosmSwap = tcwUcosmSwapResult.contractAddress;
    console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${tcwUcosmSwap}`);


    // WrapperJunoswap
    process.stdout.write("Instantiating WrapperJunoswap contract");
    
    const wrapperJunoswapResult = await instantiateContract(
        junod,
        wallet1,
        wallet1,
        wrapperJunoswapCodeId,
        { }
      );
    wrapperJunoswap = wrapperJunoswapResult.contractAddress;
    console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${wrapperJunoswap}`);
}