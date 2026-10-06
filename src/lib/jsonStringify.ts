export const stringifyJson = (value: unknown, replacer?: (number | string)[] | null | ((this: unknown, key: string, value: unknown) => unknown), space?: string | number): string => JSON.stringify(value, replacer as never, space);
export const parseJson = <T = any>(value: string, reviver?: (this: any, key: string, value: any) => any): T => JSON.parse(value, reviver) as T;
export const cloneJson = <T>(value: T): T => parseJson<T>(stringifyJson(value));
