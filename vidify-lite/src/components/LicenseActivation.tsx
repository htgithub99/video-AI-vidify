import React, { useState } from 'react';
import { useLicense } from '../contexts/LicenseContext';
import { KeyRound, Loader2, AlertCircle } from 'lucide-react';
export const LicenseActivation: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { licenseInfo, isLoading, activateLicense, logoutLicense } = useLicense();
    const [inputKey, setInputKey] = useState('');
    const [error, setError] = useState('');
    const [isActivating, setIsActivating] = useState(false);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="ml-3 text-lg font-medium">Đang kiểm tra bản quyền...</span>
            </div>
        );
    }

    if (!licenseInfo) {
        // Chưa có key hoặc key không hợp lệ
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
                <div className="w-full max-w-md bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-700">
                    <div className="flex flex-col items-center mb-8 text-center">
                        <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 border border-indigo-500/30">
                            <KeyRound className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Kích Hoạt Bản Quyền</h2>
                        <p className="text-gray-400">Vui lòng nhập License Key để sử dụng Vidify</p>
                    </div>
                    <form 
                        onSubmit={async (e) => {
                            e.preventDefault();
                            if (!inputKey.trim()) return;
                            setIsActivating(true);
                            setError('');
                            const success = await activateLicense(inputKey.trim());
                            if (!success) {
                                setError('Mã kích hoạt không hợp lệ, hoặc thiết bị bị từ chối.');
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
                                placeholder="Nhập License Key (VD: PRO-123...)"
                                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono"
                                required
                            />
                        </div>

                        {error && (
                            <div className="flex items-center p-3 text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg">
                                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isActivating || !inputKey.trim()}
                            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isActivating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Đang kích hoạt...
                                </>
                            ) : 'Kích Hoạt Ngay'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Đã có key hợp lệ -> Trả về ứng dụng chính
    return (
        <>
            {/* Banner nhỏ hiển thị thông tin gói trên cùng (nếu muốn) */}
            <div className="fixed top-0 right-0 z-50 p-4 pointer-events-none">
                <div className={`pointer-events-auto px-4 py-2 rounded-full shadow-lg backdrop-blur-md border flex items-center gap-3 transition-all ${
                    licenseInfo.plan_type === 'PRO' 
                    ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' 
                    : 'bg-gray-800/80 border-gray-700 text-gray-300'
                }`}>
                    <span className="text-sm font-medium">
                        {licenseInfo.plan_type === 'PRO' ? '👑 PRO Version' : '🆓 FREE Version'}
                    </span>
                    <button 
                        onClick={logoutLicense}
                        className="text-xs opacity-70 hover:opacity-100 transition-opacity underline"
                    >
                        Đổi Key
                    </button>
                </div>
            </div>

            {children}
        </>
    );
};
