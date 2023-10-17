import {
  LCDClient,
  MnemonicKey,
  MsgGrantAllowance,
  BasicAllowance,
  Wallet,
  Tx,
  MsgExecuteContract,
  Coins,
  Fee,
} from "@terra-money/terra.js";

import "./constants";

function sendMessage(client: LCDClient, tx: Tx) {
  client.tx
    .broadcast(tx)
    .then(console.info)
    .catch((err) => {
      if (err.response) {
        console.error(err.response.data);
      } else {
        console.error(err.message);
      }
    });
}

function grant(granter: Wallet, grantee: string) {
  const msgs = [
    new MsgGrantAllowance(
      granter.key.accAddress,
      grantee,
      new BasicAllowance()
    ),
  ];

  return granter.createAndSignTx({ msgs });
}

function swap(wallet: Wallet, granter: string) {
  const msgs = [
    new MsgExecuteContract(
      wallet.key.accAddress,
      "terra1sgu6yca6yjk0a34l86u6ju4apjcd6refwuhgzv",
      {
        swap: {
          belief_price: "86.692674469007368877",
          max_spread: "0.05",
          offer_asset: {
            amount: "1000000",
            info: {
              native_token: {
                denom: "uluna",
              },
            },
          },
        },
      },
      new Coins({ uluna: "1000000" })
    ),
  ];
  const fee = new Fee(
    500000 /** gas_limit */,
    { uluna: "80000" } /** amount */,
    wallet.key.accAddress /** payer */,
    granter /** granter */
  );

  return wallet.createAndSignTx({ msgs, fee });
}

async function main() {
  const client = new LCDClient({
    URL: process.env.MAIN_NETWORK || "",
    chainID: process.env.CHAINID || "columbus-5",
  });

  const wallet = client.wallet(
    new MnemonicKey({
      mnemonic: process.env.MNEMONIC || "",
    })
  );

  const wallet1 = client.wallet(
    new MnemonicKey({
      mnemonic: process.env.MNEMONIC1 || "",
    })
  );

  console.log(wallet.key.accAddress);
  console.log(wallet1.key.accAddress);

  // sendMessage(client, await swap(wallet1, wallet.key.accAddress));
  sendMessage(client, await grant(wallet, wallet1.key.accAddress));
}

main().catch(console.error);
