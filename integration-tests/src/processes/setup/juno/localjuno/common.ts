/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from "chalk";
import { storeCode, instantiateContract, toEncodedBinary } from "../../../../utils/juno/helpers";
import { wasm_path } from "../../../../config/wasmPaths";

import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { coin, DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";

import { localjuno } from '../../../../config/localjunoConstants';
import { GasPrice } from "@cosmjs/stargate";

// -------------------------------------------------------------------------------------
// Variables
// -------------------------------------------------------------------------------------

let junod: SigningCosmWasmClient;
let wallet1: DirectSecp256k1HdWallet;
let wallet2: DirectSecp256k1HdWallet; // reg_user_fee_veri_forwarder
let wallet3: DirectSecp256k1HdWallet; // router_user_fee_veri_forwarder

let auto: string;
let registryStake: string;

// -------------------------------------------------------------------------------------
// setup all contracts for LocalJuno
// -------------------------------------------------------------------------------------
export async function setupCommon(
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

    // Send some tokens to wallets
    let wallet2_amount = await junod.getBalance(localjuno.addresses.wallet2, "ucosm");
    if (wallet2_amount.amount == "0") { 
        await junod.sendTokens(localjuno.addresses.wallet1, localjuno.addresses.wallet2, [coin("100000000", "ucosm"), coin("100000000", "ujunox")], "auto");
    }
    let wallet3_amount = await junod.getBalance(localjuno.addresses.wallet3, "ucosm");
    if (wallet3_amount.amount == "0") { 
        await junod.sendTokens(localjuno.addresses.wallet1, localjuno.addresses.wallet3, [coin("100000000", "ucosm"), coin("100000000", "ujunox")], "auto");
    }
    await setup(junod, wallet1);

    // Wallet3 stake 1 STAN_STAKE(1000000) amount to become executor
    await stakeAUTO2RegistryStake(wallet3, localjuno.addresses.wallet3, registryStake, auto, 1);

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

    process.stdout.write("Uploading RegistryStake Wasm");
    const registryStakeCodeId = await storeCode(
        junod,
        wallet1, 
        `${wasm_path.station}/registry_stake.wasm`
    );
    console.log(chalk.green(" Done!"), `${chalk.blue("codeId")} = ${registryStakeCodeId}`);

    // Step 2. Instantiate contracts

    // AUTO token 
    process.stdout.write("Instantiating AUTO token contract");

    const autoTokenResult = await instantiateContract(
        junod,
        wallet1,
        wallet1,
        cw20CodeId,
        {
            "name": "Auto TOKEN",
            "symbol": "AUTO",
            "decimals": 6,
            "initial_balances": [
                {
                    "address": localjuno.addresses.wallet1,
                    "amount": "10000000000"
                },
                {
                    "address": localjuno.addresses.wallet2,
                    "amount": "10000000000"
                },
                {
                    "address": localjuno.addresses.wallet3,
                    "amount": "10000000000"
                }
            ]   
        }
        );
    auto = autoTokenResult.contractAddress;
    console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${auto}`);
    
    // registryStake
    process.stdout.write("Instantiating RegistryStake contract");

    const registryStakeResult = await instantiateContract(
        junod,
        wallet1,
        wallet1,
        registryStakeCodeId,
        {
            "auto": {
                "token": {
                    "contract_addr": auto, // AUTO token address
                }
            },
            "fee_amount": "1000000",
            "fee_denom": "ucosm",
        }
    );
    registryStake = registryStakeResult.contractAddress;
    console.log(chalk.green(" Done!"), `${chalk.blue("contractAddress")}=${registryStake}`);

}

async function stakeAUTO2RegistryStake(
    wallet: DirectSecp256k1HdWallet,
    walletAddress: string,
    registryStake: string,
    auto: string,
    numStakes: number,
): Promise<void> {
    let wallet_client = await SigningCosmWasmClient.connectWithSigner(
        localjuno.networkInfo.url,
        wallet,
        {gasPrice: GasPrice.fromString("0.1ujunox")},
    );

    await wallet_client.execute(walletAddress, auto, {
        increase_allowance: {
            spender: registryStake,
            amount: (numStakes * 1000000).toString(),
            expires: undefined,
          }
    }, "auto", undefined, []);

    await wallet_client.execute(walletAddress, auto, {
        send: {
            contract: registryStake,
            amount: (numStakes * 1000000).toString(),
            msg: toEncodedBinary({
                stake: {
                    num_stakes: numStakes,
                }
            })
        }
    }, "auto", undefined, []);
}