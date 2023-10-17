import * as LocalJuno from "./environments/localjuno";
import * as TestJuno from "./environments/testjuno";
import * as MainJuno from "./environments/mainjuno";

import * as LocalTerra from "./environments/localterra";
import * as TestTerra from './environments/testterra';
import * as MainTerra from './environments/mainterra';

import * as LocalOsmosis from './environments/localosmosis';

//----------------------------------------------------------------------------------------
// Test-suite
//----------------------------------------------------------------------------------------
(async () => {
	const mode = process.env.npm_config_mode || "";
	switch (mode) {

		/* -   Juno local network    -  */ 
		
		case "localjuno_setup_common":
			await LocalJuno.startSetupCommon();
			break;
		case "localjuno_tests_station":
			await LocalJuno.startTestsStation();
			break;
		case "localjuno_setup_station":
			await LocalJuno.startSetupStation();
			break;

		case "localjuno_tests_wrapperjunoswap":
			await LocalJuno.startTestsWraperJunoswap();
			break;
		case "localjuno_setup_wrapperjunoswap":
			await LocalJuno.startSetupWrapperJunoswap();
			break;

		/* -   Juno testnet    -  */ 
		
		case "testjuno_setup_common":
			await TestJuno.startSetupCommon();
			break;
		case "testjuno_tests_station":
			await TestJuno.startTestsStation();
			break;
		case "testjuno_setup_station":
			await TestJuno.startSetupStation();
			break;

		case "testjuno_tests_wrapperjunoswap":
			await TestJuno.startTestsWraperJunoswap();
			break;
		case "testjuno_setup_wrapperjunoswap":
			await TestJuno.startSetupWrapperJunoswap();
			break;

		/* -   Juno mainnet    -  */ 
	
		case "mainjuno_setup_common":
			await MainJuno.startSetupCommon();
			break;
		case "mainjuno_tests_station":
			await MainJuno.startTestsStation();
			break;
		case "mainjuno_setup_station":
			await MainJuno.startSetupStation();
			break;

		case "mainjuno_tests_wrapperjunoswap":
			await MainJuno.startTestsWraperJunoswap();
			break;
		case "mainjuno_setup_wrapperjunoswap":
			await MainJuno.startSetupWrapperJunoswap();
			break;
	

		/* -   Terra2.0 local network    -  */ 

		case "localterra_setup_common":
			await LocalTerra.startSetupCommon();
			break;
		case "localterra_tests_station":
			await LocalTerra.startTestsStation();
			break;
		case "localterra_setup_station":
			await LocalTerra.startSetupStation();
			break;

		case "localterra_tests_wrapperastroport":
			await LocalTerra.startTestsWraperAstroport();
			break;
		case "localterra_setup_wrapperastroport":
			await LocalTerra.startSetupWrapperAstroport();
			break;

		/* -   Terra2.0 testnet    -  */ 

		case "testterra_setup_common":
			await TestTerra.startSetupCommon();
			break;
		case "testterra_tests_station":
			await TestTerra.startTestsStation();
			break;
		case "testterra_setup_station":
			await TestTerra.startSetupStation();
			break;

		case "testterra_tests_wrapperastroport":
			await TestTerra.startTestsWraperAstroport();
			break;
		case "testterra_setup_wrapperastroport":
			await TestTerra.startSetupWrapperAstroport();
			break;

		/* -   Terra2.0 mainnet   -  */ 

		case "mainterra_setup_common":
			await MainTerra.startSetupCommon();
			break;
		case "mainterra_tests_station":
			await MainTerra.startTestsStation();
			break;
		case "mainterra_setup_station":
			await MainTerra.startSetupStation();
			break;

		case "mainterra_tests_wrapperastroport":
			await MainTerra.startTestsWraperAstroport();
			break;
		case "mainterra_setup_wrapperastroport":
			await MainTerra.startSetupWrapperAstroport();
			break;

		/* -   Osmosis local network    -  */ 
		
		case "localosmosis_setup_common":
			await LocalOsmosis.startSetupCommon();
			break;

		case "localosmosis_tests_station":
			await LocalOsmosis.startTestsStation();
			break;

		case "localosmosis_setup_station":
			await LocalOsmosis.startSetupStation();
			break;

		case "localosmosis_tests_wrapperosmosis":
			await LocalOsmosis.startTestsWrapperOsmosis();
			break;

		case "localosmosis_setup_wrapperosmosis":
			await LocalOsmosis.startSetupWrapperOsmosis();
			break;

		default:
			console.log("Invalid command");
			break;
	}
})();
