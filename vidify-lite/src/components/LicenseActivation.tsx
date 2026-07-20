import React, { useState, useEffect } from 'react';
import { useLicense } from '../contexts/LicenseContext';
import { KeyRound, Loader2, AlertCircle } from 'lucide-react';
import { SecurityMessages, PlanType } from '../constants/security';
import _ from 'lodash';

export const LicenseActivation: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { licenseInfo, isLoading, activateLicense, logoutLicense } = useLicense();
    const [inputKey, setInputKey] = useState('');
    const [error, setError] = useState('');
    const [isActivating, setIsActivating] = useState(false);

    useEffect(() => {
        if (!isLoading && _.isNil(licenseInfo)) {
            const loader = document.getElementById('app-loading');
            if (!_.isNil(loader)) {
                loader.classList.add('fade-out');
                setTimeout(() => {
                    loader.remove();
                }, 400);
            }
        }
    }, [isLoading, licenseInfo]);

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
            <div className="flex items-center justify-center min-h-screen bg-slate-955 p-4">
                <div className="w-full max-w-md bg-slate-900 rounded-lg p-8 border border-transparent">
                    <div className="flex flex-col items-center mb-8 text-center">
                        <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-4 border border-rose-500/30">
                            <KeyRound className="w-8 h-8 text-rose-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-205 mb-2">{SecurityMessages.ACTIVATION_TITLE}</h2>
                        <p className="text-slate-400">{SecurityMessages.ACTIVATION_SUBTITLE}</p>
                    </div>
                    <form 
                        onSubmit={async (e) => {
                            e.preventDefault();
                            if (_.isEmpty(inputKey.trim())) return;
                            setIsActivating(true);
                            setError('');
                            const success = await activateLicense(inputKey.trim());
                            if (!success) {
                                setError(SecurityMessages.ACTIVATION_ERROR_MSG);
                            }
                            setIsActivating(false);
                        }}
                        className="space-y-6"
                    >
                        <div>
                            <input
                                type="text"
                                value={inputKey}
                                onChange={(e) => setInputKey(e.target.value)}
                                placeholder={SecurityMessages.INPUT_PLACEHOLDER}
                                className="w-full px-4 py-3 bg-slate-850 border border-transparent rounded-md text-slate-205 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus-within:bg-slate-850 transition-all font-mono"
                                required
                            />
                        </div>

                        {!_.isEmpty(error) && (
                            <div className="flex items-center p-3 text-red-400 bg-red-400/10 border border-red-400/20 rounded-md">
                                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isActivating || _.isEmpty(inputKey.trim())}
                            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isActivating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    {SecurityMessages.ACTIVATING_BUTTON}
                                </>
                            ) : SecurityMessages.ACTIVATE_BUTTON}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="fixed top-0 right-0 z-50 p-4 pointer-events-none">
                <div className={`pointer-events-auto px-4 py-2 rounded-full border flex items-center gap-3 transition-all ${
                    _.includes(licenseInfo.plan_type, PlanType.PRO) 
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
                    : 'bg-slate-850 border-transparent text-slate-400'
                }`}>
                    <span className="text-sm font-medium">
                        {_.includes(licenseInfo.plan_type, PlanType.PRO) ? SecurityMessages.PRO_VERSION : SecurityMessages.FREE_VERSION}
                    </span>
                    <button 
                        onClick={logoutLicense}
                        className="text-xs opacity-70 hover:opacity-100 hover:text-rose-400 transition-colors underline"
                    >
                        {SecurityMessages.CHANGE_KEY}
                    </button>
                </div>
            </div>
            {children}
        </>
    );
};
