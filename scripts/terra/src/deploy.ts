import { LCDClient, Wallet } from "@terra-money/terra.js";
import { getConnection } from "./connection";

import "./constants";
import {
  auto,
  registryCodeId,
  STAN_STAKE,
  wrapperAstroportCodeId,
} from "./constants";
import { deployContract } from "./util";

async function deployRegistry(client: LCDClient, wallet: Wallet) {
  const initMsg = {
    config: {
      admin: wallet.key.accAddress,
      auto: {
        token: {
          contract_addr: auto,
        },
      },
      fee_amount: "100000",
      fee_denom: "uluna",
      stake_amount: STAN_STAKE.toString(),
      blocks_in_epoch: 100,
    },
  };
  const registry = await deployContract(
    client,
    wallet,
    registryCodeId,
    initMsg
  );
  console.log("Registry:", registry);
}

async function deployAstroWrapper(client: LCDClient, wallet: Wallet) {
  const initMsg = {};
  const wrapper = await deployContract(
    client,
    wallet,
    wrapperAstroportCodeId,
    initMsg
  );
  console.log("Wrapper astro:", wrapper);
}

async function main() {
  const { client, wallet } = await getConnection();

  console.log(`Deployer is ${wallet.key.accAddress}`);

  await deployRegistry(client, wallet);
  await deployAstroWrapper(client, wallet);
}

main().catch(console.error);
