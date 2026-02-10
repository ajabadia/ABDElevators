"use client";

import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
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

    // Verificar si ya hay una sesión con MFA pendiente al cargar la página
    useEffect(() => {
        const checkMfaSession = async () => {
            const session = await getSession();
            if (session?.user?.mfaPending) {
                setRequiresMfa(true);
            }
        };
        checkMfaSession();
    }, []);

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
        } catch (err: any) {
            setError(err.message || t('error_generic'));
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

            // 1. Check session for mfaPending BEFORE handling errors (Auditoría v4.2)
            const session = await getSession();
            console.log("🤝 [LOGIN] Current Session state:", session ? `User: ${session.user?.email} | mfaPending: ${(session.user as any)?.mfaPending}` : "No Session");

            if (session?.user && (session.user as any).mfaPending) {
                console.log("🔒 [LOGIN] Session detected with mfaPending: true. Switching to MFA mode.");
                setRequiresMfa(true);
                setMfaCode("");
                setError("");
                setIsLoading(false);
                return; // SUCCESS path (Pending MFA)
            }

            // ⚠️ DEFENSIVE: Priority check for errors
            if (result?.error) {
                // MEGA ERROR TRACE: Dump everything for debugging
                console.log("🔍 [LOGIN] MEGA ERROR TRACE:", JSON.stringify(result, null, 2));

                const errorCode = (result as any).code || result.error;

                // Handle legacy or explicit error codes if they happen to bypass normalization
                if (errorCode === "MFA_REQUIRED" || errorCode?.includes("MFA_REQUIRED")) {
                    setRequiresMfa(true);
                    setMfaCode("");
                    setError("");
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
                router.push("/admin/knowledge-assets");
                router.refresh();
                return;
            }

            if (!result?.ok) {
                console.warn("⚠️ [LOGIN] SignIn returned not OK without error code.");
                setError(t('error_invalid'));
            }
        } catch (err: any) {
            console.error("💥 [LOGIN] Fatal error in handleCredentialsLogin:", err);
            setError(`${t('error_generic')} Check console.`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4 font-outfit">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-slate-900/50 backdrop-blur-2xl p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group">
                    {/* Animated accent line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent opacity-50" />

                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block group/logo transition-transform hover:scale-105">
                            <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-teal-500/20 group-hover/logo:rotate-3 transition-all">
                                <Lock className="text-white" size={32} />
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight">
                                ABD<span className="text-teal-500"> RAG</span>
                            </h1>
                        </Link>
                        <p className="text-slate-400 mt-2 font-medium">
                            {requiresMfa ? t('mfa_title') : t('subtitle')}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {!requiresMfa ? (
                            <motion.form
                                key={isMagicLink ? "magic" : "login"}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={isMagicLink ? handleMagicLink : handleCredentialsLogin}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                                        {t('email_label')}
                                    </label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={t('email_placeholder')}
                                        className="bg-slate-800/50 border-slate-700 h-12 text-white placeholder:text-slate-600 focus:border-teal-500/50 transition-all rounded-xl"
                                        required
                                    />
                                </div>

                                {!isMagicLink && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                                            {t('password_label')}
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder={t('password_placeholder')}
                                                className="bg-slate-800/50 border-slate-700 h-12 text-white placeholder:text-slate-600 focus:border-teal-500/50 transition-all pr-12 rounded-xl"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-400 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                {success && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-2 h-2 rounded-full bg-emerald-500"
                                        />
                                        {success}
                                    </motion.div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold text-lg rounded-xl shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98]"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            {isMagicLink ? t('sending') : t('verifying')}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            {isMagicLink ? t('magic_link_button') : t('button')}
                                            <ArrowRight size={20} />
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
                                        className="text-sm text-slate-500 hover:text-teal-400 transition-colors font-medium border-b border-dashed border-slate-700 hover:border-teal-400 pb-0.5"
                                    >
                                        {isMagicLink ? t('password_toggle') : t('magic_link_toggle')}
                                    </button>
                                </div>

                            </motion.form>
                        ) : (
                            <motion.form
                                key="mfa"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleCredentialsLogin}
                                className="space-y-6"
                            >
                                <p className="text-sm text-slate-400 text-center leading-relaxed">
                                    {t('mfa_desc')}
                                </p>

                                <Input
                                    type="text"
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    className="h-14 text-center text-3xl font-mono tracking-[0.3em] bg-slate-800/50 border-slate-700 text-white focus:border-teal-500/50 rounded-xl"
                                    maxLength={6}
                                    autoFocus
                                    required
                                />

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isLoading || mfaCode.length < 6}
                                    className="w-full h-12 bg-teal-600 hover:bg-teal-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-teal-600/20 transition-all"
                                >
                                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : t('mfa_button')}
                                </Button>

                                <button
                                    type="button"
                                    className="w-full text-sm text-slate-500 hover:text-teal-400 transition-colors font-medium"
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

                    <div className="mt-10 pt-6 border-t border-slate-800/50 text-center">
                        <div className="inline-block px-4 py-2 bg-slate-800/30 rounded-full border border-slate-800">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[2px]">
                                {t('test_users')}
                            </p>
                            <p className="font-mono text-[11px] text-teal-500/70 mt-1">
                                admin@abd.com / tecnico@abd.com
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-slate-600 text-xs font-medium tracking-widest uppercase">
                    {t('footer_text')}
                </div>
            </motion.div>
        </div>
    );
}
