'use client';

import { useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/errors-helpers';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Loader2, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function MagicLinkVerifyPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'initializing' | 'idle' | 'verifying' | 'error' | 'success'>('initializing');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const e = searchParams?.get('email');
        const t = searchParams?.get('token');
        if (e) setEmail(e);
        if (t) setToken(t);
        setStatus('idle');
    }, [searchParams]);

    const handleVerify = async () => {
        if (!token || !email) {
            toast.error('Datos de acceso incompletos');
            return;
        }

        setStatus('verifying');
        setMessage('Autenticando sesión segura...');

        try {
            console.log("🔗 [VERIFY] Initiating intentional Magic Link verification for:", email);
            const result = await signIn('credentials', {
                email,
                password: `MAGIC_LINK:${token}`,
                callbackUrl: '/admin/knowledge-assets',
                redirect: true,
            }) as any;

            if (result?.error) {
                console.error("❌ [VERIFY] signIn returned error:", result.error);
                setStatus('error');
                const errorCode = result.code || result.error;
                setMessage(`Error: ${errorCode}. El enlace puede haber caducado.`);
            }
        } catch (error: unknown) {
            console.error('💥 [VERIFY] Fatal error:', error);
            setStatus('error');
            setMessage('Error de conexión. Intenta de nuevo.');
        }
    };

    // 1. Cargando parámetros
    if (status === 'initializing') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <Loader2 className="w-10 h-10 animate-spin text-teal-500 opacity-50" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-6 font-outfit selection:bg-teal-500/30">
            {/* 🌌 Cinematic Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[140px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[140px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-slate-800/60 shadow-2xl text-center space-y-8">

                    {!email || !token ? (
                        <div className="space-y-6">
                            <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4 border border-amber-500/20">
                                <AlertCircle className="w-8 h-8 text-amber-500" />
                            </div>
                            <h2 className="text-2xl font-black text-white">Enlace Inválido</h2>
                            <p className="text-slate-500 text-sm font-medium">Este enlace de acceso ha expirado o está mal formado.</p>
                            <Button onClick={() => router.push('/login')} className="w-full h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold">
                                Volver al Login
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                <motion.div
                                    initial={{ rotate: -10, scale: 0.9 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    className="w-20 h-20 bg-teal-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-teal-500/20 shadow-2xl shadow-teal-500/10"
                                >
                                    <CheckCircle className="w-10 h-10 text-teal-400" />
                                </motion.div>
                                <h1 className="text-3xl font-black text-white tracking-tight">Acceso Seguro</h1>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                    Confirmación de identidad para:<br />
                                    <span className="text-teal-500 font-bold block mt-1">{email}</span>
                                </p>
                            </div>

                            <div className="pt-4">
                                {status === 'idle' && (
                                    <Button
                                        onClick={handleVerify}
                                        className="w-full h-14 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-black text-lg rounded-2xl shadow-xl shadow-teal-600/20 transition-all active:scale-[0.98] border border-teal-400/20"
                                    >
                                        Entrar Ahora
                                    </Button>
                                )}

                                {status === 'verifying' && (
                                    <div className="w-full h-14 bg-slate-800/40 border border-slate-800/60 text-slate-400 font-black rounded-2xl flex items-center justify-center gap-3">
                                        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
                                        {message}
                                    </div>
                                )}

                                {status === 'error' && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold leading-relaxed">
                                            {message}
                                        </div>
                                        <button
                                            onClick={() => router.push('/login')}
                                            className="w-full py-2 text-slate-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors"
                                        >
                                            Reintentar Acceso Manual
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="pt-8 border-t border-slate-800/40">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-950/50 rounded-full border border-slate-800/60 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    <Shield size={10} className="text-teal-500" />
                                    ABD RAG Platform • Security Verified
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
