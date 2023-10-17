import { migrateContract } from "./util";
import { registry, registryCodeId, wrapper, wrapperCodeId } from "./constants";
import { getConnection } from "./connection";

async function main() {
  const { client, wallet } = await getConnection();

  await migrateContract(client, wallet, wallet, registry, registryCodeId, {});
  await migrateContract(client, wallet, wallet, wrapper, wrapperCodeId, {});
}

main().catch(console.error);
