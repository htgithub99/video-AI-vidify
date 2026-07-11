import { cn } from "../lib/utils";
import { useState } from "react";
import { Lang, translations } from "../lib/lang.js";
import { getStoredApiKey } from "../lib/shared-utils.js";
import { STORAGE_KEYS, DEFAULT_PROJECT_ID, DEFAULT_SESSION_ID, CURL_AUTHORIZATION_BEARER_REGEX, CURL_AUTHORIZATION_JSON_REGEX, CURL_BEARER_TOKEN_REGEX, CURL_PROJECT_ID_BODY_REGEX, CURL_PROJECT_ID_URL_REGEX, CURL_CLIENT_SESSION_ID_REGEX, CURL_SESSION_ID_REGEX, CURL_RECAPTCHA_TOKEN_REGEX, CURL_AGENT_SESSION_ID_REGEX, COMMON_STRINGS, SETTINGS_TEXTS, CURL_KEYWORDS } from "../constants";
import { appError } from "../lib/logger.js";
import { Key, Shield, Save, CheckCircle2, Server } from "lucide-react";
import { Button } from "./ui/Button";

interface SettingsViewProps {
  currentLang: Lang;
}

export default function SettingsView({ currentLang }: SettingsViewProps) {
  const t = translations[currentLang];
  const pageTexts = SETTINGS_TEXTS[currentLang as "vi" | "en"] || SETTINGS_TEXTS.en;

  const [geminiKey, setGeminiKey] = useState(() => getStoredApiKey("GEMINI_API_KEY"));
  const [ai33Key, setAi33Key] = useState(() => getStoredApiKey("AI33_API_KEY"));
  const [keysSavedSuccess, setKeysSavedSuccess] = useState(false);
  const [isSavingKeys, setIsSavingKeys] = useState(false);

  const [curlInput, setCurlInput] = useState("");
  const [curlFeedback, setCurlFeedback] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.API_SANDBOX_CONFIG);
      if (saved && ![COMMON_STRINGS.UNDEFINED, COMMON_STRINGS.NULL, ""].includes(saved.trim())) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return {
            projectId: parsed.projectId || DEFAULT_PROJECT_ID,
            authToken: parsed.authToken || "",
            recaptchaToken: parsed.recaptchaToken || "",
            sessionId: parsed.sessionId || DEFAULT_SESSION_ID,
            imageModelName: parsed.imageModelName || CURL_KEYWORDS.NARWHAL,
            agentSessionId: parsed.agentSessionId || "",
            isStreamChat: parsed.isStreamChat !== undefined ? parsed.isStreamChat : false,
          };
        }
      }
    } catch (e) {
      appError("ERROR_PARSING_SANDBOX_SETTINGS", e);
    }
    return {
      projectId: DEFAULT_PROJECT_ID,
      authToken: "",
      recaptchaToken: "",
      sessionId: "",
      imageModelName: CURL_KEYWORDS.NARWHAL,
      agentSessionId: "",
      isStreamChat: false,
    };
  });

  const saveConfigHelper = (keysToSave: Record<string, string>, setSavingState: (saving: boolean) => void, setSuccessState: (success: boolean) => void) => {
    setSavingState(true);
    setTimeout(() => {
      Object.entries(keysToSave).forEach(([key, val]) => {
        localStorage.setItem(key, val);
      });
      window.dispatchEvent(new Event("storage"));
      setSavingState(false);
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
      }, 2500);
    }, 850);
  };

  const handleSaveKeys = () => {
    saveConfigHelper(
      {
        [STORAGE_KEYS.GEMINI_API_KEY]: geminiKey.trim(),
        [STORAGE_KEYS.AI33_API_KEY]: ai33Key.trim(),
      },
      setIsSavingKeys,
      setKeysSavedSuccess,
    );
  };

  const handleSaveConfig = () => {
    saveConfigHelper({ [STORAGE_KEYS.API_SANDBOX_CONFIG]: JSON.stringify(config) }, setIsSavingConfig, setSavedSuccess);
  };

  const handleCurlPaste = (val: string) => {
    setCurlInput(val);
    if (!val.trim()) return;

    try {
      const authMatch = val.match(CURL_AUTHORIZATION_BEARER_REGEX);
      let parsedAuthToken = "";
      if (authMatch) {
        parsedAuthToken = authMatch[1].trim();
      } else {
        const rawMatch = val.match(CURL_AUTHORIZATION_JSON_REGEX);
        if (rawMatch) parsedAuthToken = rawMatch[1].trim();
      }

      if (!parsedAuthToken) {
        const bearerMatch = val.match(CURL_BEARER_TOKEN_REGEX);
        if (bearerMatch) parsedAuthToken = bearerMatch[1].trim();
      }

      let parsedProjectId = "";
      const projMatchBody = val.match(CURL_PROJECT_ID_BODY_REGEX);
      if (projMatchBody) {
        parsedProjectId = projMatchBody[2];
      } else {
        const urlProjMatch = val.match(CURL_PROJECT_ID_URL_REGEX);
        if (urlProjMatch) parsedProjectId = urlProjMatch[1];
      }

      let parsedSessionId = "";
      const sessMatch = val.match(CURL_CLIENT_SESSION_ID_REGEX);
      if (sessMatch) {
        parsedSessionId = sessMatch[1];
      } else {
        const sessMatch2 = val.match(CURL_SESSION_ID_REGEX);
        if (sessMatch2) parsedSessionId = sessMatch2[1];
      }

      let parsedRecaptcha = "";
      const recaptchaMatch = val.match(CURL_RECAPTCHA_TOKEN_REGEX);
      if (recaptchaMatch) parsedRecaptcha = recaptchaMatch[1];

      let parsedAgentSessionId = "";
      const agentSessMatch = val.match(CURL_AGENT_SESSION_ID_REGEX);
      if (agentSessMatch) parsedAgentSessionId = agentSessMatch[1];

      const isStreamChat = [CURL_KEYWORDS.STREAM_AGENT, CURL_KEYWORDS.STREAM].some(k => val.includes(k));

      const updated = {
        ...config,
        ...(parsedAuthToken && { authToken: parsedAuthToken }),
        ...(parsedProjectId && { projectId: parsedProjectId }),
        ...(parsedSessionId && { sessionId: parsedSessionId }),
        ...(parsedRecaptcha && { recaptchaToken: parsedRecaptcha }),
        ...(parsedAgentSessionId && { agentSessionId: parsedAgentSessionId }),
        isStreamChat: isStreamChat,
      };

      setConfig(updated);
      setCurlFeedback(`${t.ext_success_extract} ${parsedAuthToken ? t.ext_bearer : ""}${parsedRecaptcha ? t.ext_recaptcha : ""}${isStreamChat ? t.ext_streamchat : t.ext_batch}`);
      setTimeout(() => setCurlFeedback(null), 5000);
    } catch (e) {
      appError("GENERAL_ERROR", e);
      setCurlFeedback(t.Failed_to_parse_cURL_comm);
    }
  };

  return (
    <div className="flex-grow h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto space-y-6 text-left">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
        <h2 className="text-base font-black tracking-tight text-slate-100 flex items-center gap-2 uppercase font-mono">
          <Key className="w-5 h-5 text-rose-500" />
          {pageTexts.TITLE}
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          {pageTexts.DESC}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-slate-800 rounded-xl">
                <Key className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-200 uppercase font-mono tracking-wider">{t.apiKeysConfig}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{geminiKey || ai33Key ? t.configured : t.notSet}</p>
              </div>
            </div>

            {keysSavedSuccess && (
              <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold bg-green-500/10 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.Saved}</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-extrabold text-slate-400 font-mono uppercase block tracking-wider">GEMINI_API_KEY</label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder={t.enterGeminiKey}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-extrabold text-slate-400 font-mono uppercase block tracking-wider">AI33_API_KEY</label>
              <input
                type="password"
                value={ai33Key}
                onChange={(e) => setAi33Key(e.target.value)}
                placeholder={t.enterAi33Key}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <Button
              variant="primary"
              onClick={handleSaveKeys}
              disabled={isSavingKeys}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs px-4 py-2"
            >
              {isSavingKeys ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t.Saving}</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{t.Save_Config}</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-slate-800 rounded-xl">
                <Shield className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-200 uppercase font-mono tracking-wider">
                  {pageTexts.SANDBOX_TITLE}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{t.Unlimited_Proxy}</p>
              </div>
            </div>

            {savedSuccess && (
              <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold bg-green-500/10 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.Saved}</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-extrabold text-slate-400 font-mono uppercase block tracking-wider">
                {t.Paste_cURL_from_Chrome_F1}
              </label>
              <textarea
                value={curlInput}
                onChange={(e) => handleCurlPaste(e.target.value)}
                placeholder={t.Paste_full_cURL}
                rows={3}
                className="w-full bg-slate-955 border border-slate-800 hover:border-slate-700 focus:border-rose-500/50 rounded-xl p-3 text-xs text-slate-350 font-mono focus:outline-none transition-all resize-none leading-relaxed"
              />
              {curlFeedback && (
                <div className={cn(`text-[10px] font-bold ${[COMMON_STRINGS.SUCCESS_MARK, COMMON_STRINGS.SUCCESS_KEYWORD_VI].some(k => curlFeedback.includes(k)) ? "text-emerald-500" : "text-rose-500"}`)}>
                  {curlFeedback}
                </div>
              )}
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4.5 space-y-3 font-mono text-[10px] text-slate-350 select-text">
              <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1 shrink-0 select-none">
                <Server className="w-3 h-3 text-rose-500" />
                {t.Extracted_Parameters}
              </h4>
              <div className="flex flex-col border-b border-slate-850 pb-2 gap-0.5 text-left">
                <span className="text-slate-550 font-bold">{t.Authorization}</span>
                <span className={config.authToken ? "text-emerald-500 break-all select-all font-semibold" : "text-rose-500/80 break-all select-all"}>
                  {config.authToken ? `${config.authToken.slice(0, 30)}...` : COMMON_STRINGS.NA}
                </span>
              </div>
              <div className="flex flex-col border-b border-slate-850 pb-2 gap-0.5 text-left">
                <span className="text-slate-550 font-bold">{t.Project_ID}</span>
                <span className="text-slate-300 select-all">{config.projectId || COMMON_STRINGS.NA}</span>
              </div>
              <div className="flex flex-col border-b border-slate-850 pb-2 gap-0.5 text-left">
                <span className="text-slate-550 font-bold">{t.Session_ID}</span>
                <span className="text-slate-300 select-all">{config.sessionId || COMMON_STRINGS.NA}</span>
              </div>
              <div className="flex justify-between items-center text-left pt-1">
                <span className="text-slate-550 font-bold">{t.API_Mode}</span>
                <span className="text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[9px] font-bold">
                  {config.isStreamChat ? "SSE Stream" : "Batch"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <Button
              variant="primary"
              onClick={handleSaveConfig}
              disabled={isSavingConfig}
              className="text-xs font-bold px-4 py-2"
            >
              {isSavingConfig ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t.Saving}</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{t.Save_Config}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
