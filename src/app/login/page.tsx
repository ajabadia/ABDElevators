"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, Eye, EyeOff, ArrowRight, Shield, Search, AlertCircle } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
    console.log("🚀 [CLIENT] LoginPage mounted - Version 1.2 DEBUG");
    const t = useTranslations('login');
    const router = useRouter();
    const [isMagicLink, setIsMagicLink] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [requiresMfa, setRequiresMfa] = useState(false);
    const [mfaCode, setMfaCode] = useState("");

    // Nota: El chequeo de mfaPending en sesión ya no es necesario 
    // porque ahora lanzamos un error en lugar de crear una sesión parcial.

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch('/api/auth/magic-link/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || t('error_generic'));
            }

            setSuccess(t('magic_link_sent'));
            // Optional: clear email or keep it? Keep it for convenience.
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : t('error_generic'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            console.log("🔐 [LOGIN] Attempting signIn with:", { email, hasMfaCode: !!mfaCode });
            const result = await signIn("credentials", {
                email,
                password,
                mfaCode: requiresMfa ? mfaCode : undefined,
                redirect: false,
            });

            console.log("📡 [LOGIN] signIn result summary:", {
                ok: result?.ok,
                error: result?.error,
                url: result?.url,
                code: (result as any)?.code
            });

            // 1. signIn in v5 returns if it succeeded. We can rely on that or a single check.
            // If redirect is false, we stay here. MFA check is handled by signIn result or separate path.

            if (result?.error) {
                // MEGA ERROR TRACE: Dump everything for debugging
                console.log("🔍 [LOGIN] MEGA ERROR TRACE:", JSON.stringify(result, null, 2));

                const errorCode = (result as any).code || result.error;

                // Handle legacy or explicit error codes if they happen to bypass normalization
                if (errorCode === "MFA_REQUIRED" || errorCode?.includes("MFA_REQUIRED")) {
                    setRequiresMfa(true);
                    setMfaCode("");
                    setError("");
                    // No limpiamos email/password aquí para permitir que handleCredentialsLogin los use de nuevo
                    // junto con el mfaCode en el segundo intento (o se pasan en el mismo objeto si se prefiere).
                    return;
                }

                if (errorCode === "INVALID_MFA_CODE" || errorCode?.includes("INVALID_MFA_CODE")) {
                    setError(t('error_mfa'));
                    return;
                }

                if (errorCode === "INVALID_MAGIC_LINK" || errorCode?.includes("INVALID_MAGIC_LINK")) {
                    setError("El enlace mágico es inválido o ha expirado.");
                    return;
                }

                // If we get "credentials" error but we didn't find mfaPending session above, treat as failure
                console.error("❌ [LOGIN] Auth failed with error:", errorCode);
                setError(errorCode === 'credentials' ? t('error_invalid') : `${t('error_invalid')} (${errorCode})`);
                return;
            }

            if (result?.ok) {
                console.log("🚀 [LOGIN] Full success detected! Redirecting to dashboard...");
                router.push("/admin-dashboard");
                router.refresh();
                return;
            }

            if (!result?.ok) {
                console.warn("⚠️ [LOGIN] SignIn returned not OK without error code.");
                setError(t('error_invalid'));
            }
        } catch (err: unknown) {
            console.error("💥 [LOGIN] Fatal error in handleCredentialsLogin:", err);
            setError(`${t('error_generic')} Check console.`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-6 font-outfit selection:bg-teal-500/30">
            {/* 🌌 High-Performance Cinematic Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[140px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[140px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                {/* 🛡️ Secure Connectivity Badge */}
                <div className="flex justify-center mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-full border border-teal-500/30 text-[10px] font-black uppercase tracking-[0.2em] text-teal-400 shadow-xl shadow-teal-900/20"
                    >
                        <Shield size={12} className="text-teal-400" />
                        Ais-Protected Terminal
                    </motion.div>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-slate-800/60 shadow-2xl relative overflow-hidden">
                    {/* Animated scanning line */}
                    <motion.div
                        animate={{ top: ['-10%', '110%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-teal-500/30 to-transparent z-0 pointer-events-none"
                    />

                    <div className="text-center mb-10 relative z-10">
                        <Link href="/" className="inline-block group/logo">
                            <motion.div
                                whileHover={{ rotate: [0, -5, 5, 0] }}
                                className="w-20 h-20 bg-gradient-to-br from-teal-600 to-teal-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-teal-500/30 border border-teal-400/20 ring-4 ring-teal-500/5"
                            >
                                <Lock className="text-white" size={38} />
                            </motion.div>
                            <h1 className="text-4xl font-black text-white tracking-tight leading-none">
                                ABD<span className="text-teal-500"> RAG</span>
                            </h1>
                        </Link>
                        <p className="text-slate-400 mt-4 font-medium text-sm leading-relaxed max-w-[240px] mx-auto">
                            {requiresMfa ? t('mfa_title') : t('subtitle')}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {!requiresMfa ? (
                            <motion.form
                                key={isMagicLink ? "magic" : "login"}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                onSubmit={isMagicLink ? handleMagicLink : handleCredentialsLogin}
                                className="space-y-6 relative z-10"
                            >
                                <div className="space-y-3">
                                    <label htmlFor="email" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                                        {t('email_label')}
                                    </label>
                                    <div className="relative group/input">
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder={t('email_placeholder')}
                                            className="bg-slate-800/30 border-slate-800 h-14 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/5 transition-all rounded-2xl pl-12"
                                            required
                                        />
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-teal-500 transition-colors">
                                            <Search size={18} />
                                        </div>
                                    </div>
                                </div>

                                {!isMagicLink && (
                                    <div className="space-y-3">
                                        <label htmlFor="password" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                                            {t('password_label')}
                                        </label>
                                        <div className="relative group/input">
                                            <Input
                                                id="password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder={t('password_placeholder')}
                                                className="bg-slate-800/30 border-slate-800 h-14 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/5 transition-all pl-12 pr-12 rounded-2xl"
                                                required
                                            />
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-teal-500 transition-colors">
                                                <Lock size={18} />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-teal-400 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-3"
                                    >
                                        <AlertCircle size={16} className="shrink-0" />
                                        {error}
                                    </motion.div>
                                )}

                                {success && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-teal-500/10 border border-teal-500/20 text-teal-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-3"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                                        {success}
                                    </motion.div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-black text-base rounded-2xl shadow-xl shadow-teal-600/20 transition-all active:scale-[0.98] border border-teal-400/20"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            {isMagicLink ? t('sending') : t('verifying')}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            {isMagicLink ? t('magic_link_button') : t('button')}
                                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </Button>

                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMagicLink(!isMagicLink);
                                            setError("");
                                            setSuccess("");
                                        }}
                                        className="text-xs text-slate-500 hover:text-teal-400 transition-all font-black uppercase tracking-widest border-b border-transparent hover:border-teal-500/50 pb-1"
                                    >
                                        {isMagicLink ? t('password_toggle') : t('magic_link_toggle')}
                                    </button>
                                </div>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="mfa"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                onSubmit={handleCredentialsLogin}
                                className="space-y-8 relative z-10"
                            >
                                <p className="text-xs font-medium text-slate-400 text-center leading-relaxed">
                                    {t('mfa_desc')}
                                </p>

                                <div className="relative group/input">
                                    <Input
                                        id="mfa-code"
                                        name="mfa-code"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        pattern="[0-9]*"
                                        value={mfaCode}
                                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                                        placeholder="000 000"
                                        className="h-20 text-center text-4xl font-black tracking-[0.2em] bg-slate-800/30 border-slate-800 text-white focus:border-teal-500/50 focus:ring-8 focus:ring-teal-500/5 rounded-3xl"
                                        maxLength={6}
                                        autoFocus
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-bold">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isLoading || mfaCode.length < 6}
                                    className="w-full h-14 bg-teal-600 hover:bg-teal-500 text-white font-black text-base rounded-2xl shadow-xl shadow-teal-500/20 transition-all"
                                >
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('mfa_button')}
                                </Button>

                                <button
                                    type="button"
                                    className="w-full text-[10px] text-slate-500 hover:text-teal-400 transition-all font-black uppercase tracking-widest"
                                    onClick={() => {
                                        setRequiresMfa(false);
                                        setMfaCode("");
                                        setError("");
                                    }}
                                >
                                    ← {t('mfa_back')}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* 🧪 Demo Access Center */}
                    <div className="mt-12 pt-8 border-t border-slate-800/40 text-center">
                        <div className="inline-block px-1 py-1 bg-slate-950/50 rounded-2xl border border-slate-800/60 w-full group/demo">
                            <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/40 group-hover/demo:bg-slate-900/50 transition-all">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">
                                    Laboratory Access
                                </h4>
                                <div className="space-y-2">
                                    <code className="block text-[10px] text-teal-500/70 py-1 bg-slate-950/80 rounded-lg border border-teal-500/10">
                                        admin@abd.com • technical_lead
                                    </code>
                                    <code className="block text-[10px] text-slate-600/70 py-1 rounded-lg">
                                        pass: system_bypass_v2
                                    </code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 text-center flex items-center justify-center gap-4">
                    <span className="w-8 h-[1px] bg-slate-800" />
                    <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] pt-0.5">
                        {t('footer_text')}
                    </span>
                    <span className="w-8 h-[1px] bg-slate-800" />
                </div>
            </motion.div>
        </div>
    );
}
