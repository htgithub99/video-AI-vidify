import _ from "lodash";
import { RESPONSE_CONTRACT_CONFIG } from "../../constants/index.js";

export enum ResponseContractName {
  Hook = "hook",
  ScriptPlan = "script_plan",
  Chapter = "chapter",
}

const createContractError = (template: string, replacements: Record<string, string>): Error => new Error(_.reduce(replacements, (message, value, key) => message.replace(`{${key}}`, value), template));

export const assertResponseContract = (value: unknown, contract: ResponseContractName): void => {
  if (!_.isPlainObject(value)) {
    throw createContractError(RESPONSE_CONTRACT_CONFIG.INVALID_RESPONSE_TEMPLATE, { contract });
  }
  const requiredPaths = RESPONSE_CONTRACT_CONFIG.REQUIRED_PATHS[contract];
  const missingPaths = _.filter(requiredPaths, (pathValue) => _.isNil(_.get(value, pathValue)));
  if (!_.isEmpty(missingPaths)) {
    throw createContractError(RESPONSE_CONTRACT_CONFIG.MISSING_PATHS_TEMPLATE, {
      contract,
      paths: _.join(missingPaths, "_"),
    });
  }
  if (_.isEqual(contract, ResponseContractName.Hook) && _.isEmpty(_.get(value, "versions"))) {
    throw new Error(RESPONSE_CONTRACT_CONFIG.EMPTY_HOOK_VERSIONS_ERROR);
  }
  if (_.isEqual(contract, ResponseContractName.ScriptPlan) && _.lt(_.size(_.get(value, "chapters")), RESPONSE_CONTRACT_CONFIG.MIN_SCRIPT_PLAN_CHAPTERS)) {
    throw new Error(RESPONSE_CONTRACT_CONFIG.INSUFFICIENT_CHAPTERS_ERROR);
  }
  if (_.isEqual(contract, ResponseContractName.Chapter) && _.isEmpty(_.trim(_.toString(_.get(value, "scriptSegment"))))) {
    throw new Error(RESPONSE_CONTRACT_CONFIG.EMPTY_CHAPTER_SCRIPT_ERROR);
  }
};
