import fs from 'fs';
import https from 'https';
import { Page } from 'playwright';
import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { EXTERNAL_URLS } from '../../constants/apiRoutes.js';
import { appLog, appError } from '../../lib/logger.js';
import { getBackendMsg } from '../../constants/messages.js';
chromium.use(stealthPlugin());

export let globalPlaywrightPage: Page | null = null;
export let globalBearerToken: string | null = null;

export const ensureDirectoryExists = (dir: string): void => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export const generateProceduralSpeechWav = (seconds = 5): string => {
  const sampleRate = 8000;
  const numSamples = sampleRate * seconds;
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const subChunk2Size = numSamples * blockAlign;
  const chunkSize = 36 + subChunk2Size;

  const buffer = Buffer.alloc(44 + subChunk2Size);


  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(chunkSize, 4);
  buffer.write('WAVE', 8);


  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);


  buffer.write('data', 36);
  buffer.writeUInt32LE(subChunk2Size, 40);


  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    const baseFreq = 120 + 15 * Math.sin(2 * Math.PI * 1.5 * t);

    const sampleVal =
      0.4 * Math.sin(2 * Math.PI * baseFreq * t) +
      0.35 * Math.sin(2 * Math.PI * (baseFreq * 2.5) * t) * Math.sin(2 * Math.PI * 0.4 * t) +
      0.15 * Math.sin(2 * Math.PI * 1000 * t) * (0.5 + 0.5 * Math.cos(2 * Math.PI * 1.8 * t));


    const envelope = Math.sin(Math.PI * (i / numSamples)) * (0.3 + 0.7 * Math.abs(Math.sin(2 * Math.PI * 0.6 * t)));
    const intVal = Math.floor(sampleVal * envelope * 32767);


    const clampedVal = Math.max(-32768, Math.min(32767, intVal));
    buffer.writeInt16LE(clampedVal, offset);
    offset += 2;
  }

  return buffer.toString('base64');
};


export const splitIntoTTSChunks = (text: string): string[] => {
  const paragraphs = text.split(/\n+/);
  const initialSegments: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) continue;
    const sentences = para.match(/[^.!?]+[.!?]*/g) || [para];
    for (const sent of sentences) {
      if (sent.trim()) {
        initialSegments.push(sent.trim());
      }
    }
  }

  const finalChunks: string[] = [];
  for (const seg of initialSegments) {
    if (seg.length <= 180) {
      finalChunks.push(seg);
    } else {

      const subSegments = seg.split(/([,;:|])\s*/);
      let currentSub = "";
      for (const piece of subSegments) {
        if (!piece) continue;
        if (currentSub.length + piece.length > 180) {
          if (currentSub.trim().length > 0) {
            finalChunks.push(currentSub.trim());
          }
          currentSub = piece;
        } else {
          currentSub += (currentSub ? " " : "") + piece;
        }
      }
      if (currentSub.trim().length > 0) {
        finalChunks.push(currentSub.trim());
      }
    }
  }

  // Double check that everything is under 180 characters. If still over, split by word.
  const absolutelyFinalChunks: string[] = [];
  for (const chunk of finalChunks) {
    if (chunk.length <= 180) {
      absolutelyFinalChunks.push(chunk);
    } else {
      const words = chunk.split(/\s+/);
      let temp = "";
      for (const word of words) {
        if (temp.length + word.length + 1 > 180) {
          if (temp.trim()) absolutelyFinalChunks.push(temp.trim());
          temp = word;
        } else {
          temp += (temp ? " " : "") + word;
        }
      }
      if (temp.trim()) absolutelyFinalChunks.push(temp.trim());
    }
  }

  return absolutelyFinalChunks.filter(c => c.trim().length > 0);
};

// Split text into slightly larger sentence-based chunks for Gemini TTS to prevent output length rejections or timeouts
export const splitIntoGeminiTtsChunks = (text: string): string[] => {
  const paragraphs = text.split(/\n+/);
  const initialSegments: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) continue;
    const sentences = para.match(/[^.!?]+[.!?]*/g) || [para];
    for (const sent of sentences) {
      if (sent.trim()) {
        initialSegments.push(sent.trim());
      }
    }
  }

  const finalChunks: string[] = [];
  for (const seg of initialSegments) {
    if (seg.length <= 2000) {
      finalChunks.push(seg);
    } else {
      // Split on punctuation comma/semicolon/colon first
      const subSegments = seg.split(/([,;:|])\s*/);
      let currentSub = "";
      for (const piece of subSegments) {
        if (!piece) continue;
        if (currentSub.length + piece.length > 2000) {
          if (currentSub.trim().length > 0) {
            finalChunks.push(currentSub.trim());
          }
          currentSub = piece;
        } else {
          currentSub += (currentSub ? " " : "") + piece;
        }
      }
      if (currentSub.trim().length > 0) {
        finalChunks.push(currentSub.trim());
      }
    }
  }

  // Double check that everything is under 2000 characters. If still over, split by word.
  const absolutelyFinalChunks: string[] = [];
  for (const chunk of finalChunks) {
    if (chunk.length <= 2000) {
      absolutelyFinalChunks.push(chunk);
    } else {
      const words = chunk.split(/\s+/);
      let temp = "";
      for (const word of words) {
        if (temp.length + word.length + 1 > 2000) {
          if (temp.trim()) absolutelyFinalChunks.push(temp.trim());
          temp = word;
        } else {
          temp += (temp ? " " : "") + word;
        }
      }
      if (temp.trim()) absolutelyFinalChunks.push(temp.trim());
    }
  }

  // Now, merge adjacent short chunks together up to 2000 characters to make speech flow more naturally!
  const mergedChunks: string[] = [];
  let current = "";
  for (const chunk of absolutelyFinalChunks) {
    if (current.length + chunk.length + 1 > 2000) {
      if (current.trim()) mergedChunks.push(current.trim());
      current = chunk;
    } else {
      current += (current ? " " : "") + chunk;
    }
  }
  if (current.trim()) {
    mergedChunks.push(current.trim());
  }

  return mergedChunks.filter(c => c.trim().length > 0);
};

// Fetch and stitch chunks together for seamless playback using public Google Translate TTS endpoints with deep fallbacks
export const getGoogleTtsVoiceBase64 = async (text: string, lang = 'vi'): Promise<{ base64: string; mimeType: string }> => {
  const targetLang = lang || "vi";

  const chunks = splitIntoTTSChunks(text);
  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36";

  const fetchBufferWithRetry = async (chunk: string): Promise<Buffer> => {
    if (chunk.trim().length === 0) return Buffer.alloc(0);
    const encoded = encodeURIComponent(chunk);

    let lastError: any = null;


    const urlCandidates = [
      `${EXTERNAL_URLS.GOOGLE_TRANSLATE_API}?ie=UTF-8&tl=${targetLang}&client=gtx&q=${encoded}`,
      `${EXTERNAL_URLS.GOOGLE_TRANSLATE_WEB_1}?ie=UTF-8&tl=${targetLang}&client=tw-ob&q=${encoded}`,
      `${EXTERNAL_URLS.GOOGLE_TRANSLATE_WEB_1}?ie=UTF-8&tl=${targetLang}&client=gtx&q=${encoded}`,
      `${EXTERNAL_URLS.GOOGLE_TRANSLATE_WEB_2}?ie=UTF-8&tl=${targetLang}&client=gtx&q=${encoded}`
    ];

    for (const ttsUrl of urlCandidates) {
      let retries = 2;
      while (retries > 0) {

        try {
          const response = await fetch(ttsUrl, {
            headers: {
              "User-Agent": userAgent,
              "Referer": EXTERNAL_URLS.GOOGLE_TRANSLATE_REFERER,
              "Accept": "*/*"
            }
          });
          if (response.ok) {
            const arrBuf = await response.arrayBuffer();
            return Buffer.from(arrBuf);
          } else {
            throw new Error(`${getBackendMsg('HTTP_STATUS_ERROR', targetLang === 'vi')}${response.status}`);
          }
        } catch (fetchErr) {
          lastError = fetchErr;


          try {
            const buffer = await new Promise<Buffer>((resolveNoFetch, rejectNoFetch) => {
              const req = https.get(ttsUrl, {
                headers: {
                  "User-Agent": userAgent,
                  "Referer": EXTERNAL_URLS.GOOGLE_TRANSLATE_REFERER,
                  "Accept": "*/*",
                  "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"
                }
              }, (resHttps) => {
                if (resHttps.statusCode && resHttps.statusCode === 200) {
                  const chunksH: any[] = [];
                  resHttps.on('data', (c) => chunksH.push(c));
                  resHttps.on('end', () => resolveNoFetch(Buffer.concat(chunksH)));
                } else {
                  rejectNoFetch(new Error(`${getBackendMsg('HTTP_STATUS_ERROR', targetLang === 'vi')}${resHttps.statusCode}`));
                }
              });
              req.on('error', (e) => rejectNoFetch(e));
            });
            return buffer;
          } catch (httpsErr) {
            lastError = httpsErr;
          }
        }
        retries--;
        if (retries > 0) {
          await new Promise((r) => setTimeout(r, 100));
        }
      }
    }
    throw new Error(getBackendMsg('GOOGLE_TTS_FAILED', targetLang === 'vi').replace('{0}', lastError?.message || ''));
  };

  const chunkBuffers: Buffer[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    appLog('GOOGLE_TTS_FALLBACK_SYNTHESIZING', i + 1, chunks.length, chunk.length);
    try {
      const buffer = await fetchBufferWithRetry(chunk);
      chunkBuffers.push(buffer);
    } catch (err: any) {
      appError('GOOGLE_TTS_FALLBACK_FETCH_FAILED', i + 1, err?.message || err);

      try {
        const retryBuffer = await fetchBufferWithRetry(chunk);
        chunkBuffers.push(retryBuffer);
      } catch (retryErr) {
        appError('GOOGLE_TTS_FALLBACK_CRITICAL', i + 1);

        chunkBuffers.push(Buffer.alloc(0));
      }
    }

    if (i < chunks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
  }

  const stitchedBuffer = Buffer.concat(chunkBuffers);

  return {
    base64: stitchedBuffer.toString('base64'),
    mimeType: 'audio/mpeg'
  };
};

export async function initPlaywright(headless?: boolean) {
  try {
    appLog('PLAYWRIGHT_CONNECTING');


    const browser = await chromium.connectOverCDP(EXTERNAL_URLS.PLAYWRIGHT_CDP);


    const defaultContext = browser.contexts()[0];
    const page = defaultContext.pages()[0] || await defaultContext.newPage();

    // Prevent "ReferenceError: __name is not defined" in page.evaluate or waitForFunction under tsx/esbuild bundling
    await page.addInitScript(`
      if (typeof window !== 'undefined' && !window.__name) {
        window.__name = (target, value) => {
          try {
            Object.defineProperty(target, "name", { value, configurable: true });
          } catch (e) {}
          return target;
        };
      }
    `);

    page.on('request', request => {
      const headers = request.headers();
      if (headers['authorization'] && request.url().includes('aisandbox-pa.googleapis.com')) {
        globalBearerToken = headers['authorization'];
        (global as any).globalGoogleHeaders = headers;
      }
    });

    appLog('PLAYWRIGHT_ACCESSING_LABS');
    await page.goto(EXTERNAL_URLS.GOOGLE_LABS, { waitUntil: 'networkidle' });

    if (!globalBearerToken) {
      appLog('PLAYWRIGHT_LOGIN_PROMPT');

      page.waitForResponse(response => response.url().includes('googleapis.com'), { timeout: 300000 })
        .then(() => appLog('PLAYWRIGHT_TOKEN_CAPTURED'))
        .catch(() => appLog('PLAYWRIGHT_TOKEN_TIMEOUT'));
    } else {
      appLog('PLAYWRIGHT_TOKEN_CAPTURED');
    }

    globalPlaywrightPage = page;
  } catch (e) {
    appError('PLAYWRIGHT_CONNECT_ERR', e?.message || e);
    appLog('PLAYWRIGHT_BORDER');
    appLog('PLAYWRIGHT_CHROME_MANDATE');
    appLog('PLAYWRIGHT_CHROME_COMMAND');
    appLog('PLAYWRIGHT_BORDER_BOTTOM');
  }
}

export async function closePlaywright() {
  if (globalPlaywrightPage) {
    try {
      await globalPlaywrightPage.close();
    } catch (e) { }
    globalPlaywrightPage = null;
  }
}
