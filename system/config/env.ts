/* eslint-disable no-console */
function logEnvUsage() {
  console.log(`
------------------------------------------------------------------------------------------------------------------
	PROMOD_S_RESET_REPORT 						- clean up existing report (start report generation from scratch)
	PROMOD_S_TAGS_ID 									- use value of the env var to indentify tags in test case options object
	PROMOD_S_RECALL_AFTER_EACH 				- call test case after each hook even if test case body failed
	PROMOD_S_ENABLE_LOGS 							- show all system logging
	PROMOD_S_GENERATE_DEFAULT_IMPORT 	- generate default export for page actions
	PROMOD_S_GENERATE_ACTIONS_TYPE 		- generate default type for page actions
	PROMOD_S_RESET_PURE_ACTIONS 		  - re-create pure js generated actions even if file exists
------------------------------------------------------------------------------------------------------------------
`);
}

export { logEnvUsage };
