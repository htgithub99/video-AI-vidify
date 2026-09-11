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

const getValueType = (value: unknown): string => (_.isArray(value) ? "array" : _.isNull(value) ? "null" : typeof value);

const getResponseSchemaIssues = (value: unknown, schema: ResponseSchema, pathValue: string = "$root"): string[] => {
  if (schema.enum && !_.includes(schema.enum, value)) return [`${pathValue}:enum_invalid`];
  if (_.isEqual(schema.type, "object")) {
    if (!_.isPlainObject(value)) return [`${pathValue}:expected_object_received_${getValueType(value)}`];
    const source = value as Record<string, unknown>;
    const properties = schema.properties || {};
    const missingIssues = _.map(
      _.filter(schema.required || [], (key) => !_.has(source, key)),
      (key) => `${pathValue}.${key}:missing`,
    );
    const additionalIssues =
      schema.additionalProperties === false
        ? _.map(
            _.filter(_.keys(source), (key) => !_.has(properties, key)),
            (key) => `${pathValue}.${key}:unexpected`,
          )
        : [];
    const propertyIssues = _.flatMap(properties, (propertySchema, key) =>
      _.has(source, key) ? getResponseSchemaIssues(_.get(source, key), propertySchema, `${pathValue}.${key}`) : [],
    );
    return _.concat(missingIssues, additionalIssues, propertyIssues);
  }
  if (_.isEqual(schema.type, "array")) {
    if (!_.isArray(value)) return [`${pathValue}:expected_array_received_${getValueType(value)}`];
    const lengthIssues = _.lt(_.size(value), _.defaultTo(schema.minItems, 0)) ? [`${pathValue}:min_items_${_.defaultTo(schema.minItems, 0)}_received_${_.size(value)}`] : [];
    const maximumLengthIssues = !_.isUndefined(schema.maxItems) && _.gt(_.size(value), schema.maxItems) ? [`${pathValue}:max_items_${schema.maxItems}_received_${_.size(value)}`] : [];
    const itemIssues = schema.items ? _.flatMap(value, (item, index) => getResponseSchemaIssues(item, schema.items!, `${pathValue}[${index}]`)) : [];
    return _.concat(lengthIssues, maximumLengthIssues, itemIssues);
  }
  if (_.isEqual(schema.type, "string")) {
    if (!_.isString(value)) return [`${pathValue}:expected_string_received_${getValueType(value)}`];
    if (!_.isUndefined(schema.minLength) && _.lt(value.length, schema.minLength)) return [`${pathValue}:min_length_${schema.minLength}_received_${value.length}`];
  }
  if (_.isEqual(schema.type, "boolean") && !_.isBoolean(value)) return [`${pathValue}:expected_boolean_received_${getValueType(value)}`];
  if (_.includes(["number", "integer"], schema.type)) {
    if (!isFiniteNumber(value)) return [`${pathValue}:expected_${schema.type}_received_${getValueType(value)}`];
    if (_.isEqual(schema.type, "integer") && !Number.isInteger(value)) return [`${pathValue}:expected_integer`];
    if (!_.isUndefined(schema.minimum) && value < schema.minimum) return [`${pathValue}:minimum_${schema.minimum}_received_${value}`];
    if (!_.isUndefined(schema.maximum) && value > schema.maximum) return [`${pathValue}:maximum_${schema.maximum}_received_${value}`];
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

const matchesArraySchema = (value: unknown, schema: ResponseSchema): boolean =>
  _.isArray(value) &&
  _.size(value) >= _.defaultTo(schema.minItems, 0) &&
  (_.isUndefined(schema.maxItems) || _.size(value) <= schema.maxItems) &&
  (!schema.items || _.every(value, (item) => matchesResponseSchema(item, schema.items!)));

const matchesResponseSchema = (value: unknown, schema: ResponseSchema): boolean => {
  if (schema.enum && !_.includes(schema.enum, value)) return false;
  if (_.isEqual(schema.type, "object")) return matchesObjectSchema(value, schema);
  if (_.isEqual(schema.type, "array")) return matchesArraySchema(value, schema);
  if (_.isEqual(schema.type, "string")) return _.isString(value) && (_.isUndefined(schema.minLength) || value.length >= schema.minLength);
  if (_.isEqual(schema.type, "boolean")) return _.isBoolean(value);
  if (_.includes(["number", "integer"], schema.type)) {
    if (!isFiniteNumber(value) || (_.isEqual(schema.type, "integer") && !Number.isInteger(value))) return false;
    if (!_.isUndefined(schema.minimum) && value < schema.minimum) return false;
    if (!_.isUndefined(schema.maximum) && value > schema.maximum) return false;
  }
  return true;
};

export const assertResponseSchema = (value: unknown, schema: ResponseSchema, errorMessage: string): void => {
  const issues = getResponseSchemaIssues(value, schema);
  if (!_.isEmpty(issues)) throw new Error(`${errorMessage}:${_.join(issues, ",")}`);
};
