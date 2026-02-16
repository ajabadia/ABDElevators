'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

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
        } catch (error: any) {
            console.error('💥 [VERIFY] Fatal error:', error);
            setStatus('error');
            setMessage('Error de conexión. Intenta de nuevo.');
        }
    };

    // 1. Cargando parámetros
    if (status === 'initializing') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
                <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
            </div>
        );
    }

    // 2. Parámetros faltantes (solo después de inicializar)
    if (!email || !token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
                <Card className="w-full max-w-md p-8 text-center space-y-4 shadow-xl border-slate-200 dark:border-slate-800">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                    <h2 className="text-xl font-bold">Enlace Inválido</h2>
                    <p className="text-slate-500">Este enlace de acceso ha expirado o está mal formado.</p>
                    <button onClick={() => router.push('/login')} className="w-full bg-slate-900 text-white p-2 rounded-md hover:bg-slate-800 transition-colors">
                        Volver al Login
                    </button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
            <Card className="w-full max-w-md p-10 text-center space-y-8 shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="space-y-2">
                    <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-teal-100 dark:border-teal-800">
                        <CheckCircle className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Confirmación de Acceso</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Has solicitado acceso para <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>
                    </p>
                </div>

                <div className="pt-4">
                    {status === 'idle' && (
                        <button
                            onClick={handleVerify}
                            className="w-full py-4 px-6 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 transform active:scale-95 transition-all text-lg flex items-center justify-center gap-2"
                        >
                            Confirmar y Entrar ahora
                        </button>
                    )}

                    {status === 'verifying' && (
                        <div className="w-full py-4 px-6 bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold rounded-xl flex items-center justify-center gap-3">
                            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                            {message}
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm border border-red-100 dark:border-red-900/30">
                                {message}
                            </div>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full py-3 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-medium transition-colors"
                            >
                                Reintentar acceso manual
                            </button>
                        </div>
                    )}
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                        ABD RAG Platform • Security Verified
                    </p>
                </div>
            </Card>
        </div>
    );
}
