// -------------------------------------------------------------------------------------
// LocalOsmosis test-suite
// -------------------------------------------------------------------------------------
import chalk from "chalk";
import { GasPrice } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";

import { localosmosis } from "../config/localosmosisConstants";

import { setupCommon } from "../processes/setup/osmosis/common";
import { setupStation } from "../processes/setup/osmosis/station";
import { setupWrapperOsmosis } from "../processes/setup/osmosis/wrapperOsmosis";

import { testExecuteStation } from "../processes/tests/osmosis/station";
import { testExecuteWrapperOsmosis } from "../processes/tests/osmosis/wrapperOsmosis";


// -------------------------------------------------------------------------------------
// Variables
// -------------------------------------------------------------------------------------

let client: SigningCosmWasmClient;
let wallet1: DirectSecp256k1HdWallet;
let wallet2: DirectSecp256k1HdWallet;   // reg_user_fee_veri_forwarder
let wallet3: DirectSecp256k1HdWallet;   // router_user_fee_veri_forwarder

// Autonomy common contracts
let auto: string;
let stakeManager: string;
let registry: string;

// Autonomy-Station test
let timeConditions: string;
let fundsRouter: string;
let counter: string;

// WrapperOsmosis test
let outDenom: string;
let poolId: number;
let wrapperOsmosis: string;


// -------------------------------------------------------------------------------------
// initialize autonomy-station variables
// -------------------------------------------------------------------------------------
async function initializeCommon() {
    wallet1 = await DirectSecp256k1HdWallet.fromMnemonic(localosmosis.mnemonicKeys.wallet1, { prefix: "osmo" });
    wallet2 = await DirectSecp256k1HdWallet.fromMnemonic(localosmosis.mnemonicKeys.wallet2, { prefix: "osmo" });
    wallet3 = await DirectSecp256k1HdWallet.fromMnemonic(localosmosis.mnemonicKeys.wallet3, { prefix: "osmo" });

    client = await SigningCosmWasmClient.connectWithSigner(localosmosis.networkInfo.url, wallet1, { gasPrice: GasPrice.fromString("0.1uosmo")});

    const [account1] = await wallet1.getAccounts();
    const [account2] = await wallet2.getAccounts();
    const [account3] = await wallet3.getAccounts();

    console.log(`Use ${chalk.cyan(account1.address)} as Wallet 1`);
    console.log(`Use ${chalk.cyan(account2.address)} as Wallet 2`);
    console.log(`Use ${chalk.cyan(account3.address)} as Wallet 3`);
}


// -------------------------------------------------------------------------------------
// initialize autonomy-station variables
// -------------------------------------------------------------------------------------
async function initializeStation() {
    wallet1 = await DirectSecp256k1HdWallet.fromMnemonic(localosmosis.mnemonicKeys.wallet1, { prefix: "osmo" });
    wallet2 = await DirectSecp256k1HdWallet.fromMnemonic(localosmosis.mnemonicKeys.wallet2, { prefix: "osmo" });
    wallet3 = await DirectSecp256k1HdWallet.fromMnemonic(localosmosis.mnemonicKeys.wallet3, { prefix: "osmo" });

    client = await SigningCosmWasmClient.connectWithSigner(localosmosis.networkInfo.url, wallet1, { gasPrice: GasPrice.fromString("0.1uosmo")});

    const [account1] = await wallet1.getAccounts();
    const [account2] = await wallet2.getAccounts();
    const [account3] = await wallet3.getAccounts();

    console.log(`Use ${chalk.cyan(account1.address)} as Wallet 1`);
    console.log(`Use ${chalk.cyan(account2.address)} as Wallet 2`);
    console.log(`Use ${chalk.cyan(account3.address)} as Wallet 3`);

    auto = localosmosis.contracts.auto;
    stakeManager = localosmosis.contracts.stakeManager;
    registry = localosmosis.contracts.registry;
    fundsRouter = localosmosis.contracts.fundsRouter;
    timeConditions = localosmosis.contracts.timeConditions;
    counter = localosmosis.contracts.testCounter;

    console.log(`Use ${chalk.cyan(auto)} as AUTO token`);
    console.log(`Use ${chalk.cyan(stakeManager)} as StakeManager`);
    console.log(`Use ${chalk.cyan(registry)} as Registry`);
    console.log(`Use ${chalk.cyan(fundsRouter)} as FundsRouter`);
    console.log(`Use ${chalk.cyan(timeConditions)} as TimeConditions`);
    console.log(`Use ${chalk.cyan(counter)} as Counter`);
}

// -------------------------------------------------------------------------------------
// initialize WrapperOsmosis variables
// -------------------------------------------------------------------------------------
async function initializeWrapperOsmosis() {
    wallet1 = await DirectSecp256k1HdWallet.fromMnemonic(localosmosis.mnemonicKeys.wallet1, { prefix: "osmo" });
    wallet2 = await DirectSecp256k1HdWallet.fromMnemonic(localosmosis.mnemonicKeys.wallet2, { prefix: "osmo" });
    wallet3 = await DirectSecp256k1HdWallet.fromMnemonic(localosmosis.mnemonicKeys.wallet3, { prefix: "osmo" });

    client = await SigningCosmWasmClient.connectWithSigner(localosmosis.networkInfo.url, wallet1, { gasPrice: GasPrice.fromString("0.1uosmo")});

    const [account1] = await wallet1.getAccounts();
    const [account2] = await wallet2.getAccounts();
    const [account3] = await wallet3.getAccounts();

    console.log(`Use ${chalk.cyan(account1.address)} as Wallet 1`);
    console.log(`Use ${chalk.cyan(account2.address)} as Wallet 2`);
    console.log(`Use ${chalk.cyan(account3.address)} as Wallet 3`);

    auto = localosmosis.contracts.auto;
    stakeManager = localosmosis.contracts.stakeManager;
    registry = localosmosis.contracts.registry;
    wrapperOsmosis = localosmosis.contracts.wrapperOsmosis;
    poolId = localosmosis.poolInfo.poolId;
    outDenom = localosmosis.poolInfo.denom;

    console.log(`Use ${chalk.cyan(auto)} as AUTO token`);
    console.log(`Use ${chalk.cyan(stakeManager)} as StakeManager`);
    console.log(`Use ${chalk.cyan(registry)} as Registry`);
    console.log(`Use ${chalk.cyan(wrapperOsmosis)} as WrapperOsmosis`);
    console.log(`Use ${chalk.cyan(poolId)} as PoolId`);
    console.log(`Use ${chalk.cyan(outDenom)} as Out Denom`);
}


// -------------------------------------------------------------------------------------
// setup autonomy common contracts
// -------------------------------------------------------------------------------------
export async function startSetupCommon(): Promise<void> {
    console.log(chalk.blue("\nTestNet"));

    // Initialize environment information
    console.log(chalk.yellow("\nStep 1. Environment Info"));
    await initializeCommon();

    // Setup contracts
    console.log(chalk.yellow("\nStep 2. Common Contracts Setup"));
    await setupCommon(client, { wallet1, wallet2, wallet3 });
}


// -------------------------------------------------------------------------------------
// setup autonomy-station contracts
// -------------------------------------------------------------------------------------
export async function startSetupStation(): Promise<void> {
    console.log(chalk.blue("\nTestNet"));

    // Initialize environment information
    console.log(chalk.yellow("\nStep 1. Environment Info"));
    await initializeStation();

    // Setup contracts
    console.log(chalk.yellow("\nStep 2. Station Contracts Setup"));
    await setupStation(client, { wallet1, wallet2, wallet3 }, auto, stakeManager, localosmosis.contracts.registry);
}


// -------------------------------------------------------------------------------------
// setup WrapperOsmosis contracts
// -------------------------------------------------------------------------------------
export async function startSetupWrapperOsmosis(): Promise<void> {
    console.log(chalk.blue("\nTestNet"));

    // Initialize environment information
    console.log(chalk.yellow("\nStep 1. Environment Info"));
    await initializeWrapperOsmosis();

    // Setup contracts
    console.log(chalk.yellow("\nStep 2. WrapperOsmosis Contracts Setup"));
    await setupWrapperOsmosis(client, { wallet1, wallet2, wallet3 });
}


// -------------------------------------------------------------------------------------
// start autonomy-station test
// -------------------------------------------------------------------------------------
export async function startTestsStation(): Promise<void> {
    console.log(chalk.blue("\nTestNet"));

    // Initialize environment information
    console.log(chalk.yellow("\nStep 1. Environment Info"));
    await initializeStation();

    // Test queries
    await testExecuteStation(
        client,
        wallet1,
        wallet2,
        wallet3,
        auto,
        stakeManager,
        registry,
        fundsRouter,
        timeConditions,
        counter,
    );
}

// -------------------------------------------------------------------------------------
// start wrapper-osmosis test
// -------------------------------------------------------------------------------------
export async function startTestsWrapperOsmosis(): Promise<void> {
    console.log(chalk.blue("\nTestNet"));

    // Initialize environment information
    console.log(chalk.yellow("\nStep 1. Environment Info"));
    await initializeWrapperOsmosis();

    // Test queries
    await testExecuteWrapperOsmosis(
        client,
        wallet1,
        wallet2,
        wallet3,
        auto,
        stakeManager,
        registry,
        poolId,
        outDenom,
        wrapperOsmosis,
    );
}
