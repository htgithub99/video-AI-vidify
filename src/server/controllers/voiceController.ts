import { Request, Response } from 'express';

import { EXTERNAL_URLS } from '../../constants/apiRoutes.js';
import { BACKEND_MESSAGES } from '../../constants/messages.js';
import { requestContext } from '../utils/requestContext.js';

export const getVoices = async (req: Request, res: Response) => {
  try {
    const queryParams = new URLSearchParams(req.query as any).toString();
    const targetUrl = `${EXTERNAL_URLS.AI33_VOICES}?${queryParams}`;
    const store = requestContext.getStore();
    const apiKey = store?.ai33Key || process.env.AI33_API_KEY || 'eyJhbGciOiJIUzI1NiIsImtpZCI6ImZ0UTF2dE1kNHArNG41SUYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3hwa2NhcHFxYnJraHNwcmJxb2NiLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIxYTFlZjhjOC1hN2Q4LTRkYzMtYmRjMy1kYmZjODI1MGMzZmMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzgyOTc1MDQyLCJpYXQiOjE3ODIzNzAyNDIsImVtYWlsIjoibGVldm90aWkxMjM0QGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSXhxOHJVNXlTU0NuRDJxLU15TEtfZ2NJcm5wNkRTUkNDZXZHbjFmRW9SVUhHXzNuTVhQQT1zOTYtYyIsImVtYWlsIjoibGVldm90aWkxMjM0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJUb8OgbiBMZW8iLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoiVG_DoG4gTGVvIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSXhxOHJVNXlTU0NuRDJxLU15TEtfZ2NJcm5wNkRTUkNDZXZHbjFmRW9SVUhHXzNuTVhQQT1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTE0MjcxMzQ3Mzk5OTQ1MjYwMzkxIiwic3ViIjoiMTE0MjcxMzQ3Mzk5OTQ1MjYwMzkxIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib2F1dGgiLCJ0aW1lc3RhbXAiOjE3NjQ5OTMyNzB9XSwic2Vzc2lvbl9pZCI6IjY0ZjhjZDllLTMzNTItNDI5Zi1hYTYyLWZhMjg5OWNhNWUzNCIsImlzX2Fub255bW91cyI6ZmFsc2V9.Rsut9S1qJEUqimObZXDTd4a7QLwMVhHTBvfxWy9FjY0';

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'xi-api-key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error(BACKEND_MESSAGES.FETCH_VOICES_ERR, error);
    res.status(500).json({ error: error.message, rotationLogs: error.rotationLogs });
  }
};
