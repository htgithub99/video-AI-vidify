import _ from "lodash";

export enum ResponseContractName {
  Hook = "hook",
  ScriptPlan = "script_plan",
  Chapter = "chapter",
}

const REQUIRED_PATHS: Record<ResponseContractName, string[]> = {
  [ResponseContractName.Hook]: ["audience", "versions"],
  [ResponseContractName.ScriptPlan]: ["theme", "creativeBrief", "factPack", "chapters"],
  [ResponseContractName.Chapter]: ["scriptSegment"],
};

export const assertResponseContract = (value: unknown, contract: ResponseContractName): void => {
  if (!_.isPlainObject(value)) throw new Error(`invalid_${contract}_response`);
  const missingPaths = _.filter(REQUIRED_PATHS[contract], pathValue => _.isNil(_.get(value, pathValue)));
  if (!_.isEmpty(missingPaths)) throw new Error(`invalid_${contract}_response_missing_${_.join(missingPaths, "_")}`);
  if (_.isEqual(contract, ResponseContractName.Hook) && _.isEmpty(_.get(value, "versions"))) throw new Error("invalid_hook_response_empty_versions");
  if (_.isEqual(contract, ResponseContractName.ScriptPlan) && _.lt(_.size(_.get(value, "chapters")), 3)) throw new Error("invalid_script_plan_response_insufficient_chapters");
  if (_.isEqual(contract, ResponseContractName.Chapter) && _.isEmpty(_.trim(_.toString(_.get(value, "scriptSegment"))))) throw new Error("invalid_chapter_response_empty_script");
};
