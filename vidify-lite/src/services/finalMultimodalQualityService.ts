import _ from "lodash";
import { API_ROUTES, REFACTOR_CONSTANTS } from "../constants";
import { safeSystemFetch } from "../lib/shared-utils";
import { FinalMultimodalQualityReport } from "../types";
const MIN_SCORE = 85;
export const validateFinalVideo = async (videoUrl:string,script:string,viewerPromise:string):Promise<FinalMultimodalQualityReport> => {
  const response=await safeSystemFetch(API_ROUTES.PIPELINE_VALIDATE_FINAL_VIDEO,{videoUrl,script,viewerPromise});
  if(!response.success||!response.data?.success)return{visualScore:0,cropScore:0,continuityScore:0,pacingScore:0,transitionVarietyScore:0,promiseAlignmentScore:0,blockingErrors:[response.error||REFACTOR_CONSTANTS.UNKNOWN_WARNING],warnings:[],passed:false};
  const value=response.data.quality;const score=(key:string)=>_.clamp(_.toNumber(_.get(value,key)),0,100);const report={visualScore:score("visualScore"),cropScore:score("cropScore"),continuityScore:score("continuityScore"),pacingScore:score("pacingScore"),transitionVarietyScore:score("transitionVarietyScore"),promiseAlignmentScore:score("promiseAlignmentScore"),blockingErrors:_.uniq(_.compact(_.castArray(value.blockingErrors))),warnings:_.uniq(_.compact(_.castArray(value.warnings))),passed:false};report.passed=_.isEmpty(report.blockingErrors)&&_.every([report.visualScore,report.cropScore,report.continuityScore,report.pacingScore,report.transitionVarietyScore,report.promiseAlignmentScore],item=>item>=MIN_SCORE);return report;
};
