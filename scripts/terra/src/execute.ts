import {
  Coin,
  LCDClient,
  MsgExecuteContract,
  Wallet,
} from "@terra-money/terra.js";
import { getConnection } from "./connection";

import "./constants";
import { auto, registry, STAN_STAKE, wrapperAstroport } from "./constants";
import { sendMessage, toBase64 } from "./util";

async function stakeAuto(client: LCDClient, wallet: Wallet, numStakes: number) {
  const msgs = [
    new MsgExecuteContract(wallet.key.accAddress, auto, {
      send: {
        amount: (STAN_STAKE * numStakes).toString(),
        contract: registry,
        msg: toBase64({
          stake: {
            num_stakes: numStakes,
          },
        }),
      },
    }),
  ];
  await sendMessage(client, await wallet.createAndSignTx({ msgs }));
}

async function stakeDenom(
  client: LCDClient,
  wallet: Wallet,
  numStakes: number
) {
  const msgs = [
    new MsgExecuteContract(
      wallet.key.accAddress,
      registry,
      {
        stake_denom: {
          num_stakes: numStakes,
        },
      },
      [new Coin("uluna", STAN_STAKE * numStakes)]
    ),
  ];
  await sendMessage(client, await wallet.createAndSignTx({ msgs }));
}

async function unstakeAuto(client: LCDClient, wallet: Wallet, idxs: number[]) {
  const msgs = [
    new MsgExecuteContract(wallet.key.accAddress, registry, {
      unstake: {
        idxs,
      },
    }),
  ];
  await sendMessage(client, await wallet.createAndSignTx({ msgs }));
}

async function updateExecutor(client: LCDClient, wallet: Wallet) {
  const msgs = [
    new MsgExecuteContract(wallet.key.accAddress, registry, {
      update_executor: {},
    }),
  ];
  await sendMessage(client, await wallet.createAndSignTx({ msgs }));
}

async function swapAstroport(client: LCDClient, wallet: Wallet) {
  const input_asset = {
    amount: "100000000",
    info: {
      token: {
        contract_addr:
          "terra167dsqkh2alurx997wmycw9ydkyu54gyswe3ygmrs4lwume3vmwks8ruqnv",
      },
    },
  };

  const swapMsg = {
    swap: { max_spread: "0.005", belief_price: "475.088722818986445718" },
  };

  const msg = {
    swap: {
      user: wallet.key.accAddress,
      contract_addr:
        "terra1udsua9w6jljwxwgwsegvt6v657rg3ayfvemupnes7lrggd28s0wq7g8azm",
      swap_msg: toBase64(swapMsg),
      offer_asset: input_asset,
      output_asset: {
        native_token: {
          denom: "uluna",
        },
      },
      min_output: "1",
      max_output: "100000000",
      recipient_exist: false,
    },
  };

  const msgs = [
    new MsgExecuteContract(wallet.key.accAddress, wrapperAstroport, msg),
  ];
  await sendMessage(client, await wallet.createAndSignTx({ msgs }));
}

async function approve(client: LCDClient, wallet: Wallet) {
  const msgs = [
    new MsgExecuteContract(
      wallet.key.accAddress,
      "terra167dsqkh2alurx997wmycw9ydkyu54gyswe3ygmrs4lwume3vmwks8ruqnv",
      {
        increase_allowance: {
          spender: registry,
          amount: "100000000000",
        },
      }
    ),
  ];
  await sendMessage(client, await wallet.createAndSignTx({ msgs }));
}

async function cancelRequest(
  client: LCDClient,
  wallet: Wallet,
  requestId: number
) {
  const msgs = [
    new MsgExecuteContract(wallet.key.accAddress, registry, {
      cancel_request: {
        id: requestId,
      },
    }),
  ];
  await sendMessage(client, await wallet.createAndSignTx({ msgs }));
}

async function createRequest(client: LCDClient, wallet: Wallet) {
  const input_asset = {
    amount: "100000000",
    info: {
      token: {
        contract_addr:
          "terra167dsqkh2alurx997wmycw9ydkyu54gyswe3ygmrs4lwume3vmwks8ruqnv",
      },
    },
  };

  const swapMsg = {
    swap: { max_spread: "0.005", belief_price: "475.088722818986445718" },
  };

  const msg = {
    swap: {
      user: wallet.key.accAddress,
      contract_addr:
        "terra1udsua9w6jljwxwgwsegvt6v657rg3ayfvemupnes7lrggd28s0wq7g8azm",
      swap_msg: toBase64(swapMsg),
      offer_asset: input_asset,
      output_asset: {
        native_token: {
          denom: "uluna",
        },
      },
      min_output: "1",
      max_output: "100000000",
      recipient_exist: false,
    },
  };

  const msgs = [
    new MsgExecuteContract(
      wallet.key.accAddress,
      registry,
      {
        create_request: {
          target: wrapperAstroport,
          msg: toBase64(msg),
          input_asset,
        },
      },
      [new Coin("uluna", "10000")]
    ),
  ];
  await sendMessage(client, await wallet.createAndSignTx({ msgs }));
}

async function updateConfig(client: LCDClient, wallet: Wallet, config: any) {
  const msgs = [
    new MsgExecuteContract(wallet.key.accAddress, registry, {
      update_config: {
        config,
      },
    }),
  ];
  await sendMessage(client, await wallet.createAndSignTx({ msgs }));
}

async function createEmptyRequest(client: LCDClient, wallet: Wallet) {
  const asset_info = {
    native_token: {
      denom: "uluna",
    },
  };

  const msg = {
    check_range: {
      user: wallet.key.accAddress,
      asset: asset_info,
      balance_before: "0",
      min_output: "0",
      max_output: "0",
    },
  };

  const msgs = [
    new MsgExecuteContract(
      wallet.key.accAddress,
      registry,
      {
        create_request: {
          request_info: {
            target: wrapperAstroport,
            msg: toBase64(msg),
            is_recurring: false,
          },
        },
      },
      [new Coin("uluna", "100000")]
    ),
  ];
  await sendMessage(client, await wallet.createAndSignTx({ msgs }));
}

async function main() {
  const { client, wallet } = await getConnection();

  console.log(`Wallet is ${wallet.key.accAddress}`);

  // await stakeDenom(client, wallet, 10);
  await createEmptyRequest(client, wallet);
}

main().catch(console.error);
