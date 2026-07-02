import { appLog } from '../../lib/logger.js';


export const extractBalancedJSON = (text: string): string | null => {
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  let startIdx = -1;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }
  if (startIdx === -1) return null;

  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === '\\') {
        escape = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        const last = stack[stack.length - 1];
        if (last === '{') {
          stack.pop();
          if (stack.length === 0) {
            return text.substring(startIdx, i + 1);
          }
        }
      } else if (char === ']') {
        const last = stack[stack.length - 1];
        if (last === '[') {
          stack.pop();
          if (stack.length === 0) {
            return text.substring(startIdx, i + 1);
          }
        }
      }
    }
  }
  return null;
}


export const repairUnescapedDoubleQuotes = (jsonStr: string): string => {
  let out = '';
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];

    if (escapeNext) {
      out += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      out += char;
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      if (inString) {
        let isTrueEnd = false;
        let j = i + 1;
        while (j < jsonStr.length && /\s/.test(jsonStr[j])) {
          j++;
        }
        if (j < jsonStr.length) {
          const nextChar = jsonStr[j];
          if (nextChar === ',' || nextChar === '}' || nextChar === ']' || nextChar === ':') {
            isTrueEnd = true;
          }
        } else {
          isTrueEnd = true;
        }

        if (isTrueEnd) {
          inString = false;
          out += char;
        } else {
          out += '\\"';
        }
      } else {
        inString = true;
        out += char;
      }
      continue;
    }

    if (inString) {
      if (char === '\n') {
        out += '\\n';
      } else if (char === '\r') {
        out += '\\r';
      } else if (char === '\t') {
        out += '\\t';
      } else {
        out += char;
      }
    } else {
      out += char;
    }
  }
  return out;
}


export const completeCutoffJSON = (jsonStr: string): string => {
  let out = '';
  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    out += char;

    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }

    if (inString) {
      if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack[stack.length - 1] === '{') {
          stack.pop();
        }
      } else if (char === ']') {
        if (stack[stack.length - 1] === '[') {
          stack.pop();
        }
      }
    }
  }

  if (inString) {
    out += '"';
  }

  while (stack.length > 0) {
    const last = stack.pop();
    if (last === '{') {
      out += '}';
    } else if (last === '[') {
      out += ']';
    }
  }

  return out;
}

export const safeParseJSON = (text: string, defaultVal: any): any => {
  if (!text) return defaultVal;
  let trimmed = text.trim();
  if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') {
    return defaultVal;
  }

  const tryParseClean = (str: string): any => {
    try {
      return JSON.parse(str);
    } catch {
      const cleanCommas = str.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      try {
        return JSON.parse(cleanCommas);
      } catch {
        try {
          const repaired = repairUnescapedDoubleQuotes(str);
          return JSON.parse(repaired);
        } catch {
          try {
            const repairedCommas = repairUnescapedDoubleQuotes(cleanCommas);
            return JSON.parse(repairedCommas);
          } catch {
            try {
              const completed = completeCutoffJSON(str);
              return JSON.parse(completed);
            } catch {
              try {
                const completedCommas = completeCutoffJSON(cleanCommas);
                return JSON.parse(completedCommas);
              } catch {
                return null;
              }
            }
          }
        }
      }
    }
  };


  let parsed = tryParseClean(trimmed);
  if (parsed) return parsed;


  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match && match[1]) {
    parsed = tryParseClean(match[1].trim());
    if (parsed) return parsed;
  }


  const balanced = extractBalancedJSON(trimmed);
  if (balanced) {
    parsed = tryParseClean(balanced);
    if (parsed) return parsed;
  }


  const firstBrace = trimmed.indexOf('{');
  const firstBracket = trimmed.indexOf('[');
  let startIdx = -1;
  let endIdx = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = trimmed.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = trimmed.lastIndexOf(']');
  }

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const candidate = trimmed.substring(startIdx, endIdx + 1);
    parsed = tryParseClean(candidate);
    if (parsed) return parsed;
  }

  appLog('JSON_PARSE_WARNING', text.substring(0, 150) + '...');
  return defaultVal;
}

export const formatTime = (secs: number): string => {
  const totalSecs = Math.round(secs);
  const minutes = Math.floor(totalSecs / 60);
  const remainingSecs = totalSecs % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
};

export const cleanMarkdownText = (text: string): string => {
  if (!text) return "";
  let clean = text.trim();
  clean = clean.replace(/```[a-zA-Z]*\n?([\s\S]*?)\n?```/g, "$1");
  clean = clean.replace(/^["'`]+|["'`]+$/g, "");
  return clean.trim();
};

