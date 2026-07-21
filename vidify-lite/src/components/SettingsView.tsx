import { useState } from "react";
import { Lang, translations } from "../lib/lang.js";
import { STORAGE_KEYS, SETTINGS_VIEW_TEXTS } from "../constants";
import { Key, Users, ShieldCheck, Save, Plus, X } from "lucide-react";
import { Button } from "./ui/Button";
import { getStoredApiKey } from "../lib/shared-utils.js";
import { storageUtils } from "../lib/storage";
import _ from "lodash";

interface SettingsViewProps {
  currentLang: Lang;
}

export default function SettingsView({ currentLang }: SettingsViewProps) {
  const t = translations[currentLang];
  const texts = SETTINGS_VIEW_TEXTS[currentLang] || SETTINGS_VIEW_TEXTS.en;

  const [geminiKey, setGeminiKey] = useState(() => getStoredApiKey("GEMINI_API_KEY"));
  const [ai33Key, setAi33Key] = useState(() => getStoredApiKey("AI33_API_KEY"));
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  
  const [accounts, setAccounts] = useState<any[]>(() => {
    try {
      const saved = storageUtils.get(STORAGE_KEYS.LOCAL_GOOGLE_ACCOUNTS as string || 'LOCAL_GOOGLE_ACCOUNTS');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRecovery, setNewRecovery] = useState("");

  const handleSaveKeys = () => {
    setIsSavingKeys(true);
    setTimeout(() => {
      storageUtils.set(STORAGE_KEYS.GEMINI_API_KEY, _.trim(geminiKey));
      storageUtils.set(STORAGE_KEYS.AI33_API_KEY, _.trim(ai33Key));
      setIsSavingKeys(false);
    }, 500);
  };

  const handleAddAccount = () => {
    if (_.isEmpty(_.trim(newEmail)) || _.isEmpty(_.trim(newPassword))) return;
    const newAcc = {
      id: Date.now(),
      email: _.trim(newEmail),
      password: _.trim(newPassword),
      recoveryEmail: _.trim(newRecovery)
    };
    const updated = [...accounts, newAcc];
    setAccounts(updated);
    storageUtils.set(STORAGE_KEYS.LOCAL_GOOGLE_ACCOUNTS as string || 'LOCAL_GOOGLE_ACCOUNTS', JSON.stringify(updated));
    setNewEmail("");
    setNewPassword("");
    setNewRecovery("");
  };

  const handleRemoveAccount = (id: number) => {
    const updated = _.filter(accounts, a => a.id !== id);
    setAccounts(updated);
    storageUtils.set(STORAGE_KEYS.LOCAL_GOOGLE_ACCOUNTS as string || 'LOCAL_GOOGLE_ACCOUNTS', JSON.stringify(updated));
  };

  return (
    <div className="flex-grow h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto space-y-6 text-left">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm flex items-start gap-4">
        <div className="p-3 bg-emerald-500/10 rounded-full shrink-0">
          <ShieldCheck className="w-8 h-8 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-base font-black tracking-tight text-slate-100 uppercase font-mono">
            {texts.SYSTEM_TITLE}
          </h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            {texts.SYSTEM_DESC}
          </p>
        </div>
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
                <p className="text-[10px] text-slate-400 mt-0.5">{texts.API_KEYS_TITLE}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 font-mono uppercase block tracking-wider">
                GEMINI_API_KEY
              </label>
              <input
                type="text"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder={texts.GEMINI_PLACEHOLDER}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/50 rounded-lg p-2.5 text-xs text-slate-300 font-mono focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 font-mono uppercase block tracking-wider">
                AI33_API_KEY
              </label>
              <input
                type="text"
                value={ai33Key}
                onChange={(e) => setAi33Key(e.target.value)}
                placeholder={texts.AI33_PLACEHOLDER}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/50 rounded-lg p-2.5 text-xs text-slate-300 font-mono focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
            <Button
              variant="primary"
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
                <p className="text-[10px] text-slate-400 mt-0.5">{texts.ACCOUNTS_DESC} ({accounts.length})</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 flex-1 flex flex-col">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder={texts.EMAIL_PLACEHOLDER}
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300 outline-none focus:border-blue-500/50"
              />
              <input
                type="text"
                placeholder={texts.PWD_PLACEHOLDER}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300 outline-none focus:border-blue-500/50"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={texts.RECOVERY_PLACEHOLDER}
                value={newRecovery}
                onChange={e => setNewRecovery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300 outline-none focus:border-blue-500/50 flex-1"
              />
              <Button 
                variant="primary" 
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
                      <span className="text-xs font-bold text-slate-200">{acc.email}</span>
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
