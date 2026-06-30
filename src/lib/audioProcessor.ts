import { appWarn, createAppError } from "./logger.js";

export const bufferToWav = (buffer: AudioBuffer): Blob => {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; 
  const bitDepth = 16;
  
  let result: Float32Array;
  if (numOfChan === 2) {
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
    result = buffer.getChannelData(0);
  }
  
  const bufferLength = result.length * 2; 
  const totalLength = 44 + bufferLength;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);
  
    writeString(view, 0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
    view.setUint16(32, numOfChan * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, bufferLength, true);
  
  
  floatTo16BitPCM(view, 44, result);
  
  return new Blob([arrayBuffer], { type: "audio/wav" });
};

const interleave = (inputL: Float32Array, inputR: Float32Array): Float32Array => {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);
  let index = 0;
  let inputIndex = 0;
  
  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
};

const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array): void => {
  let off = offset;
  for (let i = 0; i < input.length; i++, off += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
};

const writeString = (view: DataView, offset: number, string: string): void => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

export const applyAudioEffects = async (
  arrayBuffer: ArrayBuffer,
  rate: number,
  pitch: number,
  volume: number
): Promise<Blob> => {
  
  if (Math.abs(rate - 1.0) < 0.01 && Math.abs(pitch - 1.0) < 0.01 && Math.abs(volume - 1.0) < 0.01) {
    const uint8 = new Uint8Array(arrayBuffer, 0, 4);
    const isWav = uint8[0] === 0x52 && uint8[1] === 0x49 && uint8[2] === 0x46 && uint8[3] === 0x46; 
    const mimeType = isWav ? "audio/wav" : "audio/mpeg";
    return new Blob([arrayBuffer], { type: mimeType });
  }

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw createAppError("Web Audio API is not supported in this browser.");
  }
  
  const audioCtx = new AudioContextClass();
  if (audioCtx.state === 'suspended') {
    try {
      await audioCtx.resume();
    } catch (e) {
      appWarn("FAILED_RESUME_AUDIO_CONTEXT", e);
    }
  }
  
  try {
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    
    
    
    const combinedRate = Math.max(0.5, Math.min(2.0, rate * pitch));
    
    const targetLength = Math.max(1, Math.ceil(decodedBuffer.length / combinedRate));
    
    const OfflineAudioCtxClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    const offlineCtx = new OfflineAudioCtxClass(
      decodedBuffer.numberOfChannels,
      targetLength,
      decodedBuffer.sampleRate
    );
    
    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.playbackRate.value = combinedRate;
    
    const gainNode = offlineCtx.createGain();
    gainNode.gain.setValueAtTime(volume, 0);
    
    source.connect(gainNode);
    gainNode.connect(offlineCtx.destination);
    
    source.start(0);
    
    const finalBuffer = await offlineCtx.startRendering();
    
    return bufferToWav(finalBuffer);
  } finally {
    await audioCtx.close();
  }
};

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        if (base64) {
          resolve(base64);
        } else {
          resolve(reader.result);
        }
      } else {
        reject(createAppError("File read error"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
};

export const formatTimeHelper = (secs: number): string => {
  const minutes = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  const rSecsFormatted = remainingSecs % 1 === 0 
    ? remainingSecs.toFixed(0).padStart(2, '0') 
    : parseFloat(remainingSecs.toFixed(1)).toString().padStart(2, '0');
  
  return `${minutes.toString().padStart(2, '0')}:${rSecsFormatted}`;
};

export const cleanScriptText = (text: string): string => {
  if (!text) return '';
  let t = text;
  // Xóa văn bản thừa của AI
  t = t.replace(/^(Dưới đây là|Đây là|Tuyệt vời|Chắc chắn|Sau đây là|Tôi đã tạo|Hãy cùng xem|Chào bạn).*:?\n?/i, '');
  t = t.replace(/(Chắc chắn rồi|Vâng|Được chứ).*?\n/i, '');
  // Xóa ký tự đặc biệt, dấu ngoặc vuông, ngoặc đơn
  t = t.replace(/[\*\#\_\-\[\]\(\)]/g, ' ');
  // Xóa emoji
  t = t.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  // Chuẩn hóa khoảng trắng
  t = t.replace(/\s+/g, ' ').trim();
  return t;
};


