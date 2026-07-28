import { useState, useEffect } from "react";
import { Lang, translations } from "../lib/lang.js";
import { STORAGE_KEYS, SETTINGS_VIEW_TEXTS, REFACTOR_CONSTANTS } from "../constants";
import { Key, Users, Save, Plus, X, LogOut, KeyRound } from "lucide-react";
import { Button } from "./ui/Button";
import { getStoredApiKey } from "../lib/shared-utils.js";
import { storageUtils } from "../lib/storage";
import { useLicense } from "../contexts/LicenseContext";
import { SecurityConstants, SecurityMessages } from "../constants/security";
import { AppLanguage } from "../constants/enums";
import { Tooltip } from "./ui/Tooltip";
import _ from "lodash";
import { jsonUtils } from "../lib/json";

interface SettingsViewProps {
  currentLang: Lang;
}

export default function SettingsView({ currentLang }: SettingsViewProps) {
  const t = translations[currentLang];
  const texts = SETTINGS_VIEW_TEXTS[currentLang] || SETTINGS_VIEW_TEXTS.en;
  const { licenseKey, licenseInfo, logoutLicense } = useLicense();

  const [geminiKey, setGeminiKey] = useState(() => getStoredApiKey(STORAGE_KEYS.GEMINI_API_KEY));
  const [ai33Key, setAi33Key] = useState(() => getStoredApiKey(STORAGE_KEYS.AI33_API_KEY));
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  
  const [accounts, setAccounts] = useState<any[]>([]);
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetch(REFACTOR_CONSTANTS.API_ACCOUNTS);
        const data = await res.json();
        if (data.success) {
          setAccounts(data.accounts || []);
          return;
        }
      } catch (e) {}

      try {
        const saved = await storageUtils.getAsync(STORAGE_KEYS.LOCAL_GOOGLE_ACCOUNTS as string);
        if (saved) setAccounts(jsonUtils.safeParse<any[]>(saved, []));
      } catch {}
    };
    loadAccounts();
  }, []);
  const [newEmail, setNewEmail] = useState(SecurityConstants.EMPTY_STRING);
  const [newPassword, setNewPassword] = useState(SecurityConstants.EMPTY_STRING);
  const [newRecovery, setNewRecovery] = useState(SecurityConstants.EMPTY_STRING);

  const handleSaveKeys = () => {
    setIsSavingKeys(true);
    setTimeout(async () => {
      await storageUtils.setAsync(STORAGE_KEYS.GEMINI_API_KEY, _.trim(geminiKey));
      await storageUtils.setAsync(STORAGE_KEYS.AI33_API_KEY, _.trim(ai33Key));
      setIsSavingKeys(false);
    }, REFACTOR_CONSTANTS.DELAY_SAVE_KEYS_MS);
  };

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
      await fetch(REFACTOR_CONSTANTS.API_ACCOUNTS, {
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
      await fetch(REFACTOR_CONSTANTS.API_ACCOUNTS, {
        method: REFACTOR_CONSTANTS.HTTP_METHOD_POST,
        headers: { [REFACTOR_CONSTANTS.HEADER_CONTENT_TYPE]: REFACTOR_CONSTANTS.MIME_JSON },
        body: jsonUtils.safeStringify({ accounts: updated })
      });
    } catch (e) {}

    storageUtils.setAsync(STORAGE_KEYS.LOCAL_GOOGLE_ACCOUNTS as string, jsonUtils.safeStringify(updated));
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-slate-800 rounded-xl">
                <Key className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-200 uppercase font-mono tracking-wider">{t.apiKeysConfig}</h3>
                <Tooltip content={_.isEqual(currentLang, "en") ? REFACTOR_CONSTANTS.API_KEY_DESC_TOOLTIP_EN : REFACTOR_CONSTANTS.API_KEY_DESC_TOOLTIP_VI} position="bottom" align="start">
                  <p className="text-[10px] text-slate-400 mt-0.5 cursor-help">
                    {_.isEqual(currentLang, "en") ? REFACTOR_CONSTANTS.API_KEY_DESC_SHORT_EN : REFACTOR_CONSTANTS.API_KEY_DESC_SHORT_VI}
                  </p>
                </Tooltip>
              </div>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 font-mono uppercase block tracking-wider">
                GEMINI_API_KEY
              </label>
              <input
                type={SecurityConstants.INPUT_TYPE_TEXT}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder={texts.GEMINI_PLACEHOLDER}
                className="w-full bg-slate-955 border border-slate-850 hover:border-slate-700 focus:border-emerald-500/50 rounded-lg p-2.5 text-xs text-slate-300 font-mono focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 font-mono uppercase block tracking-wider">
                AI33_API_KEY
              </label>
              <input
                type={SecurityConstants.INPUT_TYPE_TEXT}
                value={ai33Key}
                onChange={(e) => setAi33Key(e.target.value)}
                placeholder={texts.AI33_PLACEHOLDER}
                className="w-full bg-slate-955 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/50 rounded-lg p-2.5 text-xs text-slate-300 font-mono focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
            <Button
              variant={SecurityConstants.BTN_VARIANT_PRIMARY}
              onClick={handleSaveKeys}
              disabled={isSavingKeys || (_.isEmpty(_.trim(geminiKey)) && _.isEmpty(_.trim(ai33Key)))}
              title={texts.SAVE_BTN_TOOLTIP}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 flex items-center gap-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingKeys ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{texts.SAVE_BTN}</span>
            </Button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-slate-800 rounded-xl">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-200 uppercase font-mono tracking-wider">{texts.ACCOUNTS_TITLE}</h3>
                <Tooltip content={_.isEqual(currentLang, "en") ? REFACTOR_CONSTANTS.SYSTEM_DESC_TOOLTIP_EN : REFACTOR_CONSTANTS.SYSTEM_DESC_TOOLTIP_VI} position="bottom" align="start">
                  <p className="text-[10px] text-slate-400 mt-0.5 cursor-help">
                    {_.isEqual(currentLang, "en") ? REFACTOR_CONSTANTS.SYSTEM_DESC_SHORT_EN : REFACTOR_CONSTANTS.SYSTEM_DESC_SHORT_VI} ({accounts.length})
                  </p>
                </Tooltip>
              </div>
            </div>
          </div>

          <div className="space-y-3 flex-1 flex flex-col">
            <div className="grid grid-cols-2 gap-2">
              <input
                type={SecurityConstants.INPUT_TYPE_TEXT}
                placeholder={texts.EMAIL_PLACEHOLDER}
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300 outline-none focus:border-blue-500/50"
              />
              <input
                type={SecurityConstants.INPUT_TYPE_PASSWORD}
                placeholder={texts.PWD_PLACEHOLDER}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300 outline-none focus:border-blue-500/50"
              />
            </div>
            <div className="flex gap-2">
              <input
                type={SecurityConstants.INPUT_TYPE_TEXT}
                placeholder={_.isEqual(currentLang, "en") ? REFACTOR_CONSTANTS.RECOVERY_PLACEHOLDER_SHORT_EN : REFACTOR_CONSTANTS.RECOVERY_PLACEHOLDER_SHORT_VI}
                title={_.isEqual(currentLang, "en") ? REFACTOR_CONSTANTS.RECOVERY_PLACEHOLDER_TOOLTIP_EN : REFACTOR_CONSTANTS.RECOVERY_PLACEHOLDER_TOOLTIP_VI}
                value={newRecovery}
                onChange={e => setNewRecovery(e.target.value)}
                className="bg-slate-955 border border-slate-800 rounded p-2 text-xs text-slate-300 outline-none focus:border-blue-500/50 flex-1"
              />
              <Button 
                variant={SecurityConstants.BTN_VARIANT_PRIMARY} 
                onClick={handleAddAccount} 
                disabled={_.isEmpty(_.trim(newEmail)) || _.isEmpty(_.trim(newPassword))}
                title={texts.ADD_BTN_TOOLTIP}
                className="bg-blue-600 hover:bg-blue-500 text-xs px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto max-h-[150px] space-y-2 pr-1 custom-scrollbar">
              {_.isEmpty(accounts) ? (
                <div className="text-center text-xs text-slate-500 py-4 italic">{texts.NO_ACCOUNTS}</div>
              ) : (
                _.map(accounts, acc => (
                  <div key={acc.id} className="flex justify-between items-center bg-slate-800/50 border border-slate-700/50 p-2 rounded">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-200">{_.get(acc, SecurityConstants.PROP_EMAIL)}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{texts.HIDDEN_PWD}</span>
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
    </div>
  );
}
