import { cn } from "../lib/utils";
import { useState, useEffect } from "react";
import { Lang, translations } from "../lib/lang.js";
import { API_ROUTES, STORAGE_KEYS, CURL_AUTHORIZATION_BEARER_REGEX, CURL_AUTHORIZATION_JSON_REGEX, CURL_BEARER_TOKEN_REGEX, CURL_PROJECT_ID_BODY_REGEX, CURL_PROJECT_ID_URL_REGEX, CURL_CLIENT_SESSION_ID_REGEX, CURL_SESSION_ID_REGEX, CURL_RECAPTCHA_TOKEN_REGEX, CURL_AGENT_SESSION_ID_REGEX, COMMON_STRINGS, SETTINGS_TEXTS, CURL_KEYWORDS, REFACTOR_CONSTANTS } from "../constants";
import { appError } from "../lib/logger.js";
import { Key, Shield, Save, CheckCircle2, Server, Trash2, AlertTriangle, LogOut, KeyRound, Users, Plus, X } from "lucide-react";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { Tooltip } from "./ui/Tooltip";
import _ from "lodash";
import { storageUtils } from "../lib/storage";
import { jsonUtils } from "../lib/json";
import { useLicense } from "../contexts/LicenseContext";
import { SecurityConstants, SecurityMessages } from "../constants/security";
import { AppLanguage } from "../constants/enums";

const CLEAR_TYPES = {
  API: "API",
  SANDBOX: "SANDBOX",
} as const;

type ClearType = typeof CLEAR_TYPES[keyof typeof CLEAR_TYPES];

const SETTINGS_CONSTS = {
  FEEDBACK_TIMEOUT: 5000,
  MOCK_SAVE_DELAY: 850,
  SUCCESS_STATE_DURATION: 2500,
} as const;

interface SettingsViewProps {
  currentLang: Lang;
}

export default function SettingsView({ currentLang }: SettingsViewProps) {
  const t = translations[currentLang];
  const pageTexts = SETTINGS_TEXTS[currentLang as "vi" | "en"] || SETTINGS_TEXTS.en;
  const { licenseKey, licenseInfo, logoutLicense } = useLicense();

  const [geminiKey, setGeminiKey] = useState(SecurityConstants.EMPTY_STRING);
  const [cerebrasKey, setCerebrasKey] = useState(SecurityConstants.EMPTY_STRING);
  const [groqKey, setGroqKey] = useState(SecurityConstants.EMPTY_STRING);
  const [ai33Key, setAi33Key] = useState(SecurityConstants.EMPTY_STRING);
  const [keysSavedSuccess, setKeysSavedSuccess] = useState(false);
  const [isSavingKeys, setIsSavingKeys] = useState(false);

  const [curlInput, setCurlInput] = useState(SecurityConstants.EMPTY_STRING);
  const [curlFeedback, setCurlFeedback] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [confirmClearType, setConfirmClearType] = useState<ClearType | null>(null);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState(SecurityConstants.EMPTY_STRING);
  const [newPassword, setNewPassword] = useState(SecurityConstants.EMPTY_STRING);
  const [newRecovery, setNewRecovery] = useState(SecurityConstants.EMPTY_STRING);

  const [config, setConfig] = useState({
    projectId: SecurityConstants.EMPTY_STRING,
    authToken: SecurityConstants.EMPTY_STRING,
    recaptchaToken: SecurityConstants.EMPTY_STRING,
    sessionId: SecurityConstants.EMPTY_STRING,
    imageModelName: CURL_KEYWORDS.NARWHAL,
    agentSessionId: SecurityConstants.EMPTY_STRING,
    isStreamChat: false,
  });

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const gk = await storageUtils.getAsync(STORAGE_KEYS.GEMINI_API_KEY);
        const ck = await storageUtils.getAsync(STORAGE_KEYS.CEREBRAS_API_KEY);
        const grk = await storageUtils.getAsync(STORAGE_KEYS.GROQ_API_KEY);
        const ak = await storageUtils.getAsync(STORAGE_KEYS.AI33_API_KEY);
        if (gk) { storageUtils.set(STORAGE_KEYS.GEMINI_API_KEY, gk); setGeminiKey(gk); }
        if (ck) { storageUtils.set(STORAGE_KEYS.CEREBRAS_API_KEY, ck); setCerebrasKey(ck); }
        if (grk) { storageUtils.set(STORAGE_KEYS.GROQ_API_KEY, grk); setGroqKey(grk); }
        if (ak) { storageUtils.set(STORAGE_KEYS.AI33_API_KEY, ak); setAi33Key(ak); }

        const saved = await storageUtils.getAsync(STORAGE_KEYS.API_SANDBOX_CONFIG);
        if (saved && !_.includes([COMMON_STRINGS.UNDEFINED, COMMON_STRINGS.NULL, SecurityConstants.EMPTY_STRING], _.trim(saved))) {
          const parsed = jsonUtils.safeParse<any>(saved, null);
          if (parsed && typeof parsed === "object") {
            setConfig({
              projectId: parsed.projectId || SecurityConstants.EMPTY_STRING,
              authToken: parsed.authToken || SecurityConstants.EMPTY_STRING,
              recaptchaToken: parsed.recaptchaToken || SecurityConstants.EMPTY_STRING,
              sessionId: parsed.sessionId || SecurityConstants.EMPTY_STRING,
              imageModelName: parsed.imageModelName || CURL_KEYWORDS.NARWHAL,
              agentSessionId: parsed.agentSessionId || SecurityConstants.EMPTY_STRING,
              isStreamChat: parsed.isStreamChat !== undefined ? parsed.isStreamChat : false,
            });
          }
        }

        try {
          const resAcc = await fetch(API_ROUTES.PIPELINE_ACCOUNTS);
          const dataAcc = await resAcc.json();
          if (dataAcc.success) {
            setAccounts(dataAcc.accounts || []);
          } else {
            const savedAcc = await storageUtils.getAsync(STORAGE_KEYS.LOCAL_GOOGLE_ACCOUNTS as string);
            if (savedAcc) setAccounts(jsonUtils.safeParse<any[]>(savedAcc, []));
          }
        } catch (e) {
          try {
            const savedAcc = await storageUtils.getAsync(STORAGE_KEYS.LOCAL_GOOGLE_ACCOUNTS as string);
            if (savedAcc) setAccounts(jsonUtils.safeParse<any[]>(savedAcc, []));
          } catch {}
        }
      } catch (e) {
        appError(SecurityConstants.LOG_ERROR_PARSING_SANDBOX_SETTINGS, e);
      }
    };
    loadConfig();
  }, []);

  const saveConfigHelper = async (keysToSave: Record<string, string>, setSavingState: (saving: boolean) => void, setSuccessState: (success: boolean) => void) => { setSavingState(true); try { for (const [key, value] of Object.entries(keysToSave)) { storageUtils.set(key, value); await storageUtils.setAsync(key, value); } setSuccessState(true); setTimeout(() => setSuccessState(false), SETTINGS_CONSTS.SUCCESS_STATE_DURATION); } catch (error) { appError(SecurityConstants.LOG_GENERAL_ERROR, error); } finally { setSavingState(false); } };

  const handleAddAccount = async () => {
    if (_.isEmpty(_.trim(newEmail)) || _.isEmpty(_.trim(newPassword))) return;
    const newAcc = {
      id: Date.now(),
      email: _.trim(newEmail),
      password: _.trim(newPassword),
      recoveryEmail: _.trim(newRecovery)
    };
    const updated = [...accounts, newAcc];
    setAccounts(updated);

    try {
      await fetch(API_ROUTES.PIPELINE_ACCOUNTS, {
        method: REFACTOR_CONSTANTS.HTTP_METHOD_POST,
        headers: { [REFACTOR_CONSTANTS.HEADER_CONTENT_TYPE]: REFACTOR_CONSTANTS.MIME_JSON },
        body: jsonUtils.safeStringify({ accounts: updated })
      });
    } catch (e) {}

    storageUtils.setAsync(STORAGE_KEYS.LOCAL_GOOGLE_ACCOUNTS as string, jsonUtils.safeStringify(updated));
    setNewEmail(SecurityConstants.EMPTY_STRING);
    setNewPassword(SecurityConstants.EMPTY_STRING);
    setNewRecovery(SecurityConstants.EMPTY_STRING);
  };

  const handleRemoveAccount = async (id: number) => {
    const updated = _.filter(accounts, a => a.id !== id);
    setAccounts(updated);

    try {
      await fetch(API_ROUTES.PIPELINE_ACCOUNTS, {
        method: REFACTOR_CONSTANTS.HTTP_METHOD_POST,
        headers: { [REFACTOR_CONSTANTS.HEADER_CONTENT_TYPE]: REFACTOR_CONSTANTS.MIME_JSON },
        body: jsonUtils.safeStringify({ accounts: updated })
      });
    } catch (e) {}

    storageUtils.setAsync(STORAGE_KEYS.LOCAL_GOOGLE_ACCOUNTS as string, jsonUtils.safeStringify(updated));
  };

  const handleSaveKeys = () => {
    saveConfigHelper(
      {
        [STORAGE_KEYS.GEMINI_API_KEY]: _.trim(geminiKey),
        [STORAGE_KEYS.CEREBRAS_API_KEY]: _.trim(cerebrasKey),
        [STORAGE_KEYS.GROQ_API_KEY]: _.trim(groqKey),
        [STORAGE_KEYS.AI33_API_KEY]: _.trim(ai33Key),
      },
      setIsSavingKeys,
      setKeysSavedSuccess,
    );
  };

  const handleConfirmClear = async () => {
    try {
      if (confirmClearType === CLEAR_TYPES.API) {
        setGeminiKey(SecurityConstants.EMPTY_STRING);
        setCerebrasKey(SecurityConstants.EMPTY_STRING);
        setGroqKey(SecurityConstants.EMPTY_STRING);
        setAi33Key(SecurityConstants.EMPTY_STRING);
        await storageUtils.removeAsync(STORAGE_KEYS.GEMINI_API_KEY);
        await storageUtils.removeAsync(STORAGE_KEYS.CEREBRAS_API_KEY);
        await storageUtils.removeAsync(STORAGE_KEYS.GROQ_API_KEY);
        await storageUtils.removeAsync(STORAGE_KEYS.AI33_API_KEY);
      } else if (confirmClearType === CLEAR_TYPES.SANDBOX) {
        const defaultConfig = {
          projectId: SecurityConstants.EMPTY_STRING,
          authToken: SecurityConstants.EMPTY_STRING,
          recaptchaToken: SecurityConstants.EMPTY_STRING,
          sessionId: SecurityConstants.EMPTY_STRING,
          imageModelName: CURL_KEYWORDS.NARWHAL,
          agentSessionId: SecurityConstants.EMPTY_STRING,
          isStreamChat: false,
        };
        setConfig(defaultConfig);
        setCurlInput(SecurityConstants.EMPTY_STRING);
        await storageUtils.removeAsync(STORAGE_KEYS.API_SANDBOX_CONFIG);
      }
    } catch (e) {
      appError(SecurityConstants.LOG_GENERAL_ERROR, e);
    }
    setConfirmClearType(null);
  };

  const handleSaveConfig = () => {
    saveConfigHelper({ [STORAGE_KEYS.API_SANDBOX_CONFIG]: jsonUtils.safeStringify(config) }, setIsSavingConfig, setSavedSuccess);
  };

  const handleCurlPaste = (val: string) => {
    const trimmedVal = _.trim(val);
    setCurlInput(trimmedVal);
    if (!trimmedVal) return;

    try {
      const authMatch = trimmedVal.match(CURL_AUTHORIZATION_BEARER_REGEX);
      let parsedAuthToken = SecurityConstants.EMPTY_STRING;
      if (authMatch) {
        parsedAuthToken = _.trim(_.get(authMatch, 1));
      } else {
        const rawMatch = trimmedVal.match(CURL_AUTHORIZATION_JSON_REGEX);
        if (rawMatch) parsedAuthToken = _.trim(_.get(rawMatch, 1));
      }

      if (!parsedAuthToken) {
        const bearerMatch = trimmedVal.match(CURL_BEARER_TOKEN_REGEX);
        if (bearerMatch) parsedAuthToken = _.trim(_.get(bearerMatch, 1));
      }

      let parsedProjectId = SecurityConstants.EMPTY_STRING;
      const projMatchBody = val.match(CURL_PROJECT_ID_BODY_REGEX);
      if (projMatchBody) {
        parsedProjectId = _.get(projMatchBody, 2);
      } else {
        const urlProjMatch = val.match(CURL_PROJECT_ID_URL_REGEX);
        if (urlProjMatch) parsedProjectId = _.get(urlProjMatch, 1);
      }

      let parsedSessionId = SecurityConstants.EMPTY_STRING;
      const sessMatch = val.match(CURL_CLIENT_SESSION_ID_REGEX);
      if (sessMatch) {
        parsedSessionId = _.get(sessMatch, 1);
      } else {
        const sessMatch2 = val.match(CURL_SESSION_ID_REGEX);
        if (sessMatch2) parsedSessionId = _.get(sessMatch2, 1);
      }

      let parsedRecaptcha = SecurityConstants.EMPTY_STRING;
      const recaptchaMatch = val.match(CURL_RECAPTCHA_TOKEN_REGEX);
      if (recaptchaMatch) parsedRecaptcha = _.get(recaptchaMatch, 1);

      let parsedAgentSessionId = SecurityConstants.EMPTY_STRING;
      const agentSessMatch = trimmedVal.match(CURL_AGENT_SESSION_ID_REGEX);
      if (agentSessMatch) parsedAgentSessionId = _.get(agentSessMatch, 1);

      const isStreamChat = _.some([CURL_KEYWORDS.STREAM_AGENT, CURL_KEYWORDS.STREAM], k => _.includes(trimmedVal, k));

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
      setCurlFeedback(`${t.ext_success_extract} ${parsedAuthToken ? t.ext_bearer : SecurityConstants.EMPTY_STRING}${parsedRecaptcha ? t.ext_recaptcha : SecurityConstants.EMPTY_STRING}${isStreamChat ? t.ext_streamchat : t.ext_batch}`);
      setTimeout(() => setCurlFeedback(null), SETTINGS_CONSTS.FEEDBACK_TIMEOUT);
    } catch (e) {
      appError(SecurityConstants.LOG_GENERAL_ERROR, e);
      setCurlFeedback(t.Failed_to_parse_cURL_comm);
    }
  };

  const isApiEmpty = _.every([geminiKey, cerebrasKey, groqKey, ai33Key], _.isEmpty);
  const isSandboxEmpty = _.every([config.authToken, config.projectId, config.sessionId, curlInput], _.isEmpty);

  return (
    <div className="flex-grow h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto space-y-6 text-left">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-500/10 rounded-full shrink-0">
            <KeyRound className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <h2 
              className="text-base font-black tracking-tight text-slate-100 uppercase font-mono cursor-help"
              title={_.isEqual(currentLang, AppLanguage.VI) ? SecurityConstants.LICENSE_MGMT_TOOLTIP_VI : SecurityConstants.LICENSE_MGMT_TOOLTIP_EN}
            >
              {_.isEqual(currentLang, AppLanguage.VI) ? SecurityConstants.LICENSE_MGMT_TITLE_VI : SecurityConstants.LICENSE_MGMT_TITLE_EN}
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed font-mono">
              {_.get(licenseInfo, SecurityConstants.PROP_PLAN_TYPE) 
                ? `${_.isEqual(currentLang, AppLanguage.VI) ? SecurityConstants.PLAN_LABEL_VI : SecurityConstants.PLAN_LABEL_EN}: ${_.get(licenseInfo, SecurityConstants.PROP_PLAN_TYPE)}` 
                : (_.isEqual(currentLang, AppLanguage.VI) ? SecurityConstants.ACTIVATED_LABEL_VI : SecurityConstants.ACTIVATED_LABEL_EN)
              } | Key: <span className="text-slate-200">{licenseKey ? `${licenseKey.slice(SecurityConstants.ZERO, SecurityConstants.KEY_PREVIEW_LEN)}${SecurityConstants.ELLIPSIS}` : SecurityConstants.NOT_AVAILABLE}</span>
            </p>
          </div>
        </div>
        <Button
          variant={SecurityConstants.BTN_VARIANT_SECONDARY}
          onClick={logoutLicense}
          title={_.isEqual(currentLang, AppLanguage.VI) ? SecurityMessages.LOGOUT_LABEL_TOOLTIP : SecurityConstants.LOGOUT_TOOLTIP_EN}
          className="bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 font-bold text-xs px-4 py-2.5 flex items-center gap-2 rounded-xl shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>{_.isEqual(currentLang, AppLanguage.VI) ? SecurityMessages.LOGOUT_LABEL_SHORT : SecurityConstants.LOGOUT_LABEL_EN}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-slate-800 rounded-xl">
                  <Key className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-200 uppercase font-mono tracking-wider">{t.apiKeysConfig}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{_.some([geminiKey, cerebrasKey, groqKey, ai33Key], Boolean) ? t.configured : t.notSet}</p>
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
                  type={SecurityConstants.INPUT_TYPE_PASSWORD}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder={t.enterGeminiKey}
                  className="w-full bg-slate-955 border border-slate-800 hover:border-slate-700 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold text-slate-400 font-mono uppercase block tracking-wider">AI33_API_KEY</label>
                <input
                  type={SecurityConstants.INPUT_TYPE_PASSWORD}
                  value={ai33Key}
                  onChange={(e) => setAi33Key(e.target.value)}
                  placeholder={t.enterAi33Key}
                  className="w-full bg-slate-955 border border-slate-800 hover:border-slate-700 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5"><label className="text-[9px] font-extrabold text-slate-400 font-mono uppercase block tracking-wider">CEREBRAS_API_KEY</label><input type={SecurityConstants.INPUT_TYPE_PASSWORD} value={cerebrasKey} onChange={(e) => setCerebrasKey(e.target.value)} placeholder={REFACTOR_CONSTANTS.CEREBRAS_API_KEY_PLACEHOLDER} className="w-full bg-slate-955 border border-slate-800 hover:border-slate-700 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none transition-all" /></div>
              <div className="space-y-1.5"><label className="text-[9px] font-extrabold text-slate-400 font-mono uppercase block tracking-wider">GROQ_API_KEY</label><input type={SecurityConstants.INPUT_TYPE_PASSWORD} value={groqKey} onChange={(e) => setGroqKey(e.target.value)} placeholder={REFACTOR_CONSTANTS.GROQ_API_KEY_PLACEHOLDER} className="w-full bg-slate-955 border border-slate-800 hover:border-slate-700 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none transition-all" /></div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <Button
                variant={SecurityConstants.BTN_VARIANT_PRIMARY}
                onClick={() => setConfirmClearType(CLEAR_TYPES.API)}
                disabled={isSavingKeys || isApiEmpty}
                className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-rose-600 hover:to-rose-500 disabled:hover:from-slate-700 disabled:hover:to-slate-600 text-white font-bold text-xs px-4 py-2 flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{pageTexts.CLEAR_BTN}</span>
              </Button>
              <Button
                variant={SecurityConstants.BTN_VARIANT_PRIMARY}
                onClick={handleSaveKeys}
                disabled={isSavingKeys}
                className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs px-4 py-2 flex items-center gap-1.5"
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
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-200 uppercase font-mono tracking-wider">
                    {_.isEqual(currentLang, "vi") ? "Tài khoản Google" : "Google Accounts"}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {_.isEqual(currentLang, "vi") ? `Đang liên kết: ${accounts.length}` : `Linked: ${accounts.length}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type={SecurityConstants.INPUT_TYPE_TEXT}
                  placeholder="Email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 outline-none focus:border-blue-500/50"
                />
                <input
                  type={SecurityConstants.INPUT_TYPE_PASSWORD}
                  placeholder={_.isEqual(currentLang, "vi") ? "Mật khẩu" : "Password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="bg-slate-955 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 outline-none focus:border-blue-500/50"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type={SecurityConstants.INPUT_TYPE_TEXT}
                  placeholder={_.isEqual(currentLang, "vi") ? "Email khôi phục" : "Recovery Email"}
                  value={newRecovery}
                  onChange={e => setNewRecovery(e.target.value)}
                  className="bg-slate-955 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 outline-none focus:border-blue-500/50 flex-1"
                />
                <Button 
                  variant={SecurityConstants.BTN_VARIANT_PRIMARY} 
                  onClick={handleAddAccount} 
                  disabled={_.isEmpty(_.trim(newEmail)) || _.isEmpty(_.trim(newPassword))}
                  className="bg-blue-600 hover:bg-blue-500 text-xs px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="mt-4 overflow-y-auto max-h-[150px] space-y-2 pr-1 custom-scrollbar">
                {_.isEmpty(accounts) ? (
                  <div className="text-center text-xs text-slate-500 py-4 italic">
                    {_.isEqual(currentLang, "vi") ? "Chưa có tài khoản" : "No accounts"}
                  </div>
                ) : (
                  _.map(accounts, acc => (
                    <div key={acc.id} className="flex justify-between items-center bg-slate-850/50 border border-slate-800 p-2.5 rounded-xl">
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-slate-200">{acc.email}</span>
                        <span className="text-[10px] text-slate-500 font-mono">••••••••</span>
                      </div>
                      <button onClick={() => handleRemoveAccount(acc.id)} className="text-slate-500 hover:text-rose-500 transition-colors p-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
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
                <Tooltip content={_.isEqual(currentLang, "en") ? REFACTOR_CONSTANTS.CURL_PASTE_LABEL_TOOLTIP_EN : REFACTOR_CONSTANTS.CURL_PASTE_LABEL_TOOLTIP_VI} position="top" align="start">
                  <span className="cursor-help">
                    {_.isEqual(currentLang, "en") ? REFACTOR_CONSTANTS.CURL_PASTE_LABEL_SHORT_EN : REFACTOR_CONSTANTS.CURL_PASTE_LABEL_SHORT_VI}
                  </span>
                </Tooltip>
              </label>
              <textarea
                value={curlInput}
                onChange={(e) => handleCurlPaste(e.target.value)}
                placeholder={t.Paste_full_cURL}
                rows={3}
                className="w-full bg-slate-955 border border-slate-800 hover:border-slate-700 focus:border-rose-500/50 rounded-xl p-3 text-xs text-slate-350 font-mono focus:outline-none transition-all resize-none leading-relaxed"
              />
              {curlFeedback && (
                <div className={cn(`text-[10px] font-bold ${_.some([COMMON_STRINGS.SUCCESS_MARK, COMMON_STRINGS.SUCCESS_KEYWORD_VI], k => _.includes(curlFeedback, k)) ? "text-emerald-500" : "text-rose-500"}`)}>
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
                  {config.isStreamChat ? pageTexts.SSE_MODE : pageTexts.BATCH_MODE}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <Button
              variant={SecurityConstants.BTN_VARIANT_PRIMARY}
              onClick={() => setConfirmClearType(CLEAR_TYPES.SANDBOX)}
              disabled={isSavingConfig || isSandboxEmpty}
              className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-rose-600 hover:to-rose-500 disabled:hover:from-slate-700 disabled:hover:to-slate-600 text-white font-bold text-xs px-4 py-2 flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{pageTexts.CLEAR_BTN}</span>
            </Button>
            <Button
              variant={SecurityConstants.BTN_VARIANT_PRIMARY}
              onClick={handleSaveConfig}
              disabled={isSavingConfig}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs px-4 py-2 flex items-center gap-1.5 transition-all"
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

      <Modal
        isOpen={!!confirmClearType}
        onClose={() => setConfirmClearType(null)}
        title={pageTexts.MODAL_TITLE_CLEAR}
        maxWidth={SecurityConstants.MODAL_WIDTH_MD}
      >
        <div className="p-6 pt-4 text-sm text-slate-300">
          <div className="flex items-start gap-4 mb-5">
            <div className="p-3 bg-rose-500/10 rounded-full shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200 mb-1">{pageTexts.MODAL_WARN_CLEAR}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {pageTexts.MODAL_DESC_CLEAR_PREFIX}
                <strong>{confirmClearType === CLEAR_TYPES.API ? pageTexts.API_KEYS_LBL : pageTexts.SANDBOX_LBL}</strong>
                {pageTexts.MODAL_DESC_CLEAR_SUFFIX}
              </p>
              <p className="mt-2 text-[10px] uppercase font-bold text-rose-500 tracking-wider">
                {pageTexts.MODAL_IRREVERSIBLE}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/50">
            <Button
              variant={SecurityConstants.BTN_VARIANT_GHOST}
              onClick={() => setConfirmClearType(null)}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
            >
              {pageTexts.CANCEL}
            </Button>
            <Button
              variant={SecurityConstants.BTN_VARIANT_PRIMARY}
              onClick={handleConfirmClear}
              className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-rose-500/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {pageTexts.CONFIRM_CLEAR}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
