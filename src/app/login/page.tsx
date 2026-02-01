"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [requiresMfa, setRequiresMfa] = useState(false);
    const [mfaCode, setMfaCode] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                mfaCode: requiresMfa ? mfaCode : undefined,
                redirect: false,
            });

            if (result?.error) {
                if (result.error.includes("MFA_REQUIRED")) {
                    setRequiresMfa(true);
                    setError("");
                } else if (result.error.includes("INVALID_MFA_CODE")) {
                    setError("Código MFA incorrecto");
                } else {
                    setError("Credenciales inválidas");
                }
            } else {
                // FIXED: Redirect to valid admin page
                router.push("/admin/knowledge-assets");
                router.refresh();
            }
        } catch (err) {
            setError("Error al iniciar sesión");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <Card className="w-full max-w-md border-none shadow-2xl">
                <CardHeader className="text-center pb-8">
                    <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
                        <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-600/20">
                            <Lock className="text-white" size={32} />
                        </div>
                        <CardTitle className="text-3xl font-extrabold text-slate-900 font-outfit">
                            ABD<span className="text-teal-600"> RAG Plataform</span>
                        </CardTitle>
                    </Link>
                    <CardDescription className="text-base mt-2">
                        {requiresMfa ? "Verificación de Seguridad" : "Sistema RAG de Análisis Técnico"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!requiresMfa ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-slate-700 mb-2 block">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="usuario@abd.com"
                                    className="h-12"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-700 mb-2 block">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="h-12 pr-12"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm transition-all duration-300">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Verificando...
                                    </>
                                ) : (
                                    "Iniciar Sesión"
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="text-center space-y-2">
                                <p className="text-sm text-slate-600">
                                    Introduce el código de 6 dígitos de tu aplicación de autenticador.
                                </p>
                            </div>

                            <Input
                                type="text"
                                value={mfaCode}
                                onChange={(e) => setMfaCode(e.target.value)}
                                placeholder="000 000"
                                className="h-14 text-center text-2xl font-mono tracking-[0.5em] focus:ring-teal-500"
                                maxLength={6}
                                autoFocus
                                required
                            />

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isLoading || mfaCode.length < 6}
                                className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg"
                            >
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Verificar y Entrar"}
                            </Button>

                            <Button
                                variant="ghost"
                                type="button"
                                className="w-full text-slate-500"
                                onClick={() => {
                                    setRequiresMfa(false);
                                    setMfaCode("");
                                    setError("");
                                }}
                            >
                                Volver al login
                            </Button>
                        </form>
                    )}

                    <div className="mt-6 text-center text-sm text-slate-500">
                        <p>Usuarios de prueba:</p>
                        <p className="font-mono text-xs mt-2">
                            admin@abd.com / tecnico@abd.com
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
