import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_SETTINGS } from "../constants/runtimeText.js";
import { STUDIO_UI } from "../../../constants/studioTheme.js";
import { StudioInput, StudioPage, StudioCard, StudioHeader, StudioCanvas } from "../../../components/ui/Studio.js";
import { SOURCE_TEMPLATE_SYMBOL_16, SOURCE_TEXT_BOTTOM, SOURCE_TEXT_DANGER, SOURCE_TEXT_EN, SOURCE_TEXT_PRIMARY, SOURCE_TEXT_SM, SOURCE_TEXT_START, SOURCE_TEXT_SYMBOL_11, SOURCE_TEXT_SYMBOL_12, SOURCE_TEXT_SYMBOL_18, SOURCE_TEXT_UNSTYLED } from "../../../constants/sourceText";
import { cn } from "../../../lib/utils";
import { useState, useEffect, FC } from "react";
import { Lang, translations } from "../../../lib/lang.js";
import { API_ROUTES, STORAGE_KEYS, SETTINGS_VIEW_TEXTS, REFACTOR_CONSTANTS } from "../../../constants";
import { SETTINGS_EXTENDED_TEXTS } from "../../../constants/texts";
import { Key, Users, Save, Plus, X, LogOut, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { getStoredApiKey } from "../../../lib/shared-utils.js";
import { storageUtils } from "../../../lib/storage";
import { useLicense } from "../../../contexts/LicenseContext";
import { SecurityConstants, SecurityMessages } from "../../../constants/security";
import { AppLanguage } from "../../../constants/enums";
import { Tooltip } from "../../../components/ui/Tooltip";
import _ from "lodash";
import { jsonUtils } from "../../../lib/json";
import { toast } from "sonner";
import { SettingsSkeleton } from "../../../components/ui/Skeleton";
interface SettingsViewProps {
  currentLang: Lang;
  isLoading?: boolean;
}
interface ApiKeyFieldProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (val: string) => void;
}
const ApiKeyField: FC<ApiKeyFieldProps> = ({ label, value, placeholder, onChange }) => (
  <div className={cn(RT_SHARED.SPACE_Y_1_5)}>
    <label className={cn(RT_SETTINGS.TEXT_10PX_FONT_EXTRABOLD_TEXT_SLATE_300_FONT_MONO_UPPERCASE)} title={label}>
      {label}
    </label>
    <StudioInput type={SecurityConstants.INPUT_TYPE_TEXT} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn(RT_SETTINGS.W_FULL_H_10_BG_SLATE_955_90_BORDER_BORDER)} />
  </div>
);
interface AccountItemProps {
  email: string;
  hiddenPwdText: string;
  onRemove: () => void;
}
const AccountItem: FC<AccountItemProps> = ({ email, hiddenPwdText, onRemove }) => (
  <div className={cn(RT_SETTINGS.FLEX_JUSTIFY_BETWEEN_ITEMS_CENTER_BG_SLATE_950_70_BORDER)}>
    <div className={cn(RT_SETTINGS.FLEX_FLEX_COL_MIN_W_0_FLEX_1)}>
      <span className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_TEXT_SLATE_200_TRUNCATE)} title={email}>
        {email}
      </span>
      <span className={cn(RT_SETTINGS.TEXT_10PX_TEXT_SLATE_500_FONT_MONO_TRUNCATE)}>{hiddenPwdText}</span>
    </div>
    <Button variant={SOURCE_TEXT_UNSTYLED} onClick={onRemove} className={cn(RT_SETTINGS.BTN_ICON_TINY_TEXT_SLATE_500_HOVER_TEXT_ROSE_400)}>
      <X className={cn(RT_SHARED.W_3_5_H_3_5)} />
    </Button>
  </div>
);
export default function SettingsView({ currentLang, isLoading = false }: SettingsViewProps) {
  const { licenseKey, licenseInfo, logoutLicense } = useLicense();
  const t = translations[currentLang];
  const texts = _.get(SETTINGS_VIEW_TEXTS, currentLang, SETTINGS_VIEW_TEXTS.en);
  const isVietnamese = _.isEqual(currentLang, AppLanguage.VI);
  const [geminiKey, setGeminiKey] = useState(() => getStoredApiKey(STORAGE_KEYS.GEMINI_API_KEY));
  const [cerebrasKey, setCerebrasKey] = useState(() => getStoredApiKey(STORAGE_KEYS.CEREBRAS_API_KEY));
  const [groqKey, setGroqKey] = useState(() => getStoredApiKey(STORAGE_KEYS.GROQ_API_KEY));
  const [ai33Key, setAi33Key] = useState(() => getStoredApiKey(STORAGE_KEYS.AI33_API_KEY));
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState(SecurityConstants.EMPTY_STRING);
  const [newPassword, setNewPassword] = useState(SecurityConstants.EMPTY_STRING);
  const [newRecovery, setNewRecovery] = useState(SecurityConstants.EMPTY_STRING);
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
  if (!licenseInfo || isLoading) {
    return <SettingsSkeleton />;
  }
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
    const newAcc = { id: Date.now(), email: _.trim(newEmail), password: _.trim(newPassword), recoveryEmail: _.trim(newRecovery) };
    const updated = [...accounts, newAcc];
    setAccounts(updated);
    try {
      await fetch(API_ROUTES.PIPELINE_ACCOUNTS, { method: REFACTOR_CONSTANTS.HTTP_METHOD_POST, headers: { [REFACTOR_CONSTANTS.HEADER_CONTENT_TYPE]: REFACTOR_CONSTANTS.MIME_JSON }, body: jsonUtils.safeStringify({ accounts: updated }) });
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
      await fetch(API_ROUTES.PIPELINE_ACCOUNTS, { method: REFACTOR_CONSTANTS.HTTP_METHOD_POST, headers: { [REFACTOR_CONSTANTS.HEADER_CONTENT_TYPE]: REFACTOR_CONSTANTS.MIME_JSON }, body: jsonUtils.safeStringify({ accounts: updated }) });
    } catch {}
    void jsonUtils.setAsyncItem(STORAGE_KEYS.LOCAL_GOOGLE_ACCOUNTS as string, updated);
  };
  const licenseTitle = isVietnamese ? SecurityConstants.LICENSE_MGMT_TITLE_VI : SecurityConstants.LICENSE_MGMT_TITLE_EN;
  const licenseTooltip = isVietnamese ? SecurityConstants.LICENSE_MGMT_TOOLTIP_VI : SecurityConstants.LICENSE_MGMT_TOOLTIP_EN;
  const planPrefix = isVietnamese ? SecurityConstants.PLAN_LABEL_VI : SecurityConstants.PLAN_LABEL_EN;
  const activatedLabel = isVietnamese ? SecurityConstants.ACTIVATED_LABEL_VI : SecurityConstants.ACTIVATED_LABEL_EN;
  const planType = _.get(licenseInfo, SecurityConstants.PROP_PLAN_TYPE);
  const planDisplayText = planType ? SOURCE_TEMPLATE_SYMBOL_16(`${planPrefix}`, `${planType}`) : activatedLabel;
  const keyPreview = licenseKey ? `${licenseKey.slice(SecurityConstants.ZERO, SecurityConstants.KEY_PREVIEW_LEN)}${SecurityConstants.ELLIPSIS}` : SecurityConstants.NOT_AVAILABLE;
  const logoutTooltip = isVietnamese ? SecurityMessages.LOGOUT_LABEL_TOOLTIP : SecurityConstants.LOGOUT_TOOLTIP_EN;
  const logoutLabel = isVietnamese ? SecurityMessages.LOGOUT_LABEL_SHORT : SecurityConstants.LOGOUT_LABEL_EN;
  const apiKeyTooltip = _.isEqual(currentLang, SOURCE_TEXT_EN) ? REFACTOR_CONSTANTS.API_KEY_DESC_TOOLTIP_EN : REFACTOR_CONSTANTS.API_KEY_DESC_TOOLTIP_VI;
  const apiKeyShort = _.isEqual(currentLang, SOURCE_TEXT_EN) ? REFACTOR_CONSTANTS.API_KEY_DESC_SHORT_EN : REFACTOR_CONSTANTS.API_KEY_DESC_SHORT_VI;
  const recoveryPlaceholder = _.isEqual(currentLang, SOURCE_TEXT_EN) ? REFACTOR_CONSTANTS.RECOVERY_PLACEHOLDER_SHORT_EN : REFACTOR_CONSTANTS.RECOVERY_PLACEHOLDER_SHORT_VI;
  const recoveryTooltip = _.isEqual(currentLang, SOURCE_TEXT_EN) ? REFACTOR_CONSTANTS.RECOVERY_PLACEHOLDER_TOOLTIP_EN : REFACTOR_CONSTANTS.RECOVERY_PLACEHOLDER_TOOLTIP_VI;
  const systemTooltip = _.isEqual(currentLang, SOURCE_TEXT_EN) ? REFACTOR_CONSTANTS.SYSTEM_DESC_TOOLTIP_EN : REFACTOR_CONSTANTS.SYSTEM_DESC_TOOLTIP_VI;
  const systemShort = _.isEqual(currentLang, SOURCE_TEXT_EN) ? REFACTOR_CONSTANTS.SYSTEM_DESC_SHORT_EN : REFACTOR_CONSTANTS.SYSTEM_DESC_SHORT_VI;
  const settingsExt = _.get(SETTINGS_EXTENDED_TEXTS, currentLang, SETTINGS_EXTENDED_TEXTS.vi);
  return (
    <StudioPage>
      <StudioCanvas>
        <StudioHeader
          icon={KeyRound}
          title={<span title={licenseTooltip}>{licenseTitle}</span>}
          description={
            <>
              <span className={cn(RT_SHARED.TRUNCATE)}>
                {planDisplayText}
                {SOURCE_TEXT_SYMBOL_18}
                {settingsExt.KEY_LABEL_PREFIX} <span className={cn(RT_SETTINGS.TEXT_SLATE_200_FONT_BOLD)}>{keyPreview}</span>
              </span>
            </>
          }
          actions={
            <Button variant={SOURCE_TEXT_DANGER} size={SOURCE_TEXT_SM} onClick={logoutLicense} title={logoutTooltip} className={cn(RT_SETTINGS.ROUNDED_2XL_FONT_BOLD_FLEX_ITEMS_CENTER_GAP_2_SHRINK)}>
              <LogOut className={cn(RT_SHARED.W_4_H_4)} />
              <span className={cn(RT_SHARED.TRUNCATE)}>{logoutLabel}</span>
            </Button>
          }>
          <span className={STUDIO_UI.BADGE}>
            <ShieldCheck className={STUDIO_UI.BADGE_ICON} />
            {settingsExt.ACTIVE_BADGE}
          </span>
        </StudioHeader>
        <div className={cn(RT_SETTINGS.GRID_GRID_COLS_1_MD_GRID_COLS_2_GAP_6)}>
          <StudioCard className={cn(RT_SETTINGS.GLASS_CARD_ROUNDED_3XL_P_6_SHADOW_MD_FLEX_FLEX)}>
            <div className={cn(RT_SETTINGS.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_BORDER_B_BORDER_SLATE_800)}>
              <div className={cn(RT_SETTINGS.FLEX_ITEMS_CENTER_GAP_3_MIN_W_0)}>
                <div className={cn(RT_SETTINGS.P_2_BG_AMBER_500_15_BORDER_BORDER_AMBER_500)}>
                  <Key className={cn(RT_SHARED.W_4_H_4)} />
                </div>
                <div className={cn(RT_SHARED.MIN_W_0)}>
                  <h3 className={cn(RT_SETTINGS.TEXT_XS_FONT_BLACK_TEXT_SLATE_100_UPPERCASE_FONT_MONO)} title={t.apiKeysConfig}>
                    {t.apiKeysConfig}
                  </h3>
                  <Tooltip content={apiKeyTooltip} position={SOURCE_TEXT_BOTTOM} align={SOURCE_TEXT_START}>
                    <p className={cn(RT_SETTINGS.TEXT_10PX_TEXT_SLATE_400_MT_0_5_CURSOR_HELP)}>{apiKeyShort}</p>
                  </Tooltip>
                </div>
              </div>
            </div>
            <div className={cn(RT_SHARED.SPACE_Y_4_FLEX_1)}>
              <ApiKeyField label={settingsExt.GEMINI_KEY_LABEL} value={geminiKey} placeholder={texts.GEMINI_PLACEHOLDER} onChange={setGeminiKey} />
              <ApiKeyField label={settingsExt.CEREBRAS_KEY_LABEL} value={cerebrasKey} placeholder={texts.CEREBRAS_PLACEHOLDER} onChange={setCerebrasKey} />
              <ApiKeyField label={settingsExt.GROQ_KEY_LABEL} value={groqKey} placeholder={texts.GROQ_PLACEHOLDER} onChange={setGroqKey} />
              <ApiKeyField label={settingsExt.AI33_KEY_LABEL} value={ai33Key} placeholder={texts.AI33_PLACEHOLDER} onChange={setAi33Key} />
            </div>
            <div className={cn(RT_SETTINGS.PT_4_MT_4_BORDER_T_BORDER_SLATE_800_80)}>
              <Button variant={SecurityConstants.BTN_VARIANT_PRIMARY} onClick={handleSaveKeys} disabled={isSavingKeys || _.every([geminiKey, cerebrasKey, groqKey, ai33Key], (key) => _.isEmpty(_.trim(key)))} title={texts.SAVE_BTN_TOOLTIP} className={cn(RT_SETTINGS.ROUNDED_XL_FLEX_ITEMS_CENTER_GAP_2_FONT_BOLD)}>
                {isSavingKeys ? <div className={cn(RT_SETTINGS.W_3_5_H_3_5_BORDER_2_BORDER_WHITE)} /> : <Save className={cn(RT_SHARED.W_3_5_H_3_5_SHRINK_0)} />}
                <span className={cn(RT_SHARED.TRUNCATE)}>{texts.SAVE_BTN}</span>
              </Button>
            </div>
          </StudioCard>
          <StudioCard className={cn(RT_SETTINGS.GLASS_CARD_ROUNDED_3XL_P_6_SHADOW_MD_FLEX_FLEX)}>
            <div className={cn(RT_SETTINGS.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_BORDER_B_BORDER_SLATE_800)}>
              <div className={cn(RT_SETTINGS.FLEX_ITEMS_CENTER_GAP_3_MIN_W_0)}>
                <div className={cn(RT_SETTINGS.P_2_BG_BLUE_500_15_BORDER_BORDER_BLUE_500)}>
                  <Users className={cn(RT_SHARED.W_4_H_4)} />
                </div>
                <div className={cn(RT_SHARED.MIN_W_0)}>
                  <h3 className={cn(RT_SETTINGS.TEXT_XS_FONT_BLACK_TEXT_SLATE_100_UPPERCASE_FONT_MONO)} title={texts.ACCOUNTS_TITLE}>
                    {texts.ACCOUNTS_TITLE}
                  </h3>
                  <Tooltip content={systemTooltip} position={SOURCE_TEXT_BOTTOM} align={SOURCE_TEXT_START}>
                    <p className={cn(RT_SETTINGS.TEXT_10PX_TEXT_SLATE_400_MT_0_5_CURSOR_HELP)}>
                      {systemShort}
                      {SOURCE_TEXT_SYMBOL_11}
                      {accounts.length}
                      {SOURCE_TEXT_SYMBOL_12}
                    </p>
                  </Tooltip>
                </div>
              </div>
            </div>
            <div className={cn(RT_SETTINGS.SPACE_Y_3_FLEX_1_FLEX_FLEX_COL)}>
              <div className={cn(RT_SHARED.GRID_GRID_COLS_2_GAP_2)}>
                <StudioInput type={SecurityConstants.INPUT_TYPE_TEXT} placeholder={texts.EMAIL_PLACEHOLDER} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={cn(RT_SETTINGS.H_10_BG_SLATE_955_90_BORDER_BORDER_SLATE_800)} />
                <StudioInput type={SecurityConstants.INPUT_TYPE_PASSWORD} placeholder={texts.PWD_PLACEHOLDER} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={cn(RT_SETTINGS.H_10_BG_SLATE_955_90_BORDER_BORDER_SLATE_800)} />
              </div>
              <div className={cn(RT_SETTINGS.FLEX_GAP_2)}>
                <StudioInput type={SecurityConstants.INPUT_TYPE_TEXT} placeholder={recoveryPlaceholder} title={recoveryTooltip} value={newRecovery} onChange={(e) => setNewRecovery(e.target.value)} className={cn(RT_SETTINGS.H_10_BG_SLATE_955_90_BORDER_BORDER_SLATE_800_099C46)} />
                <Button variant={SOURCE_TEXT_PRIMARY} onClick={handleAddAccount} disabled={_.isEmpty(_.trim(newEmail)) || _.isEmpty(_.trim(newPassword))} title={texts.ADD_BTN_TOOLTIP} className={cn(RT_SETTINGS.H_10_ROUNDED_XL_PX_4_DISABLED_OPACITY_50_SHRINK)}>
                  <Plus className={cn(RT_SHARED.W_4_H_4)} />
                </Button>
              </div>
              <div className={cn(RT_SETTINGS.MT_4_FLEX_1_OVERFLOW_Y_AUTO_MAX_H_150PX)}>
                {_.isEmpty(accounts) ? <div className={cn(RT_SETTINGS.TEXT_CENTER_TEXT_XS_TEXT_SLATE_500_PY_6_ITALIC)}>{texts.NO_ACCOUNTS}</div> : _.map(accounts, (acc) => <AccountItem key={acc.id} email={_.get(acc, SecurityConstants.PROP_EMAIL)} hiddenPwdText={texts.HIDDEN_PWD} onRemove={() => handleRemoveAccount(acc.id)} />)}
              </div>
            </div>
          </StudioCard>
        </div>
      </StudioCanvas>
    </StudioPage>
  );
}
