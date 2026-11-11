import { CACHED_JSON as C } from "../constants/cachedJson.js";
const cache = new WeakMap<object, string>();
const plain = (value: object): boolean => {
  if (Array.isArray(value)) return true;
  const proto = Object.getPrototypeOf(value);
  return (proto === Object.prototype || proto === null) && typeof (value as { toJSON?: unknown }).toJSON !== C.FUNCTION;
};
const skipped = (value: unknown): boolean => value === undefined || typeof value === C.FUNCTION || typeof value === C.SYMBOL;
const build = (value: object, depth: number): string => {
  let text = Array.isArray(value) ? C.ARRAY_OPEN : C.OBJECT_OPEN;
  let first = true;
  if (Array.isArray(value)) {
    for (const item of value) {
      text += (first ? C.EMPTY : C.COMMA) + (skipped(item) ? C.NULL : cachedJson(item, depth - 1));
      first = false;
    }
    return text + C.ARRAY_CLOSE;
  }
  for (const key of Object.keys(value)) {
    const item = (value as Record<string, unknown>)[key];
    if (skipped(item)) continue;
    text += (first ? C.EMPTY : C.COMMA) + JSON.stringify(key) + C.COLON + cachedJson(item, depth - 1);
    first = false;
  }
  return text + C.OBJECT_CLOSE;
};
const strings = new Map<string, string>();
interface HashState {
  a: number;
  b: number;
  length: number;
}
const prefixes = new WeakMap<object, HashState>();
const hashStart = (): HashState => ({ a: C.HASH_SEED_A, b: C.HASH_SEED_B, length: 0 });
const hashFeed = (state: HashState, text: string): HashState => {
  let { a, b } = state;
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index);
    a = Math.imul(a ^ code, C.HASH_PRIME);
    b = Math.imul(b ^ code, C.HASH_MIX) ^ (b >>> C.HASH_SHIFT);
  }
  return { a, b, length: state.length + text.length };
};
const hashEnd = (state: HashState): string => C.HASH_PREFIX + (state.a >>> 0).toString(C.HASH_RADIX).padStart(C.HASH_PAD, C.HASH_PAD_CHAR) + (state.b >>> 0).toString(C.HASH_RADIX).padStart(C.HASH_PAD, C.HASH_PAD_CHAR) + state.length.toString(C.HASH_RADIX);
export const hashText = (text: string): string => hashEnd(hashFeed(hashStart(), text));
const itemJson = (item: unknown): string => (skipped(item) ? C.NULL : cachedJson(item));
export const hashJson = (items: readonly unknown[]): string => {
  const head = items[0];
  const keyed = head !== null && typeof head === C.OBJECT ? (head as object) : undefined;
  let state = keyed && prefixes.get(keyed);
  if (!state) {
    state = hashFeed(hashStart(), C.ARRAY_OPEN + (items.length ? itemJson(head) : C.EMPTY));
    if (keyed) prefixes.set(keyed, state);
  }
  for (let index = 1; index < items.length; index++) state = hashFeed(state, C.COMMA + itemJson(items[index]));
  return hashEnd(hashFeed(state, C.ARRAY_CLOSE));
};
export const cachedJson = (value: unknown, depth: number = C.DEPTH): string => {
  if (typeof value === C.STRING && (value as string).length > C.LARGE_STRING) {
    const hit = strings.get(value as string);
    if (hit !== undefined) return hit;
    const text = JSON.stringify(value);
    if (strings.size >= C.STRING_SLOTS) strings.delete(strings.keys().next().value!);
    strings.set(value as string, text);
    return text;
  }
  if (value === null || typeof value !== C.OBJECT || !plain(value as object)) return JSON.stringify(value) as string;
  const hit = cache.get(value as object);
  if (hit !== undefined) return hit;
  const text = depth > 0 ? build(value as object, depth) : JSON.stringify(value);
  cache.set(value as object, text);
  return text;
};
