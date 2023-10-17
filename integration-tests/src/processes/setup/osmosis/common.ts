/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from "chalk";
import { storeCode, instantiateContract } from "../../../utils/osmosis/helpers";
import { wasm_path } from "../../../config/wasmPaths";

import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { coin, DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";

import { localosmosis } from '../../../config/localosmosisConstants';
import { GasPrice } from "@cosmjs/stargate";

// -------------------------------------------------------------------------------------
// Variables
// -------------------------------------------------------------------------------------

let client: SigningCosmWasmClient;
let wallet1: DirectSecp256k1HdWallet;
let wallet2: DirectSecp256k1HdWallet; // reg_user_fee_veri_forwarder
let wallet3: DirectSecp256k1HdWallet; // router_user_fee_veri_forwarder

let auto: string;
let stakeManager: string;
let registry: string;

// -------------------------------------------------------------------------------------
// setup all contracts for LocalOsmosis
// -------------------------------------------------------------------------------------
export async function setupCommon(
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

    // Send some tokens to wallets
    await client.sendTokens(localosmosis.addresses.wallet1, localosmosis.addresses.wallet2, [coin("100000000", "uion"), coin("100000000", "uosmo")], "auto");
    await client.sendTokens(localosmosis.addresses.wallet1, localosmosis.addresses.wallet3, [coin("100000000", "uion"), coin("100000000", "uosmo")], "auto");

    await setup(client, wallet1);

    // Wallet3 stake some AUTOs to become a executor
    let walle3_client = await SigningCosmWasmClient.connectWithSigner(
        localosmosis.networkInfo.url,
        wallet3,
        {gasPrice: GasPrice.fromString("0.1uosmo")},
    );

    await walle3_client.execute(localosmosis.addresses.wallet3, stakeManager, {
      stake_denom: {
        num_stakes: 1,
      },
    }, "auto", undefined, [coin("1000000", auto)]);

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

    process.stdout.write("Uploading StakeManager Wasm");
    const stakeManagerCodeId = await storeCode(
        client,
        wallet1,
        `${wasm_path.station}/stake_manager.wasm`
    );
    console.log(chalk.green(" Done!"), `${chalk.blue("codeId")} = ${stakeManagerCodeId}`);

    process.stdout.write("Uploading Registry Wasm");
    const registryCodeId = await storeCode(
        client,
        wallet1,
        `${wasm_path.station}/registry.wasm`
    );
    console.log(chalk.green(" Done!"), `${chalk.blue("codeId")} = ${registryCodeId}`);

    // Step 2. Instantiate contracts
    auto = "uosmo";

    // StakeManager
    process.stdout.write("Instantiating StakeManager contract");

    const stakeManagerResult = await instantiateContract(
        client,
        wallet1,
        wallet1,
        stakeManagerCodeId,
        {
            "auto": {
                native_token: {
                    denom: auto, // AUTO (Cw20) token address
                },
            }
        }
      );
    stakeManager = stakeManagerResult.contractAddress;
    console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${stakeManager}`);


    // registry
    process.stdout.write("Instantiating Registry contract");

    const registryResult = await instantiateContract(
        client,
        wallet1,
        wallet1,
        registryCodeId,
        {
            "stake_manager": stakeManager, // StakeManager address
            "fee_amount": "1000",
            "fee_denom": "uosmo",
        }
      );
    registry = registryResult.contractAddress;
    console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${registry}`);
}
