import React, { useState, useEffect, FC, FormEvent } from 'react';
import { useLicense } from '../contexts/LicenseContext';
import { KeyRound, Loader2, AlertCircle, Check, X } from 'lucide-react';
import { SecurityMessages, PlanType, SecurityConstants, LicenseStatus } from '../constants/security';
import _ from 'lodash';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastMessageProps {
  type: 'error' | 'success';
  message: string;
  onClose: () => void;
}

const ActivationToast: FC<ToastMessageProps> = ({ type, message, onClose }) => {
  const isError = _.isEqual(type, 'error');
  const accentColor = isError ? 'bg-rose-500' : 'bg-emerald-500';
  const textColor = isError ? 'text-rose-500' : 'text-emerald-500';
  const title = isError ? SecurityMessages.TOAST_ERROR : SecurityMessages.TOAST_SUCCESS;
  const shadowColor = isError ? 'shadow-rose-950/20' : 'shadow-emerald-950/20';
  const bgBarColor = isError ? 'bg-rose-500/10' : 'bg-emerald-500/10';

  return (
    <motion.div
      key={type}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      className={`bg-slate-900 shadow-2xl ${shadowColor} p-4 rounded-xl text-slate-200 text-xs flex items-start gap-3 pointer-events-auto max-w-sm border border-slate-800 relative overflow-hidden`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accentColor}`} />
      {isError ? (
        <AlertCircle className={`w-4.5 h-4.5 ${textColor} shrink-0 mt-0.5 ml-1`} />
      ) : (
        <Check className={`w-4.5 h-4.5 ${textColor} shrink-0 mt-0.5 ml-1 animate-pulse`} />
      )}
      <div className="flex-grow flex flex-col gap-0.5 text-left">
        <span className={`text-[10px] uppercase font-mono font-bold ${textColor} tracking-wider`}>
          {title}
        </span>
        <p className="leading-snug text-slate-300 font-medium">{message}</p>
      </div>
      <button
        type={SecurityConstants.BUTTON_TYPE_BUTTON}
        onClick={onClose}
        className="text-slate-500 hover:text-slate-200 shrink-0 p-0.5 hover:bg-slate-850 rounded shadow-none h-auto w-auto transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${bgBarColor}`}>
        <div className={`h-full ${accentColor} animate-shrinkWidth`} />
      </div>
    </motion.div>
  );
};

export const LicenseActivation: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { licenseInfo, isLoading, activateLicense, logoutLicense } = useLicense();
  const [inputKey, setInputKey] = useState(() => {
    const envKey =
      (import.meta as any).env?.VITE_LICENSE_KEY ||
      (import.meta as any).env?.VIDIFY_LICENSE_KEY ||
      (import.meta as any).env?.LICENSE_KEY;
    return !_.isEmpty(envKey) ? _.trim(envKey) : SecurityConstants.DEFAULT_LICENSE_KEY;
  });
  const [errorMsg, setErrorMsg] = useState(SecurityConstants.EMPTY_STRING);
  const [successMsg, setSuccessMsg] = useState(SecurityConstants.EMPTY_STRING);
  const [isActivating, setIsActivating] = useState(false);

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

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanKey = _.trim(inputKey);
    if (_.isEmpty(cleanKey)) return;

    setIsActivating(true);
    setErrorMsg(SecurityConstants.EMPTY_STRING);
    setSuccessMsg(SecurityConstants.EMPTY_STRING);

    const result = await activateLicense(cleanKey);
    if (result !== true) {
      setErrorMsg(_.isString(result) ? result : SecurityMessages.ACTIVATION_ERROR_MSG);
    } else {
      setSuccessMsg(SecurityMessages.ACTIVATION_SUCCESS_MSG);
      setTimeout(() => setSuccessMsg(SecurityConstants.EMPTY_STRING), SecurityConstants.TOAST_DURATION);
    }
    setIsActivating(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-955 text-slate-205">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        <span className="ml-3 text-lg font-medium">{SecurityMessages.ACTIVATING_MESSAGE}</span>
      </div>
    );
  }

  if (_.isNil(licenseInfo)) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen bg-slate-955 p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-lg p-8 border border-transparent">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-4 border border-rose-500/30">
                <KeyRound className="w-8 h-8 text-rose-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-205 mb-2">{SecurityMessages.ACTIVATION_TITLE}</h2>
              <p className="text-slate-400" title={SecurityMessages.ACTIVATION_SUBTITLE_TOOLTIP}>
                {SecurityMessages.ACTIVATION_SUBTITLE_SHORT}
              </p>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <input
                  type={SecurityConstants.INPUT_TYPE_TEXT}
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder={SecurityMessages.INPUT_PLACEHOLDER_SHORT}
                  title={SecurityMessages.INPUT_PLACEHOLDER_TOOLTIP}
                  className="w-full px-4 py-3 bg-slate-850 border border-transparent rounded-md text-slate-205 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus-within:bg-slate-850 transition-all font-mono"
                  required
                />
              </div>

              <button
                type={SecurityConstants.BUTTON_TYPE_SUBMIT}
                title={SecurityMessages.ACTIVATE_BUTTON}
                disabled={_.some([isActivating, _.isEmpty(_.trim(inputKey))])}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isActivating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {SecurityMessages.ACTIVATING_BUTTON}
                  </>
                ) : (
                  SecurityMessages.ACTIVATE_BUTTON
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="fixed bottom-6 right-6 z-[999999] flex flex-col gap-3 pointer-events-none">
          <AnimatePresence>
            {!_.isEmpty(errorMsg) && (
              <ActivationToast
                type="error"
                message={errorMsg}
                onClose={() => setErrorMsg(SecurityConstants.EMPTY_STRING)}
              />
            )}
            {!_.isEmpty(successMsg) && (
              <ActivationToast
                type="success"
                message={successMsg}
                onClose={() => setSuccessMsg(SecurityConstants.EMPTY_STRING)}
              />
            )}
          </AnimatePresence>
        </div>
      </>
    );
  }

  const isProPlan = _.includes(licenseInfo.plan_type, PlanType.PRO);
  const isRevoked = _.isEqual(licenseInfo.status, LicenseStatus.REVOKED);

  return (
    <>
      <div className="fixed top-0 right-0 z-50 p-4 pointer-events-none flex flex-col gap-2 items-end">
        {licenseInfo.status !== LicenseStatus.ACTIVE && (
          <div
            className="pointer-events-auto px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center gap-2 shadow-sm"
            title={isRevoked ? SecurityMessages.REVOKED_STATUS : SecurityMessages.EXPIRED_STATUS}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-xs font-bold tracking-wide">
              {isRevoked ? SecurityMessages.REVOKED_STATUS_SHORT : SecurityMessages.EXPIRED_STATUS_SHORT}
            </span>
          </div>
        )}
        <div
          className={`pointer-events-auto px-4 py-2 rounded-full border flex items-center gap-3 transition-all ${
            isProPlan
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
              : 'bg-slate-850 border-transparent text-slate-400'
          }`}
        >
          <span className="text-xs font-bold tracking-wide">
            {isProPlan ? SecurityMessages.PRO_VERSION : SecurityMessages.FREE_VERSION}
          </span>
          <button
            onClick={logoutLicense}
            title={SecurityMessages.CHANGE_KEY}
            className="text-xs font-medium px-2 py-1 bg-slate-955 rounded hover:bg-slate-900 transition-colors"
          >
            {SecurityMessages.CHANGE_KEY}
          </button>
        </div>
      </div>
      {children}
    </>
  );
};
