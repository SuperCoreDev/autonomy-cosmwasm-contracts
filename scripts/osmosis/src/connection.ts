import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import "./constants";

import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import {
  GASPRICE,
  MAIN_NETWORK,
  MNEMONIC,
  PREFIX,
  registry,
} from "./constants";
import { RegistryClient } from "./ts/registry/Registry.client";

export const getConnection = async () => {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(MNEMONIC, {
    prefix: PREFIX,
  });

  const client = await SigningCosmWasmClient.connectWithSigner(
    MAIN_NETWORK,
    wallet,
    GASPRICE.length ? { gasPrice: GasPrice.fromString(GASPRICE) } : undefined
  );

  return { wallet, client };
};

export const getRegistryClient = async () => {
  const { wallet, client } = await getConnection();
  const accounts = await wallet.getAccounts();
  return new RegistryClient(client, accounts[0].address, registry);
};
