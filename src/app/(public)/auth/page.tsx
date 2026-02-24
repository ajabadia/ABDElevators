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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-xl border-red-100">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="text-red-600 w-8 h-8" />
                    </div>
                    <CardTitle className="text-xl text-red-700">{title}</CardTitle>
                    <CardDescription>Código: {error}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-slate-600">{message}</p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link href="/login">
                        <Button variant="default" className="bg-slate-900 hover:bg-slate-800 text-white">
                            {t('backToLogin')}
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
