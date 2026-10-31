export const stringifyJson = (value: unknown, replacer?: (number | string)[] | null | ((this: unknown, key: string, value: unknown) => unknown), space?: string | number): string => JSON.stringify(value, replacer as never, space);
export const parseJson = <T = any>(value: string, reviver?: (this: any, key: string, value: any) => any): T => JSON.parse(value, reviver) as T;
export const cloneJson = <T>(value: T): T => parseJson<T>(stringifyJson(value));
export const normalizeJsonWhitespace = (text: string): string => {
  let quoted = false,
    escaped = false,
    result = "";
  for (const token of text) {
    if (quoted) {
      result += token;
      if (escaped) escaped = false;
      else if (token === "\\") escaped = true;
      else if (token === '"') quoted = false;
    } else {
      if (token === '"') quoted = true;
      result += /[^\S \t\r\n]/u.test(token) ? " " : token;
    }
  }
  return result;
};
