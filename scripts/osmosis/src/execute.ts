import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { Coin, coin, DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import "./constants";
import {
  STAN_STAKE,
  wrapper,
  registry,
  auto_denom,
  GASPRICE,
  MAIN_NETWORK,
} from "./constants";
import { RegistryClient } from "./ts/registry/Registry.client";
import { toBase64 } from "./util";

async function stakeAuto(
  client: SigningCosmWasmClient,
  wallet: DirectSecp256k1HdWallet,
  numStakes: number
) {
  const [account] = await wallet.getAccounts();
  const amount = STAN_STAKE * numStakes;
  const result = await client.execute(
    account.address,
    registry,
    {
      stake_denom: {
        num_stakes: numStakes,
      },
    },
    "auto",
    undefined,
    [coin(amount, auto_denom)]
  );
  return result;
}

async function unstakeAuto(
  client: SigningCosmWasmClient,
  wallet: DirectSecp256k1HdWallet,
  idxs: number[]
) {
  const [account] = await wallet.getAccounts();
  await client.execute(
    account.address,
    registry,
    {
      unstake: {
        idxs: idxs,
      },
    },
    "auto"
  );
}

async function updateExecutor(
  client: SigningCosmWasmClient,
  wallet: DirectSecp256k1HdWallet
) {
  const [account] = await wallet.getAccounts();
  await client.execute(
    account.address,
    registry,
    {
      update_executor: {},
    },
    "auto"
  );
}

async function createSwapRequest(client: RegistryClient) {
  const swap = {
    user: "osmo1phaxpevm5wecex2jyaqty2a4v02qj7qmlmzk5a",
    amount: "10000000",
    min_output: "1",
    max_output: "18446744073709551615",
    first: {
      pool_id: "1",
      denom_in: "uosmo",
      denom_out:
        "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2",
    },
    route: [],
  };

  await client.createRequest(
    {
      requestInfo: {
        target:
          "osmo1dwpdh2clk7c8csf9ql2xj36336xsryyg4j7622jhaert9htp48gsh8u9ve",
        msg: toBase64(swap),
        input_asset: {
          info: {
            native_token: {
              denom: "uosmo",
            },
          },
          amount: "10000000",
        },
        is_recurring: false,
      },
    },
    "auto",
    undefined,
    [coin("11000000", "uosmo")]
  );
}

async function createEmptyRequest(client: RegistryClient) {
  const asset_info = {
    native_token: {
      denom: "uosmo",
    },
  };

  const msg = {
    check_range: {
      user: "osmo1phaxpevm5wecex2jyaqty2a4v02qj7qmlmzk5a",
      asset: asset_info,
      balance_before: "0",
      min_output: "0",
      max_output: "0",
    },
  };

  await client.createRequest(
    {
      requestInfo: {
        target: wrapper,
        msg: toBase64(msg),
        is_recurring: false,
      },
    },
    "auto",
    undefined,
    [coin("1000000", "uosmo")]
  );
}

async function main() {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
    process.env.MNEMONIC || "",
    { prefix: "osmo" }
  );
  const client = await SigningCosmWasmClient.connectWithSigner(
    MAIN_NETWORK,
    wallet,
    GASPRICE.length ? { gasPrice: GasPrice.fromString(GASPRICE) } : undefined
  );

  const result = await stakeAuto(client, wallet, 1);
  console.log(result);

  // await createEmptyRequest(client);
}

main().catch(console.error);
