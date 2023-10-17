import { LCDClient, MnemonicKey } from "@terra-money/terra.js";
import { MAIN_NETWORK, CHAINID, MNEMONIC } from "./constants";

export const getConnection = async () => {
  const client = new LCDClient({
    URL: MAIN_NETWORK || "",
    chainID: CHAINID || "pisco-1",
  });

  const wallet = client.wallet(
    new MnemonicKey({
      mnemonic: MNEMONIC || "",
    })
  );

  return { wallet, client };
};
