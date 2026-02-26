"use client";

import { useEffect, useState } from 'react';
import { X, AlertTriangle, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface LimitAlertProps {
    resourceType: 'tokens' | 'storage' | 'searches' | 'api_requests';
    percentage: number;
    tier: string;
}

export function LimitAlert({ resourceType, percentage, tier }: LimitAlertProps) {
    const t = useTranslations('admin.limit_alert');
    const [dismissed, setDismissed] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Verificar si ya fue dismissed en esta sesión
        const key = `limit-alert-dismissed-${resourceType}-${percentage >= 100 ? 100 : 80}`;
        const wasDismissed = sessionStorage.getItem(key);
        if (wasDismissed) {
            setDismissed(true);
        }
    }, [resourceType, percentage]);

    const handleDismiss = () => {
        const key = `limit-alert-dismissed-${resourceType}-${percentage >= 100 ? 100 : 80}`;
        sessionStorage.setItem(key, 'true');
        setDismissed(true);
    };

    const handleUpgrade = () => {
        router.push('/upgrade');
    };

    if (dismissed || percentage < 80) return null;

    const resourceNames: Record<string, string> = {
        tokens: t('resources.tokens'),
        storage: t('resources.storage'),
        searches: t('resources.searches'),
        api_requests: t('resources.api_requests'),
    };

    const isBlocked = percentage >= 100;

    return (
        <div
            className={`fixed top-4 right-4 max-w-md z-50 animate-in slide-in-from-top-2 duration-300 ${isBlocked ? 'bg-red-50 dark:bg-red-900/20 border-red-500' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
                } border-2 rounded-xl shadow-2xl p-4`}
        >
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isBlocked ? 'bg-red-100 dark:bg-red-900/50' : 'bg-amber-100 dark:bg-amber-900/50'}`}>
                    <AlertTriangle className={`w-6 h-6 ${isBlocked ? 'text-red-600' : 'text-amber-600'}`} />
                </div>

                <div className="flex-1">
                    <h3 className={`font-bold text-sm ${isBlocked ? 'text-red-900 dark:text-red-100' : 'text-amber-900 dark:text-amber-100'}`}>
                        {isBlocked ? `⚠️ ${t('exceeded_title')}` : `⚠️ ${t('warning_title')}`}
                    </h3>
                    <p className={`text-xs mt-1 ${isBlocked ? 'text-red-700 dark:text-red-200' : 'text-amber-700 dark:text-amber-200'}`}>
                        {isBlocked
                            ? t('exceeded_msg', { resource: resourceNames[resourceType] })
                            : t('warning_msg', { resource: resourceNames[resourceType], percentage: percentage.toFixed(0) })
                        }
                    </p>

                    {isBlocked && (
                        <p className="text-xs mt-2 font-semibold text-red-800 dark:text-red-100">
                            {t('suspended')}
                        </p>
                    )}

                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={handleUpgrade}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${isBlocked
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-amber-600 hover:bg-amber-700 text-white'
                                }`}
                        >
                            <Zap size={14} />
                            {t('upgrade')}
                        </button>
                        {!isBlocked && (
                            <button
                                onClick={handleDismiss}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all"
                            >
                                {t('dismiss')}
                            </button>
                        )}
                    </div>
                </div>

                {!isBlocked && (
                    <button
                        onClick={handleDismiss}
                        className="text-amber-500 hover:text-amber-700 transition-colors"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Modal de upgrade cuando se excede el límite
 */
export function LimitExceededModal({ onClose }: { onClose: () => void }) {
    const t = useTranslations('admin.limit_alert');
    const router = useRouter();

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        {t('modal.title')}
                    </h2>

                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        {t('modal.desc')}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/upgrade')}
                            className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/50 transition-all flex items-center justify-center gap-2"
                        >
                            <Zap size={18} />
                            {t('modal.view_plans')}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                        >
                            {t('modal.close')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
