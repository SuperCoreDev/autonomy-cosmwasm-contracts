/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from "chalk";
import { storeCode, instantiateContract } from "../../../utils/osmosis/helpers";
import { wasm_path } from "../../../config/wasmPaths";

import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";

// -------------------------------------------------------------------------------------
// Variables
// -------------------------------------------------------------------------------------

let client: SigningCosmWasmClient;
let wallet1: DirectSecp256k1HdWallet;
let wallet2: DirectSecp256k1HdWallet;
let wallet3: DirectSecp256k1HdWallet;

let tcw: string;
let tcwUcosmSwap: string;
let wrapperOsmosis: string;


// -------------------------------------------------------------------------------------
// setup all contracts for LocalOsmosis and TestNet
// -------------------------------------------------------------------------------------
export async function setupWrapperOsmosis(
    client: SigningCosmWasmClient,
    wallets: {
        wallet1: DirectSecp256k1HdWallet,
        wallet2: DirectSecp256k1HdWallet,
        wallet3: DirectSecp256k1HdWallet,
    }
): Promise<void> {
    client = client;
    wallet1 = wallets.wallet1;
    wallet2 = wallets.wallet2;
    wallet3 = wallets.wallet3;

    await setup(client, wallet1);

    console.log(chalk.green(" Done!"));
    process.exit();
}

async function setup(
    client: SigningCosmWasmClient,
    wallet1: DirectSecp256k1HdWallet,
): Promise<void> {
    // Step 1. Upload all local wasm files and capture the codes for each....

    process.stdout.write("Uploading CW20 Token Wasm");
    const cw20CodeId = await storeCode(
        client,
        wallet1,
        `${wasm_path.station}/cw20_base.wasm`
    );
    console.log(chalk.green(" Done!"), `${chalk.blue("codeId")} = ${cw20CodeId}`);

    process.stdout.write("Uploading wrapperOsmosis Wasm");
    const wrapperOsmosisCodeId = await storeCode(
        client,
        wallet1,
        `${wasm_path.station}/wrapper_osmosis.wasm`
    );
    console.log(chalk.green(" Done!"), `${chalk.blue("codeId")} = ${wrapperOsmosisCodeId}`);

    // Step 2. Instantiate contracts

    // wrapperOsmosis
    process.stdout.write("Instantiating wrapperOsmosis contract");

    const wrapperOsmosisResult = await instantiateContract(
        client,
        wallet1,
        wallet1,
        wrapperOsmosisCodeId,
        { }
      );
    wrapperOsmosis = wrapperOsmosisResult.contractAddress;
    console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${wrapperOsmosis}`);
}
