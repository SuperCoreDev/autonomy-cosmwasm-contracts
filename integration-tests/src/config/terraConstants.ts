
// ---------------------------------------------------------------------------------------------------
// Terra Testnet information
// ---------------------------------------------------------------------------------------------------
export const testnet = {
  networkInfo: {
    url: "https://pisco-lcd.terra.dev",
    chainId: "pisco-1",
  },

  mnemonicKeys: {
    wallet1: "arrow model income logic candy garlic pony shed artefact process ethics pattern punch melt gravity fall inflict seed charge stove net off wrap tornado", // terra_wallet_2
    wallet2: "myth tide swing hat suggest razor city social bacon hobby enroll cement purpose clown bundle flag quarter dust apart bright mother fog wife leg", // terra_wallet_3
    wallet3: "eye cushion water fruit carbon axis away little eager reflect toilet buzz interest spot gentle various ranch cheap honey feed size flavor always leisure", // terra_wallet_1
  },

  codes: {
    cw20TokenCodeId: 189,
    
    registryStakeCodeId: 1078,

    // fundsRouterCodeId: 519,
    // timeConditionsCodeId: 520, 
    // testCounterCodeId: 0,

    wrapperAstroportCodeId: 896,    
    astroportTokenCodeId: 300,
    astroportPairCodeId: 303,
  },

  contracts: {
    // Autonomy common contracts
    auto: "terra19tfptlkhchm9j2y53yysezq3htw9qj0htchr6rvfn6mhxmw8lgvq6z9kzs", // CW-20 token
    registryStake: "terra1qmv9h06mspu8gtye7r5ewh29pypvtpz7rg0yzw4nkm0njygg70kqx4yt03",

    // "Autonomy-station"
    fundsRouter: "",
    timeConditions: "",
    testCounter: "",

    // "Wrapper-astroport"
    tcw: "terra1kc6w05s5xj2r4w0g7p294q9man0x8flyecleht545urazg64u7xsa6dfk8",  // "TCW": Test cw20 token
    tcwUlunaSwap: "terra1402uu7m4fnfqz780skvuhlytqmehk6cj88f00vnr2d7mapme0tksex7km9",  // Test pair(swap), TCW(cw20) - LUNA(native)
    wrapperAstroport: "terra1gd7r4cgcurx6a6wa4h5jca8jaf74lfq7tzlnze4u0ruey5e09lhs4h3386",

    tcwAutoSwap: "terra1kqtn8rz00zh5kcqu4j3644kcestysw3txuvf6m6grvgqczdvxyhqz6mv4r", // Test pair(swap), TCW(cw20) - AUTO(cw20)

    astroportFactory: "terra1z3y69xas85r7egusa0c7m5sam0yk97gsztqmh8f2cc6rr4s4anysudp7k0", 
  },

  contractConsts: {
    registryFeeAmt: "1000",
    registryFeeDenom: "uluna",

    fundsRouterDenom: "uluna",

    reg_user_fee_veri_forwarder: "",
    router_user_veri_forwarder: "",
  }
};

// ---------------------------------------------------------------------------------------------------
// Terra Mainnet information
// ---------------------------------------------------------------------------------------------------
export const mainnet = {
  networkInfo: {
    url: "https://phoenix-lcd.terra.dev",
    chainId: "phoenix-1",
  },

  mnemonicKeys: {
    wallet1: "",
    wallet2: "", 
    wallet3: "", 
  },

  codes: {
    cw20TokenCodeId: 183,  

    registryStakeCodeId: 184,

    // fundsRouterCodeId: 519,
    // timeConditionsCodeId: 520, 
    // testCounterCodeId: 0,

    wrapperAstroportCodeId: 185, 
  },

  contracts: {
    // Autonomy common contracts
    auto: "terra1jqt5mmlpd6x3jtwfdsxwtrknvaczz2xmplukzc8h86xhupg7fe7q7nkzdp", // CW-20 token
    registryStake: "terra1q9nt4sjh9c9dz7fcm0pg5u8l07hmwtkh8a3wanv9luskm2s63qjq05urvp",

    // "Autonomy-station"
    fundsRouter: "",
    timeConditions: "",
    testCounter: "",

    // "Wrapper-astroport"
    tcw: "terra1mma39sqn43aen4jh2sdmka84mv94uk7v7xw3ype2fdvlay6emrlqweyf5u",  // "TCW": Test cw20 token
    tcwUlunaSwap: "terra1h6xr89an8gh63wvju7rfrkstmf8wpxlzr2xa4l72rg8u9jp4clusqkkudk",  // Test pair(swap), TCW(cw20) - LUNA(native)
    wrapperAstroport: "terra1h0fjeuk2ksyseccujp5jm4du4q07mt263k2zu8g95f4qcq82qjgsrw2vp3",

    tcwAutoSwap: "terra1ynkgl2e7aphrc33pkx4tr4jc9vynddcesd750tg0cq0jrdudyy6sch4ka9", // Test pair(swap), TCW(cw20) - AUTO(cw20)

    astroportFactory: "terra14x9fr055x5hvr48hzy2t4q7kvjvfttsvxusa4xsdcy702mnzsvuqprer8r", 
  },

  contractConsts: {
    registryFeeAmt: "1000",
    registryFeeDenom: "uluna",

    fundsRouterDenom: "uluna",

    reg_user_fee_veri_forwarder: "",
    router_user_veri_forwarder: "",
  }
};
