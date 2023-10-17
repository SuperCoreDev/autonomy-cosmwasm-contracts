import { instantiateContract } from "./util";
import {
  auto_denom,
  registryCodeId,
  STAN_STAKE,
  wrapperCodeId,
} from "./constants";
import { getConnection } from "./connection";

async function main() {
  const { client, wallet } = await getConnection();

  const registry = await instantiateContract(
    client,
    wallet,
    wallet,
    registryCodeId,
    {
      config: {
        admin: (await wallet.getAccounts())[0].address,
        auto: {
          native_token: {
            denom: auto_denom,
          },
        },
        fee_amount: "1000000",
        fee_denom: "uosmo",
        stake_amount: STAN_STAKE.toString(),
        blocks_in_epoch: 100,
      },
    }
  );
  console.log("registry", registry.contractAddress);
  const wrapper = await instantiateContract(
    client,
    wallet,
    wallet,
    wrapperCodeId,
    {}
  );
  console.log("wrapper", wrapper.contractAddress);
}

main().catch(console.error);
