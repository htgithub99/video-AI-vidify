const TAG_RE = /<(\/?)([A-Za-z][\w:.-]*)\b[^>]*?(\/?)>/g;
const SKIP_RE = /^<(?:!|\?)/;
const LEAF_PARENTS: Record<string, RegExp> = { lineargradient: /^stop$/i, radialgradient: /^stop$/i };
export const balanceSvgTags = (svg: string): string => {
  const stack: string[] = [];
  let out = "";
  let last = 0;
  const close = () => (out += `</${stack.pop()}>`);
  for (const m of svg.matchAll(TAG_RE)) {
    const at = m.index || 0;
    out += svg.slice(last, at);
    last = at + m[0].length;
    if (SKIP_RE.test(m[0])) {
      out += m[0];
      continue;
    }
    const name = m[2];
    const lower = name.toLowerCase();
    if (!m[1]) {
      while (stack.length && LEAF_PARENTS[stack[stack.length - 1].toLowerCase()] && !LEAF_PARENTS[stack[stack.length - 1].toLowerCase()].test(name)) close();
      out += m[0];
      if (!m[3]) stack.push(name);
      continue;
    }
    const idx = stack.map((s) => s.toLowerCase()).lastIndexOf(lower);
    if (idx < 0) continue;
    while (stack.length > idx + 1) close();
    stack.pop();
    out += m[0];
  }
  out += svg.slice(last);
  while (stack.length) close();
  return out;
};
