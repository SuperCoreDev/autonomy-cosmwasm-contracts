import { storeCode } from "./util";
import { getConnection } from "./connection";

async function main() {
  const { wallet, client } = await getConnection();

  const paths = process.argv.slice(2);
  for (let i = 0; i < paths.length; i += 1) {
    const contractCodeId = await storeCode(client, wallet, paths[i]);
    console.log(paths[i], ":", contractCodeId);
  }
}

main().catch(console.error);
