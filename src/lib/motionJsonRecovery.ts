export const closeMotionJsonContainers = (text: string): string | undefined => {
  const stack: string[] = [];
  let quoted = false;
  let escaped = false;
  let changed = false;
  let result = "";
  for (const token of text) {
    if (quoted) {
      result += token;
      if (escaped) escaped = false;
      else if (token === "\\") escaped = true;
      else if (token === '"') quoted = false;
      continue;
    }
    if (token === '"') quoted = true;
    else if (token === "{") stack.push("}");
    else if (token === "[") stack.push("]");
    else if (token === "}" || token === "]") {
      if (!stack.includes(token)) return undefined;
      while (stack.at(-1) !== token) {
        result += stack.pop();
        changed = true;
      }
      stack.pop();
    }
    result += token;
  }
  if (!changed || quoted || stack.length) return undefined;
  try {
    JSON.parse(result);
    return result;
  } catch {
    return undefined;
  }
};
