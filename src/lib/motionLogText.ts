import { MOTION_LOG_TEXT as T } from "../constants/motionLogText.js";
const splitScopes = (text: string): { scopes: string[]; message: string } => {
  const scopes: string[] = [];
  let message = text;
  for (let match = message.match(T.SCOPE); match; match = message.match(T.SCOPE)) {
    const scope = match[1];
    const last = scopes.at(-1);
    if (!last || (last !== scope && !last.startsWith(scope))) scopes.push(scope);
    message = message.slice(match[0].length);
  }
  return { scopes, message };
};
export const motionUserLogMessage = (message: string): string | undefined => {
  const text = message.trim();
  if (!text || T.DROP.some((pattern) => pattern.test(text))) return undefined;
  return T.REWRITE.reduce((value, [pattern, to]) => value.replace(pattern, to), text);
};
export const motionUserLogLine = (line: string): string | undefined => {
  const stamp = line.match(T.TIME)?.[1] || T.EMPTY;
  const { scopes, message } = splitScopes(line.slice(stamp.length));
  const friendly = motionUserLogMessage(message);
  if (friendly === undefined) return undefined;
  return stamp + scopes.map((scope) => T.OPEN + scope + T.CLOSE).join(T.EMPTY) + friendly;
};
export const motionLogBody = (line: string): string => line.replace(T.TIME, T.EMPTY);
export const createMotionLogFilter = (now: () => number = Date.now) => {
  let last: string | undefined;
  let lastAt = 0;
  return (line: string): string | undefined => {
    const friendly = motionUserLogLine(line);
    if (friendly === undefined) return undefined;
    const body = motionLogBody(friendly);
    const at = now();
    if (body === last && at - lastAt < T.DEDUPE_MS) return undefined;
    last = body;
    lastAt = at;
    return friendly;
  };
};
