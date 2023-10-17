// -------------------------------------------------------------------------------------
// testnet test-suite
// -------------------------------------------------------------------------------------
import chalk from "chalk";
import { LCDClient, MnemonicKey, Wallet} from "@terra-money/terra.js";

import { testnet } from "../config/terraConstants";

import { setupCommon } from "../processes/setup/terra/testnet/common";
import { setupStation } from "../processes/setup/terra/testnet/station";
import { setupWrapperAstroport } from "../processes/setup/terra/testnet/wrapperAstroport";

import { testExecuteStation } from "../processes/tests/terra/testnet/station";
import { testExecuteWrapperAstroport } from "../processes/tests/terra/testnet/wrapperAstroport";


// -------------------------------------------------------------------------------------
// Variables
// -------------------------------------------------------------------------------------

let terra: LCDClient;
let wallet1: Wallet;
let wallet2: Wallet;   // reg_user_fee_veri_forwarder
let wallet3: Wallet;   // router_user_fee_veri_forwarder

// Autonomy common contracts
let auto: string;
let registryStake: string;

// Autonomy-Station test
let timeConditions: string;
let fundsRouter: string;
let counter: string;

// WrapperAstroport test
let tcw: string;
let tcwUlunaSwap: string;
let tcw_auto_swap: string;
let wrapperAstroport: string;


// -------------------------------------------------------------------------------------
// initialize autonomy-common variables
// -------------------------------------------------------------------------------------
function initializeCommon() {
    terra = new LCDClient({
        URL: testnet.networkInfo.url,
        chainID: testnet.networkInfo.chainId,
        gasPrices: { uluna: 0.15 },
        gasAdjustment: 1.2,
      });
    
    wallet1 = terra.wallet(new MnemonicKey({ mnemonic: testnet.mnemonicKeys.wallet1 }));
    wallet2 = terra.wallet(new MnemonicKey({ mnemonic: testnet.mnemonicKeys.wallet2 }));
    wallet3 = terra.wallet(new MnemonicKey({ mnemonic: testnet.mnemonicKeys.wallet3 }));

    console.log(`Use ${chalk.cyan(wallet1.key.accAddress)} as Wallet 1`);
    console.log(`Use ${chalk.cyan(wallet2.key.accAddress)} as Wallet 2`);
    console.log(`Use ${chalk.cyan(wallet3.key.accAddress)} as Wallet 3`);

}

// -------------------------------------------------------------------------------------
// initialize autonomy-station variables
// -------------------------------------------------------------------------------------
async function initializeStation() {
    // Initialize environment information
    console.log(chalk.yellow("\nStep 1. Environment Info"));
    initializeCommon();

    auto = testnet.contracts.auto;
    registryStake = testnet.contracts.registryStake;
    fundsRouter = testnet.contracts.fundsRouter;
    timeConditions = testnet.contracts.timeConditions;
    counter = testnet.contracts.testCounter;

    console.log(`Use ${chalk.cyan(auto)} as AUTO token`);
    console.log(`Use ${chalk.cyan(registryStake)} as RegistryStake`);
    console.log(`Use ${chalk.cyan(fundsRouter)} as FundsRouter`);
    console.log(`Use ${chalk.cyan(timeConditions)} as TimeConditions`);
    console.log(`Use ${chalk.cyan(counter)} as TestCounter`);
}

// -------------------------------------------------------------------------------------
// initialize WrapperAstroport variables
// -------------------------------------------------------------------------------------
async function initializeWrapperAstroport() {
    // Initialize environment information
    console.log(chalk.yellow("\nStep 1. Environment Info"));
    initializeCommon();
    
        
    auto = testnet.contracts.auto;
    registryStake = testnet.contracts.registryStake;
    tcw = testnet.contracts.tcw;
    tcwUlunaSwap = testnet.contracts.tcwUlunaSwap;
    tcw_auto_swap = testnet.contracts.tcwAutoSwap;

    wrapperAstroport = testnet.contracts.wrapperAstroport;

    console.log(`Use ${chalk.cyan(auto)} as AUTO token`);
    console.log(`Use ${chalk.cyan(registryStake)} as RegistryStake`);
    console.log(`Use ${chalk.cyan(tcw)} as TCW(Test CW20 token)`);
    console.log(`Use ${chalk.cyan(tcwUlunaSwap)} as "TCW-uluna" swap`);
    console.log(`Use ${chalk.cyan(tcw_auto_swap)} as "TCW-AUTO" swap`);
    console.log(`Use ${chalk.cyan(wrapperAstroport)} as WrapperAstroport`);
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
    await setupCommon(terra, { wallet1, wallet2, wallet3 });
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
    await setupStation(terra, { wallet1, wallet2, wallet3 }, auto, registryStake);
}


// -------------------------------------------------------------------------------------
// setup WrapperAstroport contracts
// -------------------------------------------------------------------------------------
export async function startSetupWrapperAstroport(): Promise<void> {
    console.log(chalk.blue("\nTestNet"));

    // Initialize environment information
    console.log(chalk.yellow("\nStep 1. Environment Info"));
    await initializeWrapperAstroport();

    // Setup contracts
    console.log(chalk.yellow("\nStep 2. WrapperAstroport Contracts Setup"));
    await setupWrapperAstroport(terra, { wallet1, wallet2, wallet3 });
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
        terra,
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
// start wrapper-astrport test
// -------------------------------------------------------------------------------------
export async function startTestsWraperAstroport(): Promise<void> {
    console.log(chalk.blue("\nTestNet"));
  
    // Initialize environment information
    console.log(chalk.yellow("\nStep 1. Environment Info"));
    await initializeWrapperAstroport();
  
    // Test queries
    await testExecuteWrapperAstroport(
        terra,
        wallet1,
        wallet2,
        wallet3,
        auto, 
        registryStake,
        tcw,
        tcwUlunaSwap,
        tcw_auto_swap,
        wrapperAstroport,
    );
}
