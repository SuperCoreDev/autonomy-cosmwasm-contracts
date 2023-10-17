// ---------------------------------------------------------------------------------------------------
// TestNet information
// ---------------------------------------------------------------------------------------------------
export const testnet = {
    // TestNet juno-1
    networkInfo: {
      url: "https://rpc.uni.juno.deuslabs.fi",
      chainId: "uni-3",
    },
  
    addresses: {
      wallet1: "juno16g2rahf5846rxzp3fwlswy08fz8ccuwk03k57y",
      wallet2: "juno16e3t7td2wu0wmggnxa3xnyu5whljyed69ptvkp",
      wallet3: "juno1yq0azfkky8aqq4kvzdawrs7tm3rmpl8xs6vcx2",
    },
  
    mnemonicKeys: {
      wallet1: "clip hire initial neck maid actor venue client foam budget lock catalog sweet steak waste crater broccoli pipe steak sister coyote moment obvious choose",
      wallet2: "audit crawl employ lunch figure cigar chapter wrestle endless process unique angry",
      wallet3: "ability pitch abuse game alter broccoli lottery warm baby tonight misery lumber",
    },
    
    // Should be updated contract addresses after deploying wasms in the LocalJuno
    contracts: {
      // Autonomy common contracts
      auto: "juno1gn026jj57n0snq7vyl29nypuvzuavs4xsfsja6q6f9glxcqdlmkqf2l96y", // codeId: 1327
      registryStake: "juno1f5lgj5dhl72ngchtzpxf6cl2drga6ndj50fgvryk50d98czghvkscq27lc", // codeId: 1328
  
      // Test "Autonomy-station"
      fundsRouter: "juno1qthxmvn8qr32wwa26n4xafed48uwxf4al7q43mh76pzr0tu6tr8s6yq8tj", // codeId: 1333
      timeConditions: "juno1rnh4qlrg3hlqs9wd0jfy24gwepaqks9e2cpmfcqnu8fhk74q3uzsysax2k", // codeId: 1334
      testCounter: "juno19sp4qf36mat8ht8aluh0gj2nqcn59kln7u6g7fg0gh2t3w6aw67s8hqxpx", // codeId: 1335
  
      // Test "Wrapper-Junoswap"
      tcw: "juno1uwgw49jtlfn6havmmju3h6cncdvfmnnet5v3wahclpaj6wzqe9tqt225dw",  // "TCW": Test cw20 token   codeId: 1330
      tcwUjunoSwap: "juno1zgkua2rfxsqmgtu4k8jhxkh9mgr5ldh9khfcuzmp6tkfvnmg6xkqemecxe", // codeId: 1331
      wrapperJunoSwap: "juno1rtrsaryw4c2nru55f93mk5x3980pyx2q43874888azkw7vaw7xtslz0z76", // codeId: 1332
    },
} as const;

// ---------------------------------------------------------------------------------------------------
// MainNet information
// ---------------------------------------------------------------------------------------------------
export const mainnet = {
  // TestNet juno-1
  networkInfo: {
    url: "https://rpc-juno.itastakers.com",
    chainId: "juno-1",
  },

  addresses: {
    wallet1: "juno16g2rahf5846rxzp3fwlswy08fz8ccuwk03k57y",
    wallet2: "juno16e3t7td2wu0wmggnxa3xnyu5whljyed69ptvkp",
    wallet3: "juno1yq0azfkky8aqq4kvzdawrs7tm3rmpl8xs6vcx2",
  },

  mnemonicKeys: {
    wallet1: "clip hire initial neck maid actor venue client foam budget lock catalog sweet steak waste crater broccoli pipe steak sister coyote moment obvious choose",
    wallet2: "audit crawl employ lunch figure cigar chapter wrestle endless process unique angry",
    wallet3: "ability pitch abuse game alter broccoli lottery warm baby tonight misery lumber",
  },
  
  // Should be updated contract addresses after deploying wasms in the LocalJuno
  contracts: {
    // Autonomy common contracts
    auto: "juno1mn2d0pmrc93nhj749qyrv0a4zzepaw8uhmzyd8lhf0wafnx229ssfheddy", // codeId: 526
    registryStake: "juno1skq2m2dtspuf3y7rkl40jwnaxyh75k4flmyye6jjts3v4jc5x0zsxx4dqm", // codeId: 555

    // Test "Autonomy-station"
    fundsRouter: "", // codeId: 
    timeConditions: "", // codeId: 
    testCounter: "", // codeId: 

    // Test "Wrapper-Junoswap"
    tcw: "",  // "TCW": Test cw20 token   codeId: 
    tcwUjunoSwap: "", // codeId: 
    wrapperJunoSwap: "juno1vdazp3meeqql2p00mr0ftf25fslpems2yqd2hg300e2cwuqmqnls4tqyca", // codeId: 528
  },

  constants: {
    regStakeFeeDenom: "ujuno",
    regStakeFeeAmount: "800000",
  }
} as const;
