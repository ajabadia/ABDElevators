"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

enum ErrorCode {
    Configuration = "Configuration",
    AccessDenied = "AccessDenied",
    Verification = "Verification",
    Default = "Default",
}

const errorMap = {
    [ErrorCode.Configuration]: {
        title: "Error de Configuración",
        message: "Hay un problema con la configuración del servidor. Contáctanos si el problema persiste.",
    },
    [ErrorCode.AccessDenied]: {
        title: "Acceso Denegado",
        message: "No tienes permiso para iniciar sesión.",
    },
    [ErrorCode.Verification]: {
        title: "Enlace Expirado",
        message: "El enlace de inicio de sesión ya no es válido. Inténtalo de nuevo.",
    },
    [ErrorCode.Default]: {
        title: "Error de Autenticación",
        message: "Ocurrió un error inesperado al iniciar sesión.",
    },
};

export default function AuthErrorPage() {
    const searchParams = useSearchParams();
    const error = searchParams?.get("error") as ErrorCode || ErrorCode.Default;

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
                            Volver al Login
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
