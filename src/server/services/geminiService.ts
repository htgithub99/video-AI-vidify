import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();
import { requestContext } from '../utils/requestContext.js';

export { GoogleGenAI };

export function isGeminiApiKeyAvailable(): boolean {
  const store = requestContext.getStore();
  return !!(store?.geminiKey || process.env.GEMINI_API_KEY);
}

let currentModelIndex = 0;
const AVAILABLE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.1-pro-preview',
];


export async function generateContentWithRetry(params: {
  contents: string | any;
  config?: any;
}, retries = 3, delayMs = 1200): Promise<any> {
  const store = requestContext.getStore();
  const activeApiKey = store?.geminiKey || process.env.GEMINI_API_KEY || '';

  const clientAi = activeApiKey
    ? new GoogleGenAI({
      apiKey: activeApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
    : null;

  let lastError: any = null;
  const startIndex = currentModelIndex;
  const rotationLogs: string[] = [];
  
  const logStep = (msg: string) => {
    console.log(msg);
    rotationLogs.push(msg);
  };
  
  logStep(`[Gemini SDK] Bắt đầu tiến trình gọi AI. Sẽ thử xoay vòng qua ${AVAILABLE_MODELS.length} models, bắt đầu từ index ${startIndex}.`);

  for (let i = 0; i < AVAILABLE_MODELS.length; i++) {
    
    const modelIndex = (startIndex + i) % AVAILABLE_MODELS.length;
    const model = AVAILABLE_MODELS[modelIndex];

    console.log(`\n[Gemini SDK] ----------------------------------------------------`);
    logStep(`[Gemini SDK] Đang gọi model vòng ${i + 1}/${AVAILABLE_MODELS.length}: ${model} (Index: ${modelIndex})`);

    let attempt = 0;
    while (attempt <= retries) {
      try {
        if (!clientAi) {
          throw new Error('GoogleGenAI SDK is not initialized.');
        }

        const response = await clientAi.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config,
        });

        logStep(`[Gemini SDK] ✅ THÀNH CÔNG với model: ${model} sau ${attempt + 1} lần thử.`);
        
        currentModelIndex = modelIndex;
        
        
        
        
        if (modelIndex !== 0) {
          setTimeout(() => {
            currentModelIndex = 0;
          }, 3 * 60 * 1000); 
        }

        
        (response as any).rotationLogs = rotationLogs;
        return response;
      } catch (error: any) {
        lastError = error;
        attempt++;

        const errorStr = error?.toString() || '';
        const errorMessage = error?.message || '';
        
        logStep(`[Gemini SDK] ❌ LỖI với model ${model} (Lần thử ${attempt}): ${errorMessage}`);

        // Check if the error is a definitive "Unsupported model" error (404/not found), which means we should immediately switch models
        const isUnsupportedModel =
          errorMessage.includes('not found') ||
          errorMessage.includes('404') ||
          errorMessage.includes('unsupported') ||
          errorStr.includes('not found') ||
          errorStr.includes('404') ||
          errorStr.includes('unsupported') ||
          errorStr.includes('Quota exceeded') ||
          errorMessage.includes('Quota exceeded');

        if (isUnsupportedModel) {
          logStep(`[Gemini SDK] ⚠️ Model ${model} is unsupported, out of quota, or not found. FAST-FALLING BACK TO NEXT MODEL...`);
          break; 
        }

        
        const isRetryable =
          error?.status === 'RESOURCE_EXHAUSTED' ||
          errorMessage.includes('429') ||
          errorStr.includes('429') ||
          errorStr.includes('quota') ||
          error?.status === 'UNAVAILABLE' ||
          errorMessage.includes('503') ||
          errorStr.includes('503') ||
          errorMessage.includes('500') ||
          errorStr.includes('550') ||
          errorMessage.includes('fetch failed') ||
          errorMessage.includes('Timeout') ||
          errorStr.includes('fetch failed') ||
          errorStr.includes('undici');

        if (attempt <= retries && isRetryable) {
          logStep(`[Gemini SDK] ⏳ Lỗi có thể phục hồi. Retrying model ${model} in ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          delayMs *= 1.5; 
          continue;
        }

        
        logStep(`[Gemini SDK] 💀 Model ${model} hoàn toàn thất bại. Bỏ qua và xoay sang model tiếp theo...`);
        break; 
      }
    }

    if (i < AVAILABLE_MODELS.length - 1) {
      logStep(`[Gemini SDK] ⏳ Đang chờ 2 giây trước khi chuyển sang model tiếp theo để tránh quá tải...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const finalError = lastError || new Error('GenerateContent failed for all models');
  finalError.rotationLogs = rotationLogs;
  logStep(`[Gemini SDK] 🚨 ĐÃ THỬ TOÀN BỘ ${AVAILABLE_MODELS.length} MODELS NHƯNG ĐỀU THẤT BẠI! TIẾN TRÌNH BỊ DỪNG HOÀN TOÀN.`);
  throw finalError;
}