import {
  SOURCE_TEMPLATE_ENUM_INVALID,
  SOURCE_TEMPLATE_EXPECTED_ARRAY_RECEIVED,
  SOURCE_TEMPLATE_EXPECTED_BOOLEAN_RECEIVED,
  SOURCE_TEMPLATE_EXPECTED_INTEGER,
  SOURCE_TEMPLATE_EXPECTED_OBJECT_RECEIVED,
  SOURCE_TEMPLATE_EXPECTED_RECEIVED,
  SOURCE_TEMPLATE_EXPECTED_STRING_RECEIVED,
  SOURCE_TEMPLATE_MAXIMUM_RECEIVED,
  SOURCE_TEMPLATE_MAX_ITEMS_RECEIVED,
  SOURCE_TEMPLATE_MINIMUM_RECEIVED,
  SOURCE_TEMPLATE_MIN_ITEMS_RECEIVED,
  SOURCE_TEMPLATE_MIN_LENGTH_RECEIVED,
  SOURCE_TEMPLATE_MISSING_2,
  SOURCE_TEMPLATE_SYMBOL_15,
  SOURCE_TEMPLATE_SYMBOL_65,
  SOURCE_TEMPLATE_SYMBOL_8,
  SOURCE_TEMPLATE_UNEXPECTED,
  SOURCE_TEXT_ARRAY,
  SOURCE_TEXT_BOOLEAN,
  SOURCE_TEXT_INTEGER,
  SOURCE_TEXT_NULL,
  SOURCE_TEXT_NUMBER,
  SOURCE_TEXT_OBJECT,
  SOURCE_TEXT_ROOT,
  SOURCE_TEXT_STRING,
  SOURCE_TEXT_SYMBOL_4,
} from "../../constants/sourceText";
import _ from "lodash";
interface ResponseSchema {
  type?: string;
  required?: readonly string[];
  properties?: Record<string, ResponseSchema>;
  items?: ResponseSchema;
  minItems?: number;
  maxItems?: number;
  minLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: readonly unknown[];
  additionalProperties?: boolean;
}
const isFiniteNumber = (value: unknown): value is number => _.isNumber(value) && Number.isFinite(value);
const getValueType = (value: unknown): string => (_.isArray(value) ? SOURCE_TEXT_ARRAY : _.isNull(value) ? SOURCE_TEXT_NULL : typeof value);
const getResponseSchemaIssues = (value: unknown, schema: ResponseSchema, pathValue: string = SOURCE_TEXT_ROOT): string[] => {
  if (schema.enum && !_.includes(schema.enum, value)) return [SOURCE_TEMPLATE_ENUM_INVALID(`${pathValue}`)];
  if (_.isEqual(schema.type, SOURCE_TEXT_OBJECT)) {
    if (!_.isPlainObject(value)) return [SOURCE_TEMPLATE_EXPECTED_OBJECT_RECEIVED(`${pathValue}`, `${getValueType(value)}`)];
    const source = value as Record<string, unknown>;
    const properties = schema.properties || {};
    const missingIssues = _.map(
      _.filter(schema.required || [], (key) => !_.has(source, key)),
      (key) => SOURCE_TEMPLATE_MISSING_2(`${pathValue}`, `${key}`),
    );
    const additionalIssues =
      schema.additionalProperties === false
        ? _.map(
            _.filter(_.keys(source), (key) => !_.has(properties, key)),
            (key) => SOURCE_TEMPLATE_UNEXPECTED(`${pathValue}`, `${key}`),
          )
        : [];
    const propertyIssues = _.flatMap(properties, (propertySchema, key) => (_.has(source, key) ? getResponseSchemaIssues(_.get(source, key), propertySchema, SOURCE_TEMPLATE_SYMBOL_15(`${pathValue}`, `${key}`)) : []));
    return _.concat(missingIssues, additionalIssues, propertyIssues);
  }
  if (_.isEqual(schema.type, SOURCE_TEXT_ARRAY)) {
    if (!_.isArray(value)) return [SOURCE_TEMPLATE_EXPECTED_ARRAY_RECEIVED(`${pathValue}`, `${getValueType(value)}`)];
    const lengthIssues = _.lt(_.size(value), _.defaultTo(schema.minItems, 0)) ? [SOURCE_TEMPLATE_MIN_ITEMS_RECEIVED(`${pathValue}`, `${_.defaultTo(schema.minItems, 0)}`, `${_.size(value)}`)] : [];
    const maximumLengthIssues = !_.isUndefined(schema.maxItems) && _.gt(_.size(value), schema.maxItems) ? [SOURCE_TEMPLATE_MAX_ITEMS_RECEIVED(`${pathValue}`, `${schema.maxItems}`, `${_.size(value)}`)] : [];
    const itemIssues = schema.items ? _.flatMap(value, (item, index) => getResponseSchemaIssues(item, schema.items!, SOURCE_TEMPLATE_SYMBOL_65(`${pathValue}`, `${index}`))) : [];
    return _.concat(lengthIssues, maximumLengthIssues, itemIssues);
  }
  if (_.isEqual(schema.type, SOURCE_TEXT_STRING)) {
    if (!_.isString(value)) return [SOURCE_TEMPLATE_EXPECTED_STRING_RECEIVED(`${pathValue}`, `${getValueType(value)}`)];
    if (!_.isUndefined(schema.minLength) && _.lt(value.length, schema.minLength)) return [SOURCE_TEMPLATE_MIN_LENGTH_RECEIVED(`${pathValue}`, `${schema.minLength}`, `${value.length}`)];
  }
  if (_.isEqual(schema.type, SOURCE_TEXT_BOOLEAN) && !_.isBoolean(value)) return [SOURCE_TEMPLATE_EXPECTED_BOOLEAN_RECEIVED(`${pathValue}`, `${getValueType(value)}`)];
  if (_.includes([SOURCE_TEXT_NUMBER, SOURCE_TEXT_INTEGER] as string[], schema.type)) {
    if (!isFiniteNumber(value)) return [SOURCE_TEMPLATE_EXPECTED_RECEIVED(`${pathValue}`, `${schema.type}`, `${getValueType(value)}`)];
    if (_.isEqual(schema.type, SOURCE_TEXT_INTEGER) && !Number.isInteger(value)) return [SOURCE_TEMPLATE_EXPECTED_INTEGER(`${pathValue}`)];
    if (!_.isUndefined(schema.minimum) && value < schema.minimum) return [SOURCE_TEMPLATE_MINIMUM_RECEIVED(`${pathValue}`, `${schema.minimum}`, `${value}`)];
    if (!_.isUndefined(schema.maximum) && value > schema.maximum) return [SOURCE_TEMPLATE_MAXIMUM_RECEIVED(`${pathValue}`, `${schema.maximum}`, `${value}`)];
  }
  return [];
};
const matchesObjectSchema = (value: unknown, schema: ResponseSchema): boolean => {
  if (!_.isPlainObject(value)) return false;
  const source = value as Record<string, unknown>;
  const properties = schema.properties || {};
  if (!_.every(schema.required || [], (key) => _.has(source, key))) return false;
  if (schema.additionalProperties === false && !_.every(_.keys(source), (key) => _.has(properties, key))) return false;
  return _.every(properties, (propertySchema, key) => !_.has(source, key) || matchesResponseSchema(_.get(source, key), propertySchema));
};
const matchesArraySchema = (value: unknown, schema: ResponseSchema): boolean => _.isArray(value) && _.size(value) >= _.defaultTo(schema.minItems, 0) && (_.isUndefined(schema.maxItems) || _.size(value) <= schema.maxItems) && (!schema.items || _.every(value, (item) => matchesResponseSchema(item, schema.items!)));
const matchesResponseSchema = (value: unknown, schema: ResponseSchema): boolean => {
  if (schema.enum && !_.includes(schema.enum, value)) return false;
  if (_.isEqual(schema.type, SOURCE_TEXT_OBJECT)) return matchesObjectSchema(value, schema);
  if (_.isEqual(schema.type, SOURCE_TEXT_ARRAY)) return matchesArraySchema(value, schema);
  if (_.isEqual(schema.type, SOURCE_TEXT_STRING)) return _.isString(value) && (_.isUndefined(schema.minLength) || value.length >= schema.minLength);
  if (_.isEqual(schema.type, SOURCE_TEXT_BOOLEAN)) return _.isBoolean(value);
  if (_.includes([SOURCE_TEXT_NUMBER, SOURCE_TEXT_INTEGER] as string[], schema.type)) {
    if (!isFiniteNumber(value) || (_.isEqual(schema.type, SOURCE_TEXT_INTEGER) && !Number.isInteger(value))) return false;
    if (!_.isUndefined(schema.minimum) && value < schema.minimum) return false;
    if (!_.isUndefined(schema.maximum) && value > schema.maximum) return false;
  }
  return true;
};
export const assertResponseSchema = (value: unknown, schema: ResponseSchema, errorMessage: string): void => {
  const issues = getResponseSchemaIssues(value, schema);
  if (!_.isEmpty(issues)) throw new Error(SOURCE_TEMPLATE_SYMBOL_8(`${errorMessage}`, `${_.join(issues, SOURCE_TEXT_SYMBOL_4)}`));
};
