import { writeVerificationLog } from "./verificationLogger.ts";
import { assertResponseContract, ResponseContractName } from "../src/server/services/responseContractService.ts";
import { extractCleanChapterSegment } from "../src/server/services/chapterResponseService.ts";
const assert=(value:unknown,message:string):void=>{if(!value)throw new Error(message)};
assertResponseContract({audience:"general",versions:[{id:"1"}]},ResponseContractName.Hook);
let rejected=false;try{assertResponseContract({chapters:[]},ResponseContractName.ScriptPlan)}catch{rejected=true}
assert(rejected,"invalid script plan accepted");
assert(extractCleanChapterSegment('{"scriptSegment":"**Nội dung sạch** 😊"}').trim() === "Nội dung sạch", "chapter response cleanup failed");
writeVerificationLog("Response contract assertions passed");
