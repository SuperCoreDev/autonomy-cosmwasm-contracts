import {
  coins, GasPrice,
} from "@cosmjs/stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";



async function main() {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
    process.env.MNEMONIC || '', {
      prefix: 'osmo',
    }
  );
  
  const [{ address }] = await wallet.getAccounts();
  console.log("Address:", address);
  
  
  // Ensure the address has some tokens to spend
  
  const lcdApi = "https://osmosis-testnet-rpc.allthatnode.com:26657";
  // const client = new SigningCosmWasmClient('osmo', lcdApi, address, wallet);
  const client = await SigningCosmWasmClient.connectWithSigner(
    lcdApi,
    wallet,
    { gasPrice: GasPrice.fromString('0.025uosmo') }
  );
  
  // check our balance
  const account = await client.getAccount(address);
  console.log("Account:", account);
  
  // Send tokens
  const recipient = process.env.TO || '';
  await client.sendTokens(address, recipient, coins(10, "factory/osmo1phaxpevm5wecex2jyaqty2a4v02qj7qmlmzk5a/auto"), "auto");
}

main().catch(console.error);
