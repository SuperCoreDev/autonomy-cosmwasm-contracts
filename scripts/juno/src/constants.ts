import "dotenv/config";

// environment
export const MNEMONIC = process.env.MNEMONIC || "";
export const MAIN_NETWORK = process.env.MAIN_NETWORK || "";
export const PREFIX = process.env.PREFIX || "";
export const GASPRICE = process.env.GASPRICE || "";

export const STAN_STAKE = 10000;

// testnet
export const auto_denom = "ujunox";
export const registry =
  "juno1aeu4d9l2pcypsmce2jmzg0der7d298azg2nuw8rrr3w85rr3vjpsg7kyd4";
export const wrapper =
  "juno1srr5cvch7tdatzq8qrsl683d66ugxwm8vlhfqh5tqu6f7l3zu8xshek74y";

export const registryCodeId = 1909;
export const wrapperCodeId = 1910;
