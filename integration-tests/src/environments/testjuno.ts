// -------------------------------------------------------------------------------------
// Juno testnet test-suite
// -------------------------------------------------------------------------------------
import chalk from "chalk";
import { GasPrice } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";

import { testnet } from "../config/junoConstants";

import { setupCommon } from "../processes/setup/juno/testnet/common";
import { setupStation } from "../processes/setup/juno/testnet/station";
import { setupWrapperJunoswap } from "../processes/setup/juno/testnet/wrapperJunoswap";

import { testExecuteStation } from "../processes/tests/juno/testnet/station";
import { testExecuteWrapperJunoswap } from "../processes/tests/juno/testnet/wrapperJunoswap";


// -------------------------------------------------------------------------------------
// Variables
// -------------------------------------------------------------------------------------

let junod: SigningCosmWasmClient;
let wallet1: DirectSecp256k1HdWallet;
let wallet2: DirectSecp256k1HdWallet;   // reg_user_fee_veri_forwarder
let wallet3: DirectSecp256k1HdWallet;   // router_user_fee_veri_forwarder

// Autonomy common contracts
let auto: string;
let registryStake: string;

// Autonomy-Station test
let timeConditions: string;
let fundsRouter: string;
let counter: string;

// WrapperJunoswap test
let tcw: string;
let tcwUjunoSwap: string;
let wrapperJunoswap: string;


// -------------------------------------------------------------------------------------
// initialize autonomy-station variables
// -------------------------------------------------------------------------------------
async function initializeCommon() {
    wallet1 = await DirectSecp256k1HdWallet.fromMnemonic(testnet.mnemonicKeys.wallet1, { prefix: "juno" });
    wallet2 = await DirectSecp256k1HdWallet.fromMnemonic(testnet.mnemonicKeys.wallet2, { prefix: "juno" });
    wallet3 = await DirectSecp256k1HdWallet.fromMnemonic(testnet.mnemonicKeys.wallet3, { prefix: "juno" });

    junod = await SigningCosmWasmClient.connectWithSigner(testnet.networkInfo.url, wallet1, { gasPrice: GasPrice.fromString("0.025ujunox")});

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
    wallet1 = await DirectSecp256k1HdWallet.fromMnemonic(testnet.mnemonicKeys.wallet1, { prefix: "juno" });
    wallet2 = await DirectSecp256k1HdWallet.fromMnemonic(testnet.mnemonicKeys.wallet2, { prefix: "juno" });
    wallet3 = await DirectSecp256k1HdWallet.fromMnemonic(testnet.mnemonicKeys.wallet3, { prefix: "juno" });

    junod = await SigningCosmWasmClient.connectWithSigner(testnet.networkInfo.url, wallet2, { gasPrice: GasPrice.fromString("0.025ujunox")});

    const [account1] = await wallet1.getAccounts();
    const [account2] = await wallet2.getAccounts();
    const [account3] = await wallet3.getAccounts();

    console.log(`Use ${chalk.cyan(account1.address)} as Wallet 1`);
    console.log(`Use ${chalk.cyan(account2.address)} as Wallet 2`);
    console.log(`Use ${chalk.cyan(account3.address)} as Wallet 3`);

    auto = testnet.contracts.auto;
    registryStake = testnet.contracts.registryStake;
    fundsRouter = testnet.contracts.fundsRouter;
    timeConditions = testnet.contracts.timeConditions;
    counter = testnet.contracts.testCounter;

    console.log(`Use ${chalk.cyan(auto)} as AUTO token`);
    console.log(`Use ${chalk.cyan(registryStake)} as RegistryStake`);
    console.log(`Use ${chalk.cyan(fundsRouter)} as FundsRouter`);
    console.log(`Use ${chalk.cyan(timeConditions)} as TimeConditions`);
    console.log(`Use ${chalk.cyan(counter)} as Counter`);
}

// -------------------------------------------------------------------------------------
// initialize WrapperJunoswap variables
// -------------------------------------------------------------------------------------
async function initializeWrapperJunoSwap() {
    wallet1 = await DirectSecp256k1HdWallet.fromMnemonic(testnet.mnemonicKeys.wallet1, { prefix: "juno" });
    wallet2 = await DirectSecp256k1HdWallet.fromMnemonic(testnet.mnemonicKeys.wallet2, { prefix: "juno" });
    wallet3 = await DirectSecp256k1HdWallet.fromMnemonic(testnet.mnemonicKeys.wallet3, { prefix: "juno" });

    junod = await SigningCosmWasmClient.connectWithSigner(testnet.networkInfo.url, wallet1, { gasPrice: GasPrice.fromString("0.025ujunox")});

    const [account1] = await wallet1.getAccounts();
    const [account2] = await wallet2.getAccounts();
    const [account3] = await wallet3.getAccounts();

    console.log(`Use ${chalk.cyan(account1.address)} as Wallet 1`);
    console.log(`Use ${chalk.cyan(account2.address)} as Wallet 2`);
    console.log(`Use ${chalk.cyan(account3.address)} as Wallet 3`);

    auto = testnet.contracts.auto;
    registryStake = testnet.contracts.registryStake;
    tcw = testnet.contracts.tcw;
    tcwUjunoSwap = testnet.contracts.tcwUjunoSwap;
    wrapperJunoswap = testnet.contracts.wrapperJunoSwap;

    console.log(`Use ${chalk.cyan(auto)} as AUTO token`);
    console.log(`Use ${chalk.cyan(registryStake)} as RegistryStake`);
    console.log(`Use ${chalk.cyan(tcw)} as TCW(Test CW20 token)`);
    console.log(`Use ${chalk.cyan(tcwUjunoSwap)} as "TCW-juno" swap`);
    console.log(`Use ${chalk.cyan(wrapperJunoswap)} as WrapperJunoswap`);
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
    await setupCommon(junod, { wallet1, wallet2, wallet3 });
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
    await setupStation(junod, { wallet1, wallet2, wallet3 }, auto, registryStake);
}


// -------------------------------------------------------------------------------------
// setup WrapperJunoswap contracts
// -------------------------------------------------------------------------------------
export async function startSetupWrapperJunoswap(): Promise<void> {
    console.log(chalk.blue("\nTestNet"));

    // Initialize environment information
    console.log(chalk.yellow("\nStep 1. Environment Info"));
    await initializeWrapperJunoSwap();

    // Setup contracts
    console.log(chalk.yellow("\nStep 2. WrapperJunoswap Contracts Setup"));
    await setupWrapperJunoswap(junod, { wallet1, wallet2, wallet3 });
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
        junod,
        wallet1,
        wallet2,
        wallet3,
        auto,
        registryStake,
        fundsRouter,
        timeConditions,
        counter,
    );
}

// -------------------------------------------------------------------------------------
// start wrapper-junoswap test
// -------------------------------------------------------------------------------------
export async function startTestsWraperJunoswap(): Promise<void> {
    console.log(chalk.blue("\nTestNet"));
  
    // Initialize environment information
    console.log(chalk.yellow("\nStep 1. Environment Info"));
    await initializeWrapperJunoSwap();
  
    // Test
    await testExecuteWrapperJunoswap(
        junod,
        wallet1,
        wallet2,
        wallet3,
        auto, 
        registryStake,
        tcw,
        tcwUjunoSwap,
        wrapperJunoswap,
    );
}
