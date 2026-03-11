"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, UserPlus, Shield, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, User, Hash, Globe } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

interface InviteInfo {
    email: string;
    tenantName: string;
    role: string;
}

export default function SignupInvitePage({ params }: { params: Promise<{ token: string }> }) {
    const t = useTranslations('auth.signup');
    const { token } = use(params);
    const router = useRouter();

    const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        password: "",
        confirmPassword: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const res = await fetch(`/api/auth/invite/verify?token=${token}`);
                const data = await res.json();

                if (res.ok && data.valid) {
                    setInviteInfo(data.invite);
                } else {
                    setError(data.error?.message || t('invalidInvite'));
                }
            } catch (err) {
                setError(t('serverError'));
            } finally {
                setVerifying(false);
                setLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError(t('passwordMismatch'));
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/auth/invite/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    password: formData.password,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                setError(data.error?.message || t('acceptError'));
            }
        } catch (err) {
            setError(t('networkError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-500 mx-auto mb-4" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">{t('verifying')}</p>
                </div>
            </div>
        );
    }

    if (error && !success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-outfit">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-slate-900/50 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-red-500/20 shadow-2xl text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">{t('invalidInvite')}</h2>
                        <p className="text-slate-500 text-sm mb-8 font-medium">
                            {error}
                        </p>
                        <Button asChild className="w-full h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-xl">
                            <Link href="/">{t('backToHome')}</Link>
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-outfit">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-slate-900/50 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-teal-500/20 shadow-2xl text-center">
                        <div className="mx-auto w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center mb-8 border border-teal-500/20">
                            <CheckCircle2 className="h-10 w-10 text-teal-500" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-4">{t('successTitle')}</h2>
                        <p className="text-slate-400 text-sm mb-10 font-medium leading-relaxed">
                            {t('successMessage')}
                        </p>
                        <div className="flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-teal-500 opacity-50" />
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-6 font-outfit selection:bg-teal-500/30">
            {/* 🌌 Cinematic Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[140px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[140px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            </div>

            <div className="w-full max-w-4xl relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Industrial Header & Meta (Sidebar-ish) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="text-left">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-600 to-teal-400 rounded-3xl shadow-xl shadow-teal-500/20 mb-6"
                            >
                                <UserPlus className="text-white h-8 w-8" />
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-4xl font-black text-white tracking-tight leading-none"
                            >
                                {t('title').split(' ')[0]} <span className="text-teal-500">{t('title').split(' ').slice(1).join(' ')}</span>
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-slate-500 mt-4 text-sm font-medium leading-relaxed"
                            >
                                {t('subtitle')}
                            </motion.p>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-[2rem] p-6 space-y-6"
                        >
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Deployment Details</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                                            <Globe size={14} className="text-teal-500" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-500 uppercase block tracking-widest">Organización</label>
                                            <span className="text-xs font-bold text-white">{inviteInfo?.tenantName}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                                            <Hash size={14} className="text-teal-500" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-500 uppercase block tracking-widest">Operativo</label>
                                            <span className="text-xs font-bold text-teal-500">{inviteInfo?.role}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                                            <Lock size={14} className="text-teal-500" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-500 uppercase block tracking-widest">Protocolo</label>
                                            <span className="text-xs font-mono font-bold text-slate-400">AES-256 HMAC</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-slate-800/50">
                                <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/60">
                                    <p className="text-[9px] font-mono text-slate-500 leading-tight">
                                        TERMINAL: INVITE_STUB_v4<br />
                                        STATUS: READY_FOR_ENROLLMENT
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Main Form Center */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-8"
                    >
                        <div className="bg-slate-900/40 backdrop-blur-3xl border border-slate-800/60 rounded-[2.5rem] p-10 shadow-2xl">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{t('firstName')}</label>
                                        <Input
                                            id="firstName"
                                            required
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="h-14 bg-slate-800/30 border-slate-800 rounded-2xl focus:border-teal-500/50 text-white placeholder:text-slate-600"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{t('lastName')}</label>
                                        <Input
                                            id="lastName"
                                            required
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            className="h-14 bg-slate-800/30 border-slate-800 rounded-2xl focus:border-teal-500/50 text-white placeholder:text-slate-600"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{t('password')}</label>
                                    <div className="relative group/input">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="h-14 bg-slate-800/30 border-slate-800 rounded-2xl focus:border-teal-500/50 text-white placeholder:text-slate-600 pr-12"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-teal-400 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{t('confirmPassword')}</label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="h-14 bg-slate-800/30 border-slate-800 rounded-2xl focus:border-teal-500/50 text-white placeholder:text-slate-600"
                                        placeholder="••••••••"
                                    />
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-3"
                                    >
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        {error}
                                    </motion.div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-14 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-black text-base rounded-2xl shadow-xl shadow-teal-600/20 transition-all border border-teal-400/20 active:scale-[0.98]"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            {t('creatingAccount')}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            {t('createAccount')}
                                            <ArrowRight size={20} />
                                        </div>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 text-center text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4"
                >
                    <span className="w-12 h-[1px] bg-slate-800/50" />
                    <span>
                        {t('termsPrefix')} <Link href="/terms" className="text-slate-500 hover:text-teal-500 transition-colors underline decoration-slate-800 hover:decoration-teal-500">{t('termsLink')}</Link> {t('and')} <Link href="/privacy" className="text-slate-500 hover:text-teal-500 transition-colors underline decoration-slate-800 hover:decoration-teal-500">{t('privacyLink')}</Link>
                    </span>
                    <span className="w-12 h-[1px] bg-slate-800/50" />
                </motion.div>
            </div>
        </div>
    );
}
