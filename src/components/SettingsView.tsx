import { cn } from "../lib/utils";
import { useState, useEffect, FC } from "react";
import { Lang, translations } from "../lib/lang.js";
import { API_ROUTES, STORAGE_KEYS, SETTINGS_VIEW_TEXTS, REFACTOR_CONSTANTS } from "../constants";
import { Key, Users, Save, Plus, X, LogOut, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "./ui/Button";
import { getStoredApiKey } from "../lib/shared-utils.js";
import { storageUtils } from "../lib/storage";
import { useLicense } from "../contexts/LicenseContext";
import { SecurityConstants, SecurityMessages } from "../constants/security";
import { AppLanguage } from "../constants/enums";
import { Tooltip } from "./ui/Tooltip";
import _ from "lodash";
import { jsonUtils } from "../lib/json";
import { toast } from "sonner";

interface SettingsViewProps { currentLang: Lang; }

interface ApiKeyFieldProps { label: string; value: string; placeholder: string; onChange: (val: string) => void; }

const ApiKeyField: FC<ApiKeyFieldProps> = ({ label, value, placeholder, onChange }) => (
  <div className={cn("space-y-1.5")}>
    <label className={cn("text-[10px] font-extrabold text-slate-300 font-mono uppercase block tracking-wider truncate")} title={label}>{label}</label>
    <input
      type={SecurityConstants.INPUT_TYPE_TEXT}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn("w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/80 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:outline-none transition-all")}
    />
  </div>
);

interface AccountItemProps { email: string; hiddenPwdText: string; onRemove: () => void; }

const AccountItem: FC<AccountItemProps> = ({ email, hiddenPwdText, onRemove }) => (
  <div className={cn("flex justify-between items-center bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl hover:border-slate-700 transition-colors gap-2")}>
    <div className={cn("flex flex-col min-w-0 flex-1")}>
      <span className={cn("text-xs font-bold text-slate-200 truncate")} title={email}>{email}</span>
      <span className={cn("text-[10px] text-slate-500 font-mono truncate")}>{hiddenPwdText}</span>
    </div>
    <button onClick={onRemove} className={cn("text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors p-1.5 rounded-lg shrink-0")}>
      <X className={cn("w-3.5 h-3.5")} />
    </button>
  </div>
);

export default function SettingsView({ currentLang }: SettingsViewProps) {
  const t = translations[currentLang];
  const texts = _.get(SETTINGS_VIEW_TEXTS, currentLang, SETTINGS_VIEW_TEXTS.en);
  const { licenseKey, licenseInfo, logoutLicense } = useLicense();
  const isVietnamese = _.isEqual(currentLang, AppLanguage.VI);

  const [geminiKey, setGeminiKey] = useState(() => getStoredApiKey(STORAGE_KEYS.GEMINI_API_KEY));
  const [cerebrasKey, setCerebrasKey] = useState(() => getStoredApiKey(STORAGE_KEYS.CEREBRAS_API_KEY));
  const [groqKey, setGroqKey] = useState(() => getStoredApiKey(STORAGE_KEYS.GROQ_API_KEY));
  const [ai33Key, setAi33Key] = useState(() => getStoredApiKey(STORAGE_KEYS.AI33_API_KEY));
  const [isSavingKeys, setIsSavingKeys] = useState(false);

  useEffect(() => {
    const migrateKeys = async () => {
      const apiKeyStorageKeys = [STORAGE_KEYS.GEMINI_API_KEY, STORAGE_KEYS.CEREBRAS_API_KEY, STORAGE_KEYS.GROQ_API_KEY, STORAGE_KEYS.AI33_API_KEY];
      for (const key of apiKeyStorageKeys) {
        const value = await storageUtils.getAsync(key);
        if (!_.isEmpty(value)) storageUtils.set(key, value as string);
      }
      setGeminiKey(getStoredApiKey(STORAGE_KEYS.GEMINI_API_KEY));
      setCerebrasKey(getStoredApiKey(STORAGE_KEYS.CEREBRAS_API_KEY));
      setGroqKey(getStoredApiKey(STORAGE_KEYS.GROQ_API_KEY));
      setAi33Key(getStoredApiKey(STORAGE_KEYS.AI33_API_KEY));
    };
    void migrateKeys();
  }, []);

  const [accounts, setAccounts] = useState<any[]>([]);
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetch(API_ROUTES.PIPELINE_ACCOUNTS);
        const data = await res.json();
        if (_.get(data, SecurityConstants.SUCCESS_KEY)) {
          setAccounts(_.get(data, SecurityConstants.ACCOUNTS_KEY, []));
          return;
        }
      } catch {}

      try {
        const savedAccounts = await jsonUtils.getAsyncItem<any[]>(STORAGE_KEYS.LOCAL_GOOGLE_ACCOUNTS as string, []);
        if (!_.isEmpty(savedAccounts)) setAccounts(savedAccounts);
      } catch {}
    };
    void loadAccounts();
  }, []);

  const [newEmail, setNewEmail] = useState(SecurityConstants.EMPTY_STRING);
  const [newPassword, setNewPassword] = useState(SecurityConstants.EMPTY_STRING);
  const [newRecovery, setNewRecovery] = useState(SecurityConstants.EMPTY_STRING);

  const handleSaveKeys = async () => {
    setIsSavingKeys(true);
    try {
      const entries = [
        [STORAGE_KEYS.GEMINI_API_KEY, _.trim(geminiKey)],
        [STORAGE_KEYS.CEREBRAS_API_KEY, _.trim(cerebrasKey)],
        [STORAGE_KEYS.GROQ_API_KEY, _.trim(groqKey)],
        [STORAGE_KEYS.AI33_API_KEY, _.trim(ai33Key)],
      ] as const;
      for (const [key, value] of entries) {
        storageUtils.set(key, value);
        await storageUtils.setAsync(key, value);
      }
      toast.success(SecurityMessages.SAVE_API_KEYS_SUCCESS);
    } catch {
      toast.error(SecurityMessages.SAVE_API_KEYS_ERROR);
    } finally {
      setIsSavingKeys(false);
    }
  };

  const handleAddAccount = async () => {
    if (_.isEmpty(_.trim(newEmail)) || _.isEmpty(_.trim(newPassword))) return;
    const newAcc = { id: Date.now(), email: _.trim(newEmail), password: _.trim(newPassword), recoveryEmail: _.trim(newRecovery), };
    const updated = [...accounts, newAcc];
    setAccounts(updated);

    try {
      await fetch(API_ROUTES.PIPELINE_ACCOUNTS, {
        method: REFACTOR_CONSTANTS.HTTP_METHOD_POST,
        headers: { [REFACTOR_CONSTANTS.HEADER_CONTENT_TYPE]: REFACTOR_CONSTANTS.MIME_JSON },
        body: jsonUtils.safeStringify({ accounts: updated }),
      });
    } catch {}

    void jsonUtils.setAsyncItem(STORAGE_KEYS.LOCAL_GOOGLE_ACCOUNTS as string, updated);
    setNewEmail(SecurityConstants.EMPTY_STRING);
    setNewPassword(SecurityConstants.EMPTY_STRING);
    setNewRecovery(SecurityConstants.EMPTY_STRING);
  };

  const handleRemoveAccount = async (id: number) => {
    const updated = _.filter(accounts, (a) => a.id !== id);
    setAccounts(updated);

    try {
      await fetch(API_ROUTES.PIPELINE_ACCOUNTS, {
        method: REFACTOR_CONSTANTS.HTTP_METHOD_POST,
        headers: { [REFACTOR_CONSTANTS.HEADER_CONTENT_TYPE]: REFACTOR_CONSTANTS.MIME_JSON },
        body: jsonUtils.safeStringify({ accounts: updated }),
      });
    } catch {}

    void jsonUtils.setAsyncItem(STORAGE_KEYS.LOCAL_GOOGLE_ACCOUNTS as string, updated);
  };

  const licenseTitle = isVietnamese ? SecurityConstants.LICENSE_MGMT_TITLE_VI : SecurityConstants.LICENSE_MGMT_TITLE_EN;
  const licenseTooltip = isVietnamese ? SecurityConstants.LICENSE_MGMT_TOOLTIP_VI : SecurityConstants.LICENSE_MGMT_TOOLTIP_EN;
  const planPrefix = isVietnamese ? SecurityConstants.PLAN_LABEL_VI : SecurityConstants.PLAN_LABEL_EN;
  const activatedLabel = isVietnamese ? SecurityConstants.ACTIVATED_LABEL_VI : SecurityConstants.ACTIVATED_LABEL_EN;

  const planType = _.get(licenseInfo, SecurityConstants.PROP_PLAN_TYPE);
  const planDisplayText = planType ? `${planPrefix}: ${planType}` : activatedLabel;
  const keyPreview = licenseKey ? `${licenseKey.slice(SecurityConstants.ZERO, SecurityConstants.KEY_PREVIEW_LEN)}${SecurityConstants.ELLIPSIS}` : SecurityConstants.NOT_AVAILABLE;

  const logoutTooltip = isVietnamese ? SecurityMessages.LOGOUT_LABEL_TOOLTIP : SecurityConstants.LOGOUT_TOOLTIP_EN;
  const logoutLabel = isVietnamese ? SecurityMessages.LOGOUT_LABEL_SHORT : SecurityConstants.LOGOUT_LABEL_EN;

  const apiKeyTooltip = _.isEqual(currentLang, "en") ? REFACTOR_CONSTANTS.API_KEY_DESC_TOOLTIP_EN : REFACTOR_CONSTANTS.API_KEY_DESC_TOOLTIP_VI;
  const apiKeyShort = _.isEqual(currentLang, "en") ? REFACTOR_CONSTANTS.API_KEY_DESC_SHORT_EN : REFACTOR_CONSTANTS.API_KEY_DESC_SHORT_VI;

  const recoveryPlaceholder = _.isEqual(currentLang, "en") ? REFACTOR_CONSTANTS.RECOVERY_PLACEHOLDER_SHORT_EN : REFACTOR_CONSTANTS.RECOVERY_PLACEHOLDER_SHORT_VI;
  const recoveryTooltip = _.isEqual(currentLang, "en") ? REFACTOR_CONSTANTS.RECOVERY_PLACEHOLDER_TOOLTIP_EN : REFACTOR_CONSTANTS.RECOVERY_PLACEHOLDER_TOOLTIP_VI;

  const systemTooltip = _.isEqual(currentLang, "en") ? REFACTOR_CONSTANTS.SYSTEM_DESC_TOOLTIP_EN : REFACTOR_CONSTANTS.SYSTEM_DESC_TOOLTIP_VI;
  const systemShort = _.isEqual(currentLang, "en") ? REFACTOR_CONSTANTS.SYSTEM_DESC_SHORT_EN : REFACTOR_CONSTANTS.SYSTEM_DESC_SHORT_VI;

  return (
    <div className={cn("flex-grow h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto space-y-6 text-left")}>
      
      <div className={cn("glass-card p-6 sm:p-7 rounded-3xl shadow-lg flex items-center justify-between gap-4 relative overflow-hidden")}>
        <div className={cn("absolute top-0 right-0 w-72 h-72 bg-rose-500/5 rounded-full blur-3xl pointer-events-none")} />
        <div className={cn("flex items-center gap-4 relative z-10 min-w-0")}>
          <div className={cn("p-3 bg-gradient-to-tr from-rose-600 to-amber-500 rounded-2xl shrink-0 shadow-md shadow-rose-500/20 text-white")}>
            <KeyRound className={cn("w-7 h-7")} />
          </div>
          <div className={cn("min-w-0")}>
            <h2 className={cn("text-base font-extrabold tracking-tight text-white uppercase font-mono flex items-center gap-2 truncate")} title={licenseTooltip}>
              <span className={cn("truncate")}>{licenseTitle}</span>
              <span className={cn("px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black tracking-normal flex items-center gap-1 shrink-0")}>
                <ShieldCheck className={cn("w-3 h-3")} />
                Active
              </span>
            </h2>
            <p className={cn("text-xs text-slate-400 mt-1 leading-relaxed font-mono truncate")} title={`${planDisplayText} • Key: ${keyPreview}`}>
              <span className={cn("truncate")}>{planDisplayText} • Key: <span className={cn("text-slate-200 font-bold")}>{keyPreview}</span></span>
            </p>
          </div>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={logoutLicense}
          title={logoutTooltip}
          className={cn("rounded-2xl font-bold flex items-center gap-2 shrink-0")}>
          <LogOut className={cn("w-4 h-4")} />
          <span className={cn("truncate")}>{logoutLabel}</span>
        </Button>
      </div>

      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch")}>
        
        <div className={cn("glass-card rounded-3xl p-6 shadow-md flex flex-col h-full")}>
          <div className={cn("flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4")}>
            <div className={cn("flex items-center gap-3 min-w-0")}>
              <div className={cn("p-2 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-400 shrink-0")}>
                <Key className={cn("w-4 h-4")} />
              </div>
              <div className={cn("min-w-0")}>
                <h3 className={cn("text-xs font-black text-slate-100 uppercase font-mono tracking-wider truncate")} title={t.apiKeysConfig}>{t.apiKeysConfig}</h3>
                <Tooltip content={apiKeyTooltip} position="bottom" align="start">
                  <p className={cn("text-[10px] text-slate-400 mt-0.5 cursor-help truncate")}>{apiKeyShort}</p>
                </Tooltip>
              </div>
            </div>
          </div>

          <div className={cn("space-y-4 flex-1")}>
            <ApiKeyField label="GEMINI_API_KEY" value={geminiKey} placeholder={texts.GEMINI_PLACEHOLDER} onChange={setGeminiKey} />
            <ApiKeyField label="CEREBRAS_API_KEY" value={cerebrasKey} placeholder={texts.CEREBRAS_PLACEHOLDER} onChange={setCerebrasKey} />
            <ApiKeyField label="GROQ_API_KEY" value={groqKey} placeholder={texts.GROQ_PLACEHOLDER} onChange={setGroqKey} />
            <ApiKeyField label="AI33_API_KEY" value={ai33Key} placeholder={texts.AI33_PLACEHOLDER} onChange={setAi33Key} />
          </div>

          <div className={cn("pt-4 mt-4 border-t border-slate-800/80 flex justify-end")}>
            <Button
              variant={SecurityConstants.BTN_VARIANT_PRIMARY}
              onClick={handleSaveKeys}
              disabled={isSavingKeys || _.every([geminiKey, cerebrasKey, groqKey, ai33Key], (key) => _.isEmpty(_.trim(key)))}
              title={texts.SAVE_BTN_TOOLTIP}
              className={cn("rounded-xl flex items-center gap-2 font-bold")}>
              {isSavingKeys ? <div className={cn("w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin")} /> : <Save className={cn("w-3.5 h-3.5 shrink-0")} />}
              <span className={cn("truncate")}>{texts.SAVE_BTN}</span>
            </Button>
          </div>
        </div>

        <div className={cn("glass-card rounded-3xl p-6 shadow-md flex flex-col h-full")}>
          <div className={cn("flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4")}>
            <div className={cn("flex items-center gap-3 min-w-0")}>
              <div className={cn("p-2 bg-blue-500/15 border border-blue-500/30 rounded-xl text-blue-400 shrink-0")}>
                <Users className={cn("w-4 h-4")} />
              </div>
              <div className={cn("min-w-0")}>
                <h3 className={cn("text-xs font-black text-slate-100 uppercase font-mono tracking-wider truncate")} title={texts.ACCOUNTS_TITLE}>{texts.ACCOUNTS_TITLE}</h3>
                <Tooltip content={systemTooltip} position="bottom" align="start">
                  <p className={cn("text-[10px] text-slate-400 mt-0.5 cursor-help truncate")}>
                    {systemShort} ({accounts.length})
                  </p>
                </Tooltip>
              </div>
            </div>
          </div>

          <div className={cn("space-y-3 flex-1 flex flex-col")}>
            <div className={cn("grid grid-cols-2 gap-2")}>
              <input type={SecurityConstants.INPUT_TYPE_TEXT} placeholder={texts.EMAIL_PLACEHOLDER} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={cn("bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-blue-500/80")} />
              <input type={SecurityConstants.INPUT_TYPE_PASSWORD} placeholder={texts.PWD_PLACEHOLDER} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={cn("bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-blue-500/80")} />
            </div>
            <div className={cn("flex gap-2")}>
              <input type={SecurityConstants.INPUT_TYPE_TEXT} placeholder={recoveryPlaceholder} title={recoveryTooltip} value={newRecovery} onChange={(e) => setNewRecovery(e.target.value)} className={cn("bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-blue-500/80 flex-1")} />
              <Button variant="primary" onClick={handleAddAccount} disabled={_.isEmpty(_.trim(newEmail)) || _.isEmpty(_.trim(newPassword))} title={texts.ADD_BTN_TOOLTIP} className={cn("rounded-xl px-4 disabled:opacity-50 shrink-0")}>
                <Plus className={cn("w-4 h-4")} />
              </Button>
            </div>

            <div className={cn("mt-4 flex-1 overflow-y-auto max-h-[150px] space-y-2 pr-1 custom-scrollbar")}>
              {_.isEmpty(accounts) ? (
                <div className={cn("text-center text-xs text-slate-500 py-6 italic truncate")}>{texts.NO_ACCOUNTS}</div>
              ) : (
                _.map(accounts, (acc) => <AccountItem key={acc.id} email={_.get(acc, SecurityConstants.PROP_EMAIL)} hiddenPwdText={texts.HIDDEN_PWD} onRemove={() => handleRemoveAccount(acc.id)} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
