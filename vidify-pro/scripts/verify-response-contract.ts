import { assertResponseContract, ResponseContractName } from "../src/server/services/responseContractService.ts";
import { resolveCorrectiveRetryLimit } from "../src/services/qualityProfileService.ts";
import { QualityMode } from "../src/types.ts";
const assert=(value:unknown,message:string):void=>{if(!value)throw new Error(message)};
assertResponseContract({audience:"general",versions:[{id:"1"}]},ResponseContractName.Hook);
let rejected=false;try{assertResponseContract({chapters:[]},ResponseContractName.ScriptPlan)}catch{rejected=true}
assert(rejected,"invalid script plan accepted");
assert(resolveCorrectiveRetryLimit(QualityMode.Economy)===0,"economy retry budget failed");
assert(resolveCorrectiveRetryLimit(QualityMode.Premium)===1,"premium retry budget failed");
console.log("Response contract and quality budget assertions passed");
