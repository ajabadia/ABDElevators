"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

enum ErrorCode {
    Configuration = "Configuration",
    AccessDenied = "AccessDenied",
    Verification = "Verification",
    Default = "Default",
}

export default function AuthErrorPage() {
    const t = useTranslations('auth.error');
    const searchParams = useSearchParams();
    const error = searchParams?.get("error") as ErrorCode || ErrorCode.Default;

    const errorMap = {
        [ErrorCode.Configuration]: {
            title: t('configuration.title'),
            message: t('configuration.message'),
        },
        [ErrorCode.AccessDenied]: {
            title: t('accessDenied.title'),
            message: t('accessDenied.message'),
        },
        [ErrorCode.Verification]: {
            title: t('verification.title'),
            message: t('verification.message'),
        },
        [ErrorCode.Default]: {
            title: t('default.title'),
            message: t('default.message'),
        },
    };

    const { title, message } = errorMap[error] || errorMap[ErrorCode.Default];

    return (
        <main className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden font-outfit">
            {/* Cinematic Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full animate-pulse decoration-delay-2000" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none mix-blend-overlay" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
            </div>

            <Card className="w-full max-w-md relative z-10 bg-black/40 backdrop-blur-2xl border-white/10 shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-red-500/10 pointer-events-none" />

                <CardHeader className="text-center pt-10 pb-6 relative">
                    <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-lg shadow-red-500/5 group">
                        <AlertCircle className="text-red-500 w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <CardTitle className="text-3xl font-black text-white tracking-tight leading-tight">
                        {title}
                    </CardTitle>
                    <CardDescription className="text-red-400 font-mono text-[10px] uppercase tracking-[0.2em] mt-2 opacity-80 bg-red-500/5 px-2 py-1 rounded-full inline-block border border-red-500/10">
                        ERR_CODE: {error}
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-8 pb-8">
                    <p className="text-center text-slate-400 leading-relaxed text-sm">
                        {message}
                    </p>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 px-8 pb-10">
                    <Link href="/login" className="w-full">
                        <Button className="w-full h-12 rounded-xl bg-white text-black hover:bg-slate-200 transition-all duration-300 font-bold shadow-xl shadow-white/5 active:scale-[0.98]">
                            {t('backToLogin')}
                        </Button>
                    </Link>
                    <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest font-medium opacity-50">
                        ABD RAG PLATFORM &bull; INDUSTRIAL SAFETY
                    </p>
                </CardFooter>
            </Card>
        </main>
    );
}
