import "dotenv/config";

// environment
export const MNEMONIC = process.env.MNEMONIC || "";
export const MAIN_NETWORK = process.env.MAIN_NETWORK || "";
export const CHAINID = process.env.CHAINID || "";

export const STAN_STAKE = 1000000;

// phoenix mainnet

// export const auto = "terra1jh37p2akmwprfwr2235kjyt3wuz0s2sfenhtytg9cajsxnxfvdasnaurdp";
// export const registry = "terra1za5a509w6jvahlcwepnyfzxlwd3wm4lvpmua4w32ypn2we3gjajq5hfkdv";
// export const wrapperAstroport = "terra1tzsgwvnhrf7fdnn06wun92l7lud9sty0fddet02kwzrczp0d6wmqq7kypn";

// export const auto_denom = "uluna";

// export const registryCodeId = 882;
// export const wrapperAstroportCodeId = 883;
// export const cw20CodeId = 870;

// pisco testnet

export const auto = "terra1679n3rthcvghet6tc29ugqtn5f3axp0lvceshq0c0r482pps3u4qggfyax";
export const registry = "terra163t8sxkyp9em27y26pa8nhzwz84dv8dftta2qe3806f6q2ve4mfswpp233";
export const wrapperAstroport = "terra1mc0wr7n2mmfu3crp4xqxun6spgtenacwtzzz249p6r9p8yx2ctysc2gc0d";

export const auto_denom = "uluna";

export const registryCodeId = 6456;
export const wrapperAstroportCodeId = 6457;
export const cw20CodeId = 6338;
