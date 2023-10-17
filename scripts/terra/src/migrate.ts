import { upgradeContract } from "./util";
import {
  registry,
  registryCodeId,
  wrapperAstroport,
  wrapperAstroportCodeId,
} from "./constants";
import { getConnection } from "./connection";

async function main() {
  const { client, wallet } = await getConnection();

  await upgradeContract(client, wallet, registry, registryCodeId, {});
  await upgradeContract(
    client,
    wallet,
    wrapperAstroport,
    wrapperAstroportCodeId,
    {}
  );
}

main().catch(console.error);
