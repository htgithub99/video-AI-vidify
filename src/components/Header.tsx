import { useState } from "react";
import { Lang, translations } from "../lib/lang.js";
import { getStoredApiKey } from "../lib/shared-utils.js";
import { STORAGE_KEYS, DEFAULT_PROJECT_ID, DEFAULT_SESSION_ID, CURL_AUTHORIZATION_BEARER_REGEX, CURL_AUTHORIZATION_JSON_REGEX, CURL_BEARER_TOKEN_REGEX, CURL_PROJECT_ID_BODY_REGEX, CURL_PROJECT_ID_URL_REGEX, CURL_CLIENT_SESSION_ID_REGEX, CURL_SESSION_ID_REGEX, CURL_RECAPTCHA_TOKEN_REGEX, CURL_AGENT_SESSION_ID_REGEX } from "../constants";
import { appError } from "../lib/logger.js";
import { Video, Coins, TrendingUp, Sliders, Save, CheckCircle2, Shield, X, Moon, Sun, Key } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/Button";

interface HeaderProps {
  currentLang: Lang;
  setLang: (lang: Lang) => void;
  credits: number;
  costTracker: number;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export default function Header({ currentLang, setLang, credits, costTracker, theme, toggleTheme }: HeaderProps) {
  const t = translations[currentLang];
  const [showConfig, setShowConfig] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [curlInput, setCurlInput] = useState("");
  const [curlFeedback, setCurlFeedback] = useState<string | null>(null);

  const [showKeysConfig, setShowKeysConfig] = useState(false);
  const [geminiKey, setGeminiKey] = useState(() => getStoredApiKey("GEMINI_API_KEY"));
  const [ai33Key, setAi33Key] = useState(() => getStoredApiKey("AI33_API_KEY"));
  const [keysSavedSuccess, setKeysSavedSuccess] = useState(false);
  const [isSavingKeys, setIsSavingKeys] = useState(false);

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

  const handleSaveConfig = () => {
    saveConfigHelper({ [STORAGE_KEYS.API_SANDBOX_CONFIG]: JSON.stringify(config) }, setIsSaving, setSavedSuccess);
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

      const isStreamChat = val.includes("flowCreationAgent:streamChat") || val.includes("streamChat");

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
      setCurlFeedback(currentLang === "vi" ? `✓ Đã trích xuất thành công: ${parsedAuthToken ? "Bearer, " : ""}${parsedRecaptcha ? "reCAPTCHA, " : ""}${isStreamChat ? "Kiểu StreamChat (SSE)" : "Kiểu Batch"}` : `✓ Successfully parsed: ${parsedAuthToken ? "Bearer, " : ""}${parsedRecaptcha ? "reCAPTCHA, " : ""}${isStreamChat ? "StreamChat (SSE)" : "Batch"}`);
      setTimeout(() => setCurlFeedback(null), 5000);
    } catch (e) {
      appError("GENERAL_ERROR", e);
      setCurlFeedback(t.Failed_to_parse_cURL_comm);
    }
  };

  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.API_SANDBOX_CONFIG);
      if (saved && saved.trim() !== "undefined" && saved.trim() !== "null" && saved.trim() !== "") {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return {
            projectId: parsed.projectId || DEFAULT_PROJECT_ID,
            authToken: parsed.authToken || "",
            recaptchaToken: parsed.recaptchaToken || "",
            sessionId: parsed.sessionId || DEFAULT_SESSION_ID,
            imageModelName: parsed.imageModelName || "NARWHAL",
            agentSessionId: parsed.agentSessionId || "",
            isStreamChat: parsed.isStreamChat !== undefined ? parsed.isStreamChat : false,
          };
        }
      }
    } catch (e) {
      appError("ERROR_PARSING_SANDBOX_HEADER", e);
    }
    return {
      projectId: DEFAULT_PROJECT_ID,
      authToken: "",
      recaptchaToken: "",
      sessionId: "",
      imageModelName: "NARWHAL",
    };
  });

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-200 sticky top-0 z-50 shadow-sm flex-shrink-0">
      <div className="w-full max-w-[100vw] xl:max-w-screen-2xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between gap-4 relative">
        {}
        <div className="flex items-center gap-3">
          <div className="p-1.5 sm:p-2 bg-rose-600 rounded-lg flex items-center justify-center shadow-md">
            <Video className="w-4 h-4 sm:w-5 sm:h-5 text-slate-100" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-slate-100 flex items-center gap-2 font-logo">
              {t.appTitle}
              <span className="text-[10px] bg-rose-500/10 text-rose-400 font-bold px-1.5 py-0.5 rounded border border-rose-500/20 tracking-tighter">{t.v2_4_PRO}</span>
            </h1>
            <p className="hidden sm:block text-[10px] text-slate-400 font-medium tracking-wide">{t.appSubtitle}</p>
          </div>
        </div>

        {}
        <div className="flex items-center justify-end gap-2 sm:gap-3 flex-1 overflow-x-auto no-scrollbar">
          {}
          <div className="hidden md:flex items-center gap-2 mr-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse"></div>
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">{t.Live_Sync}</span>
          </div>

          {}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg px-2.5 py-1.5 text-xs">
            <Coins className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-mono font-medium text-rose-400">
              {credits.toLocaleString()} {t.pts}
            </span>
          </div>

          {}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg px-2.5 py-1.5 text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-green-400" />
            <span className="font-mono font-medium text-green-400">
              ${costTracker.toFixed(4)} {t.USD}
            </span>
          </div>

          {}
          <Button
            variant={showKeysConfig ? "outline" : "secondary"}
            size="sm"
            onClick={() => {
              setShowKeysConfig(!showKeysConfig);
              setShowConfig(false);
            }}
            className={`relative shrink-0 ${showKeysConfig ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20" : ""}`}
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">API Keys</span>
            {(geminiKey || ai33Key) && <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full"></span>}
          </Button>

          {}
          <Button
            variant={showConfig ? "outline" : "secondary"}
            size="sm"
            onClick={() => {
              setShowConfig(!showConfig);
              setShowKeysConfig(false);
            }}
            className={`relative shrink-0 ${showConfig ? "bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20" : ""}`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.Sandbox}</span>
            {showConfig && <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full"></span>}
          </Button>

          {}
          <Button 
            variant="secondary" 
            size="xs" 
            onClick={toggleTheme} 
            className="p-1.5 bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-100 hover:bg-slate-700 shrink-0 shadow-none"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {}
          <div className="flex items-center bg-slate-800/50 border border-slate-700/50 rounded-lg p-0.5 shrink-0">
            <Button 
              variant="ghost" 
              size="xs" 
              onClick={() => setLang("vi")} 
              className={`px-2 py-1 text-[10px] rounded-md shadow-none ${currentLang === "vi" ? "bg-slate-700 text-slate-100 hover:bg-slate-600" : "text-slate-400 hover:text-slate-200 hover:bg-transparent"}`}
            >
              {t.VI}
            </Button>
            <Button 
              variant="ghost" 
              size="xs" 
              onClick={() => setLang("en")} 
              className={`px-2 py-1 text-[10px] rounded-md shadow-none ${currentLang === "en" ? "bg-slate-700 text-slate-100 hover:bg-slate-600" : "text-slate-400 hover:text-slate-200 hover:bg-transparent"}`}
            >
              {t.EN}
            </Button>
          </div>
        </div>

        {}
        <AnimatePresence>
          {}
          {showConfig && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} className="absolute top-[120px] right-4 lg:right-8 w-[calc(100vw_-_32px)] sm:w-[540px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-[100]">
              <div className="p-4 sm:p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-xl">
                      <Shield className="w-4 h-4 text-rose-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                        {t.Sandbox_Config}
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">{t.Active}</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{t.Unlimited_Proxy}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {savedSuccess && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1.5 text-xs text-green-500 font-medium bg-green-500/10 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t.Saved}</span>
                      </motion.div>
                    )}
                    <Button variant="ghost" size="xs" onClick={() => setShowConfig(false)} className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg shadow-none">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80">
                    <label className="text-xs font-semibold text-slate-350 block mb-2 flex items-center gap-2">
                      <span>{t.Paste_cURL_from_Chrome_F1}</span>
                    </label>
                    <textarea value={curlInput} onChange={(e) => handleCurlPaste(e.target.value)} placeholder={t.Paste_full_cURL} rows={4} className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-300 p-3 rounded-lg focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 font-mono resize-none transition-all" />
                    {curlFeedback && <div className={`mt-2 text-xs font-medium ${curlFeedback.startsWith("✓") ? "text-emerald-500" : "text-rose-500"}`}>{curlFeedback}</div>}
                  </div>

                  <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">{t.Extracted_Parameters}</h4>
                      <div className="space-y-3.5 text-xs font-mono">
                        <div className="flex flex-col border-b border-slate-800/60 pb-2 gap-1 text-left">
                          <span className="text-slate-500 font-semibold">{t.Authorization}</span>
                          <span className={config.authToken ? "text-emerald-400 break-all" : "text-rose-400 break-all"}>{config.authToken ? `${config.authToken.slice(0, 30)}...` : "N/A"}</span>
                        </div>
                        <div className="flex flex-col border-b border-slate-800/60 pb-2 gap-1 text-left">
                          <span className="text-slate-500 font-semibold">{t.Project_ID}</span>
                          <span className="text-slate-300 break-all">{config.projectId || "N/A"}</span>
                        </div>
                        <div className="flex flex-col border-b border-slate-800/60 pb-2 gap-1 text-left">
                          <span className="text-slate-500 font-semibold">{t.Session_ID}</span>
                          <span className="text-slate-300 break-all">{config.sessionId || "N/A"}</span>
                        </div>
                        <div className="flex justify-between items-center text-left pt-1">
                          <span className="text-slate-500 font-semibold">{t.API_Mode}</span>
                          <span className="text-slate-300 bg-slate-800 px-2 py-0.5 rounded text-[10px]">{config.isStreamChat ? "SSE Stream" : "Batch"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button variant="primary" onClick={handleSaveConfig} disabled={isSaving} className="w-full sm:w-auto">
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {t.Saving}
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            {t.Save_Config}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {}
          {showKeysConfig && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} className="absolute top-[120px] right-4 lg:right-8 w-[calc(100vw_-_32px)] sm:w-[540px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-[100]">
              <div className="p-4 sm:p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-xl">
                      <Key className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                        {currentLang === "vi" ? "Cấu hình API Keys" : "API Keys Configuration"}
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full font-medium">{geminiKey || ai33Key ? (currentLang === "vi" ? "Đã nhập" : "Configured") : currentLang === "vi" ? "Chưa cấu hình" : "Not Set"}</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{currentLang === "vi" ? "Các key này sẽ được ưu tiên sử dụng trước các cấu hình trong file .env" : "These keys take precedence over options in your .env file"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {keysSavedSuccess && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1.5 text-xs text-green-500 font-medium bg-green-500/10 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t.Saved}</span>
                      </motion.div>
                    )}
                    <Button variant="ghost" size="xs" onClick={() => setShowKeysConfig(false)} className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg shadow-none">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-350 block">GEMINI_API_KEY</label>
                    <input
                      type="password"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder={currentLang === "vi" ? "Nhập Google Gemini API Key..." : "Enter Google Gemini API Key..."}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 font-mono transition-all"
                    />
                  </div>

                  <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-350 block">AI33_API_KEY</label>
                    <input type="password" value={ai33Key} onChange={(e) => setAi33Key(e.target.value)} placeholder={currentLang === "vi" ? "Nhập AI33 TTS Token..." : "Enter AI33 TTS Token..."} className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 font-mono transition-all" />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="primary" onClick={handleSaveKeys} disabled={isSavingKeys} className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold">
                    {isSavingKeys ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t.Saving}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {t.Save_Config}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
