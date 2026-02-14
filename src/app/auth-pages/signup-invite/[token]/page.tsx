"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, UserPlus, Shield, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

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
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-600 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">{t('verifying')}</p>
                </div>
            </div>
        );
    }

    if (error && !success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="w-full max-w-md border-none shadow-xl text-center">
                    <CardHeader>
                        <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-slate-800">{t('invalidInvite')}</CardTitle>
                        <CardDescription className="text-slate-500 mt-2">
                            {error}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full bg-slate-800">
                            <Link href="/">{t('backToHome')}</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-teal-50 p-4">
                <Card className="w-full max-w-md border-none shadow-2xl text-center p-8">
                    <div className="mx-auto w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <CheckCircle2 className="h-12 w-12 text-teal-600" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-teal-900 mb-2">{t('successTitle')}</CardTitle>
                    <p className="text-teal-700 text-lg mb-8">
                        {t('successMessage')}
                    </p>
                    <Loader2 className="h-6 w-6 animate-spin text-teal-600 mx-auto" />
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="w-full max-w-xl">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl shadow-lg shadow-teal-600/20 mb-4">
                        <UserPlus className="text-white h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 font-outfit">
                        {t('title')}
                    </h1>
                    <p className="text-slate-500 mt-2">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Info Sidebar */}
                    <div className="md:col-span-1 space-y-4">
                        <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm uppercase tracking-wider text-slate-400 font-bold">Detalles</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-xs text-slate-500">Organización</Label>
                                    <p className="font-bold text-slate-900">{inviteInfo?.tenantName}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Role</Label>
                                    <p className="font-bold text-teal-600">{inviteInfo?.role}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Email</Label>
                                    <p className="font-mono text-xs text-slate-600 truncate">{inviteInfo?.email}</p>
                                </div>
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                        <Shield className="h-3 w-3" />
                                        SEGURIDAD CIFRADA
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Form */}
                    <div className="md:col-span-2">
                        <Card className="border-none shadow-2xl">
                            <CardContent className="pt-6">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                            <Label htmlFor="firstName">{t('firstName')}</Label>
                                            <Input
                                                id="firstName"
                                                required
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                className="h-11"
                                                placeholder={t('firstName')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">{t('lastName')}</Label>
                                            <Input
                                                id="lastName"
                                                required
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                className="h-11"
                                                placeholder={t('lastName')}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">{t('password')}</Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="h-11 pr-10"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-3 text-slate-400"
                                                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            required
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="h-11"
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            {error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all shadow-lg shadow-teal-600/20"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                {t('creatingAccount')}
                                            </>
                                        ) : (
                                            t('createAccount')
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-400 mt-8">
                    {t('termsPrefix')} <Link href="/terms" className="underline">{t('termsLink')}</Link> {t('and')} <Link href="/privacy" className="underline">{t('privacyLink')}</Link>.
                </p>
            </div>
        </div>
    );
}
