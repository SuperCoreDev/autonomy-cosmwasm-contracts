/* eslint-disable @typescript-eslint/ban-types */
import { is } from "ramda";
import {
  Wallet,
  LCDClient,
  Tx,
  MsgInstantiateContract,
  Coins,
  isTxError,
  MsgMigrateContract,
  AccAddress,
  MsgStoreCode,
} from "@terra-money/terra.js";
import fs from "fs";

export const omitEmpty = (object: object): object =>
  Object.entries(object).reduce((acc, [key, value]) => {
    const next = is(Object, value) ? omitEmpty(value) : value;
    const valid = Number.isFinite(value) || value || value === false;
    return Object.assign({}, acc, valid && { [key]: next });
  }, {});

export const toBase64 = (object: object) => {
  try {
    return Buffer.from(JSON.stringify(omitEmpty(object))).toString("base64");
  } catch (error) {
    return "";
  }
};

export const fromBase64 = <T>(string: string): T => {
  try {
    return JSON.parse(Buffer.from(string, "base64").toString());
  } catch (error) {
    return {} as T;
  }
};

export async function sendMessage(client: LCDClient, tx: Tx) {
  const res = await client.tx.broadcast(tx);
  if (isTxError(res)) {
    throw new Error(`Sending Message failed with ${res.raw_log}`);
  }
  return res;
}

export async function storeCode(
  client: LCDClient,
  deployer: Wallet,
  path: string
) {
  const msgs = [
    new MsgStoreCode(
      deployer.key.accAddress,
      fs.readFileSync(path).toString("base64")
    ),
  ];

  const storeCodeTxResult = await sendMessage(
    client,
    await deployer.createAndSignTx({ msgs })
  );

  if (isTxError(storeCodeTxResult)) {
    throw new Error(
      `store code failed. code: ${storeCodeTxResult.code}, codespace: ${storeCodeTxResult.codespace}, raw_log: ${storeCodeTxResult.raw_log}`
    );
  }

  const {
    store_code: { code_id },
  } = storeCodeTxResult.logs[0].eventsByType;

  return code_id;
}

export async function deployContract(
  client: LCDClient,
  deployer: Wallet,
  codeId: number,
  init_msg: object | string,
  init_coins?: Coins.Input
) {
  const msgs = [
    new MsgInstantiateContract(
      deployer.key.accAddress,
      deployer.key.accAddress,
      codeId,
      init_msg,
      init_coins,
      "instantiate"
    ),
  ];

  const instantiateTxResult = await sendMessage(
    client,
    await deployer.createAndSignTx({ msgs })
  );

  const {
    instantiate: { _contract_address },
  } = instantiateTxResult.logs[0].eventsByType;

  return _contract_address[0];
}

export async function upgradeContract(
  client: LCDClient,
  wallet: Wallet,
  contract: AccAddress,
  codeId: number,
  msg: any
) {
  const msgs = [
    new MsgMigrateContract(wallet.key.accAddress, contract, codeId, msg),
  ];

  await sendMessage(client, await wallet.createAndSignTx({ msgs }));
}
