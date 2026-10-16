import { StudioCard, StudioInput } from "./ui/Studio.js";
import { SOURCE_TEXT_BG_EMERALD_500, SOURCE_TEXT_BG_EMERALD_500_10, SOURCE_TEXT_BG_ROSE_500, SOURCE_TEXT_BG_ROSE_500_10, SOURCE_TEXT_ERROR, SOURCE_TEXT_SHADOW_EMERALD_950_20, SOURCE_TEXT_SHADOW_ROSE_950_20, SOURCE_TEXT_STATUS, SOURCE_TEXT_SUCCESS, SOURCE_TEXT_TEXT_EMERALD_500, SOURCE_TEXT_TEXT_ROSE_500, SOURCE_TEXT_UNSTYLED } from "../constants/sourceText";
import React, { useState, useEffect, FC, FormEvent, useCallback, useMemo } from "react";
import { useLicense } from "../contexts/LicenseContext";
import { KeyRound, Sparkles, AlertCircle, Check, X } from "lucide-react";
import { SecurityMessages, SecurityConstants, LicenseStatus, getClientEnvironmentLicenseKey } from "../constants/security";
import _ from "lodash";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
interface ToastMessageProps {
  type: "error" | "success";
  message: string;
  onClose: () => void;
}
const ActivationToast: FC<ToastMessageProps> = ({ type, message, onClose }) => {
  const isError = _.isEqual(type, SOURCE_TEXT_ERROR);
  const accentColor = isError ? SOURCE_TEXT_BG_ROSE_500 : SOURCE_TEXT_BG_EMERALD_500;
  const textColor = isError ? SOURCE_TEXT_TEXT_ROSE_500 : SOURCE_TEXT_TEXT_EMERALD_500;
  const title = isError ? SecurityMessages.TOAST_ERROR : SecurityMessages.TOAST_SUCCESS;
  const shadowColor = isError ? SOURCE_TEXT_SHADOW_ROSE_950_20 : SOURCE_TEXT_SHADOW_EMERALD_950_20;
  const bgBarColor = isError ? SOURCE_TEXT_BG_ROSE_500_10 : SOURCE_TEXT_BG_EMERALD_500_10;
  return (
    <motion.div key={type} initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }} className={cn("bg-slate-900 shadow-2xl p-4 rounded-xl text-slate-200 text-xs flex items-start gap-3 pointer-events-auto max-w-sm border border-slate-800 relative overflow-hidden", shadowColor)}>
      <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", accentColor)} />
      {isError ? <AlertCircle className={cn("w-4.5 h-4.5 shrink-0 mt-0.5 ml-1", textColor)} /> : <Check className={cn("w-4.5 h-4.5 shrink-0 mt-0.5 ml-1 animate-pulse", textColor)} />}
      <div className={cn("flex-grow flex flex-col gap-0.5 text-left")}>
        <span className={cn("text-[10px] uppercase font-mono font-bold tracking-wider", textColor)}>{title}</span>
        <p className={cn("leading-snug text-slate-300 font-medium")}>{message}</p>
      </div>
      <Button variant={SOURCE_TEXT_UNSTYLED} type={SecurityConstants.BUTTON_TYPE_BUTTON} onClick={onClose} className={cn("text-slate-500 hover:text-slate-200 shrink-0 p-0.5 hover:bg-slate-850 rounded shadow-none h-auto w-auto transition-colors")}>
        <X className={cn("w-3.5 h-3.5")} />
      </Button>
      <div className={cn("absolute bottom-0 left-0 right-0 h-0.5", bgBarColor)}>
        <div className={cn("h-full animate-shrinkWidth", accentColor)} />
      </div>
    </motion.div>
  );
};
export const LicenseActivation: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { licenseInfo, isLoading, activateLicense } = useLicense();
  const [inputKey, setInputKey] = useState<string>(getClientEnvironmentLicenseKey);
  const [errorMsg, setErrorMsg] = useState<string>(SecurityConstants.EMPTY_STRING);
  const [successMsg, setSuccessMsg] = useState<string>(SecurityConstants.EMPTY_STRING);
  const [isActivating, setIsActivating] = useState<boolean>(false);
  useEffect(() => {
    if (!isLoading && _.isNil(licenseInfo)) {
      const loader = document.getElementById(SecurityConstants.DOM_ID_APP_LOADING);
      if (!_.isNil(loader)) {
        loader.classList.add(SecurityConstants.CLASS_FADE_OUT);
        setTimeout(() => {
          loader.remove();
        }, SecurityConstants.DELAY_FADE_OUT);
      }
    }
  }, [isLoading, licenseInfo]);
  const handleFormSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const cleanKey = _.trim(inputKey);
      if (_.isEmpty(cleanKey)) return;
      setIsActivating(true);
      setErrorMsg(SecurityConstants.EMPTY_STRING);
      setSuccessMsg(SecurityConstants.EMPTY_STRING);
      const result = await activateLicense(cleanKey);
      if (result !== true) setErrorMsg(_.isString(result) ? result : SecurityMessages.ACTIVATION_ERROR_MSG);
      else {
        setSuccessMsg(SecurityMessages.ACTIVATION_SUCCESS_MSG);
        setTimeout(() => setSuccessMsg(SecurityConstants.EMPTY_STRING), SecurityConstants.TOAST_DURATION);
      }
      setIsActivating(false);
    },
    [activateLicense, inputKey],
  );
  const isRevoked = useMemo(() => _.isEqual(_.get(licenseInfo, SOURCE_TEXT_STATUS), LicenseStatus.REVOKED), [licenseInfo]);
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center min-h-screen bg-slate-955 p-4 relative overflow-hidden")}>
        <StudioCard className={cn("w-full max-w-md glass-card rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 border border-slate-800/80 space-y-6")}>
          <div className={cn("flex flex-col items-center space-y-4")}>
            <div className={cn("w-18 h-18 rounded-3xl skeleton-shimmer")} />
            <div className={cn("w-48 h-6 rounded-xl skeleton-shimmer")} />
            <div className={cn("w-64 h-3.5 rounded-lg skeleton-shimmer")} />
          </div>
          <div className={cn("space-y-4 pt-2")}>
            <div className={cn("w-full h-12 rounded-2xl skeleton-shimmer")} />
            <div className={cn("w-full h-12 rounded-2xl skeleton-shimmer")} />
          </div>
        </StudioCard>
      </div>
    );
  }
  if (_.isNil(licenseInfo)) {
    return (
      <>
        <div className={cn("flex items-center justify-center min-h-screen bg-slate-955 p-4 relative overflow-hidden")}>
          <div className={cn("absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none")} />
          <div className={cn("absolute bottom-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none")} />
          <StudioCard className={cn("w-full max-w-md glass-card rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 border border-slate-800/80")}>
            <div className={cn("flex flex-col items-center text-center mb-8")}>
              <div className={cn("w-18 h-18 bg-gradient-to-tr from-rose-600 to-amber-500 rounded-3xl flex items-center justify-center mb-5 shadow-lg shadow-rose-500/25 ring-2 ring-white/20")}>
                <KeyRound className={cn("w-9 h-9 text-white")} />
              </div>
              <h2 className={cn("text-2xl font-extrabold text-white mb-2 font-logo tracking-tight truncate")}>{SecurityMessages.ACTIVATION_TITLE}</h2>
              <p className={cn("text-xs text-slate-400 max-w-xs leading-relaxed truncate")} title={SecurityMessages.ACTIVATION_SUBTITLE_TOOLTIP}>
                {SecurityMessages.ACTIVATION_SUBTITLE_SHORT}
              </p>
            </div>
            <form onSubmit={handleFormSubmit} className={cn("space-y-5")}>
              <div>
                <StudioInput
                  type={SecurityConstants.INPUT_TYPE_TEXT}
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder={SecurityMessages.INPUT_PLACEHOLDER_SHORT}
                  title={SecurityMessages.INPUT_PLACEHOLDER_TOOLTIP}
                  className={cn("w-full px-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-rose-500 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none transition-all font-mono text-center text-xs tracking-wider")}
                  required
                />
              </div>
              <Button
                variant={SOURCE_TEXT_UNSTYLED}
                type={SecurityConstants.BUTTON_TYPE_SUBMIT}
                title={SecurityMessages.ACTIVATE_BUTTON}
                disabled={_.some([isActivating, _.isEmpty(_.trim(inputKey))])}
                className={cn(
                  "w-full flex items-center justify-center py-3.5 px-4 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-lg shadow-rose-600/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                  isActivating && "button-skeleton-loading opacity-90 cursor-wait",
                )}>
                {isActivating ? (
                  <span className={cn("inline-flex items-center gap-2 relative z-10")}>
                    <Sparkles className={cn("w-4 h-4 animate-spin")} />
                    <span className={cn("animate-pulse")}>{SecurityMessages.ACTIVATING_BUTTON}</span>
                  </span>
                ) : (
                  SecurityMessages.ACTIVATE_BUTTON
                )}
              </Button>
            </form>
          </StudioCard>
        </div>
        <div className={cn("fixed bottom-6 right-6 z-[999999] flex flex-col gap-3 pointer-events-none")}>
          <AnimatePresence>
            {!_.isEmpty(errorMsg) && <ActivationToast type={SOURCE_TEXT_ERROR} message={errorMsg} onClose={() => setErrorMsg(SecurityConstants.EMPTY_STRING)} />}
            {!_.isEmpty(successMsg) && <ActivationToast type={SOURCE_TEXT_SUCCESS} message={successMsg} onClose={() => setSuccessMsg(SecurityConstants.EMPTY_STRING)} />}
          </AnimatePresence>
        </div>
      </>
    );
  }
  return (
    <>
      {licenseInfo.status !== LicenseStatus.ACTIVE && (
        <div className={cn("fixed top-0 right-0 z-50 p-4 pointer-events-none flex flex-col gap-2 items-end")}>
          <div className={cn("pointer-events-auto px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center gap-2 shadow-sm")} title={isRevoked ? SecurityMessages.REVOKED_STATUS : SecurityMessages.EXPIRED_STATUS}>
            <AlertCircle className={cn("w-3.5 h-3.5")} />
            <span className={cn("text-xs font-bold tracking-wide")}>{isRevoked ? SecurityMessages.REVOKED_STATUS_SHORT : SecurityMessages.EXPIRED_STATUS_SHORT}</span>
          </div>
        </div>
      )}
      {children}
    </>
  );
};
