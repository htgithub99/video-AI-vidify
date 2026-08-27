import _ from "lodash";

interface ResponseSchema { type?: string; required?: readonly string[]; properties?: Record<string, ResponseSchema>; items?: ResponseSchema; minItems?: number; minimum?: number; maximum?: number; enum?: readonly unknown[]; additionalProperties?: boolean; }

const isFiniteNumber = (value: unknown): value is number => _.isNumber(value) && Number.isFinite(value);

const matchesObjectSchema = (value: unknown, schema: ResponseSchema): boolean => {
  if (!_.isPlainObject(value)) return false;
  const source = value as Record<string, unknown>;
  const properties = schema.properties || {};
  if (!_.every(schema.required || [], (key) => _.has(source, key))) return false;
  if (schema.additionalProperties === false && !_.every(_.keys(source), (key) => _.has(properties, key))) return false;
  return _.every(properties, (propertySchema, key) => !_.has(source, key) || matchesResponseSchema(_.get(source, key), propertySchema));
};

const matchesArraySchema = (value: unknown, schema: ResponseSchema): boolean => _.isArray(value) && _.size(value) >= _.defaultTo(schema.minItems, 0) && (!schema.items || _.every(value, (item) => matchesResponseSchema(item, schema.items!)));

export const matchesResponseSchema = (value: unknown, schema: ResponseSchema): boolean => {
  if (schema.enum && !_.includes(schema.enum, value)) return false;
  if (_.isEqual(schema.type, "object")) return matchesObjectSchema(value, schema);
  if (_.isEqual(schema.type, "array")) return matchesArraySchema(value, schema);
  if (_.isEqual(schema.type, "string")) return _.isString(value);
  if (_.isEqual(schema.type, "boolean")) return _.isBoolean(value);
  if (_.includes(["number", "integer"], schema.type)) {
    if (!isFiniteNumber(value) || (_.isEqual(schema.type, "integer") && !Number.isInteger(value))) return false;
    if (!_.isUndefined(schema.minimum) && value < schema.minimum) return false;
    if (!_.isUndefined(schema.maximum) && value > schema.maximum) return false;
  }
  return true;
};

export const assertResponseSchema = (value: unknown, schema: ResponseSchema, errorMessage: string): void => {
  if (!matchesResponseSchema(value, schema)) throw new Error(errorMessage);
};
