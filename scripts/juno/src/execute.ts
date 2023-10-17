import { coin } from "@cosmjs/proto-signing";
import { getRegistryClient } from "./connection";

async function main() {
  const client = await getRegistryClient();
  await client.stakeDenom({ numStakes: 1 }, "auto", undefined, [
    coin(10000, "ujunox"),
  ]);
}

main().catch(console.error);
