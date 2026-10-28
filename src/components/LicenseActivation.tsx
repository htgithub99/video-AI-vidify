import { RUNTIME_TEXT as RT_UI } from "../constants/runtime/ui.js";
import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
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
    <motion.div key={type} initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }} className={cn(RT_UI.BG_SLATE_900_SHADOW_2XL_P_4_ROUNDED_XL_TEXT, shadowColor)}>
      <div className={cn(RT_UI.ABSOLUTE_LEFT_0_TOP_0_BOTTOM_0_W_1_5, accentColor)} />
      {isError ? <AlertCircle className={cn(RT_UI.W_4_5_H_4_5_SHRINK_0_MT_0, textColor)} /> : <Check className={cn(RT_UI.W_4_5_H_4_5_SHRINK_0_MT_0_37BFB2, textColor)} />}
      <div className={cn(RT_UI.FLEX_GROW_FLEX_FLEX_COL_GAP_0_5_TEXT_LEFT)}>
        <span className={cn(RT_UI.TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER, textColor)}>{title}</span>
        <p className={cn(RT_UI.LEADING_SNUG_TEXT_SLATE_300_FONT_MEDIUM)}>{message}</p>
      </div>
      <Button variant={SOURCE_TEXT_UNSTYLED} type={SecurityConstants.BUTTON_TYPE_BUTTON} onClick={onClose} className={cn(RT_UI.TEXT_SLATE_500_HOVER_TEXT_SLATE_200_SHRINK_0_P)}>
        <X className={cn(RT_SHARED.W_3_5_H_3_5)} />
      </Button>
      <div className={cn(RT_UI.ABSOLUTE_BOTTOM_0_LEFT_0_RIGHT_0_H_0_5, bgBarColor)}>
        <div className={cn(RT_UI.H_FULL_ANIMATE_SHRINKWIDTH, accentColor)} />
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
      <div className={cn(RT_UI.FLEX_ITEMS_CENTER_JUSTIFY_CENTER_MIN_H_SCREEN_BG_SLATE)}>
        <StudioCard className={cn(RT_UI.W_FULL_MAX_W_MD_GLASS_CARD_ROUNDED_3XL_P)}>
          <div className={cn(RT_UI.FLEX_FLEX_COL_ITEMS_CENTER_SPACE_Y_4)}>
            <div className={cn(RT_UI.W_18_H_18_ROUNDED_3XL_SKELETON_SHIMMER)} />
            <div className={cn(RT_UI.W_48_H_6_ROUNDED_XL_SKELETON_SHIMMER)} />
            <div className={cn(RT_UI.W_64_H_3_5_ROUNDED_LG_SKELETON_SHIMMER)} />
          </div>
          <div className={cn(RT_UI.SPACE_Y_4_PT_2)}>
            <div className={cn(RT_UI.W_FULL_H_12_ROUNDED_2XL_SKELETON_SHIMMER)} />
            <div className={cn(RT_UI.W_FULL_H_12_ROUNDED_2XL_SKELETON_SHIMMER)} />
          </div>
        </StudioCard>
      </div>
    );
  }
  if (_.isNil(licenseInfo)) {
    return (
      <>
        <div className={cn(RT_UI.FLEX_ITEMS_CENTER_JUSTIFY_CENTER_MIN_H_SCREEN_BG_SLATE)}>
          <div className={cn(RT_UI.ABSOLUTE_TOP_1_4_LEFT_1_2_TRANSLATE_X_1)} />
          <div className={cn(RT_UI.ABSOLUTE_BOTTOM_10_RIGHT_10_W_96_H_96_BG)} />
          <StudioCard className={cn(RT_UI.W_FULL_MAX_W_MD_GLASS_CARD_ROUNDED_3XL_P_C97FAA)}>
            <div className={cn(RT_UI.FLEX_FLEX_COL_ITEMS_CENTER_TEXT_CENTER_MB_8)}>
              <div className={cn(RT_UI.W_18_H_18_BG_GRADIENT_TO_TR_FROM_ROSE)}>
                <KeyRound className={cn(RT_UI.W_9_H_9_TEXT_WHITE)} />
              </div>
              <h2 className={cn(RT_UI.TEXT_2XL_FONT_EXTRABOLD_TEXT_WHITE_MB_2_FONT_LOGO)}>{SecurityMessages.ACTIVATION_TITLE}</h2>
              <p className={cn(RT_UI.TEXT_XS_TEXT_SLATE_400_MAX_W_XS_LEADING_RELAXED)} title={SecurityMessages.ACTIVATION_SUBTITLE_TOOLTIP}>
                {SecurityMessages.ACTIVATION_SUBTITLE_SHORT}
              </p>
            </div>
            <form onSubmit={handleFormSubmit} className={cn(RT_UI.SPACE_Y_5)}>
              <div>
                <StudioInput type={SecurityConstants.INPUT_TYPE_TEXT} value={inputKey} onChange={(e) => setInputKey(e.target.value)} placeholder={SecurityMessages.INPUT_PLACEHOLDER_SHORT} title={SecurityMessages.INPUT_PLACEHOLDER_TOOLTIP} className={cn(RT_UI.W_FULL_PX_4_PY_3_BG_SLATE_950_80)} required />
              </div>
              <Button variant={SOURCE_TEXT_UNSTYLED} type={SecurityConstants.BUTTON_TYPE_SUBMIT} title={SecurityMessages.ACTIVATE_BUTTON} disabled={_.some([isActivating, _.isEmpty(_.trim(inputKey))])} className={cn(RT_UI.W_FULL_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_PY_3_5, isActivating && RT_UI.BUTTON_SKELETON_LOADING_OPACITY_90_CURSOR_WAIT)}>
                {isActivating ? (
                  <span className={cn(RT_UI.INLINE_FLEX_ITEMS_CENTER_GAP_2_RELATIVE_Z_10)}>
                    <Sparkles className={cn(RT_UI.W_4_H_4_ANIMATE_SPIN)} />
                    <span className={cn(RT_UI.ANIMATE_PULSE)}>{SecurityMessages.ACTIVATING_BUTTON}</span>
                  </span>
                ) : (
                  SecurityMessages.ACTIVATE_BUTTON
                )}
              </Button>
            </form>
          </StudioCard>
        </div>
        <div className={cn(RT_UI.FIXED_BOTTOM_6_RIGHT_6_Z_999999_FLEX_FLEX_COL)}>
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
        <div className={cn(RT_UI.FIXED_TOP_0_RIGHT_0_Z_50_P_4_POINTER)}>
          <div className={cn(RT_UI.POINTER_EVENTS_AUTO_PX_4_PY_1_5_ROUNDED_FULL)} title={isRevoked ? SecurityMessages.REVOKED_STATUS : SecurityMessages.EXPIRED_STATUS}>
            <AlertCircle className={cn(RT_SHARED.W_3_5_H_3_5)} />
            <span className={cn(RT_UI.TEXT_XS_FONT_BOLD_TRACKING_WIDE)}>{isRevoked ? SecurityMessages.REVOKED_STATUS_SHORT : SecurityMessages.EXPIRED_STATUS_SHORT}</span>
          </div>
        </div>
      )}
      {children}
    </>
  );
};
