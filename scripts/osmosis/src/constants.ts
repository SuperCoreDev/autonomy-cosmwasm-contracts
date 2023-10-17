import "dotenv/config";

// environment
export const MNEMONIC = process.env.MNEMONIC || "";
export const MAIN_NETWORK = process.env.MAIN_NETWORK || "https://rpc-test.osmosis.zone";
export const PREFIX = process.env.PREFIX || "osmo";
export const GASPRICE = process.env.GASPRICE || "";

export const auto_denom =
  "factory/osmo1phaxpevm5wecex2jyaqty2a4v02qj7qmlmzk5a/auto";

// testnet
export const registry =
  "osmo1zynr26u48vdjrcuxkgswfhcx4zh5lw58qshzycykf33p7fp5y32qkydwrp";
export const wrapper =
  "osmo1g85sgdggdhez4htjj3d9m2zw734dt4ap6gdcymp6ymrveq5d48nswqkuww";

// export const registryCodeId = 4920;
// export const wrapperCodeId = 4921;

// export const STAN_STAKE = 10000;

export const registryCodeId = 478;
export const wrapperCodeId = 270;

export const STAN_STAKE = 10000;
