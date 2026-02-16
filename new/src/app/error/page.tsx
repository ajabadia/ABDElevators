import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GeneralErrorPage({
    searchParams,
}: {
    searchParams: { message?: string; code?: string };
}) {
    const errorCode = searchParams.code || "UNKNOWN_ERROR";
    const errorMessage = searchParams.message || "Ha ocurrido un error inesperado en la plataforma.";

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-outfit">
            <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-10 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mx-auto w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center rotate-3">
                    <AlertTriangle className="text-red-500" size={40} />
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-slate-900">Ups, algo ha salido mal</h1>
                    <p className="text-slate-500 leading-relaxed">
                        {errorMessage}
                    </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 text-left border border-slate-100 font-mono text-xs">
                    <div className="flex justify-between items-center text-slate-400 mb-2 uppercase tracking-widest font-bold">
                        <span>Detalles Técnicos</span>
                        <span>{errorCode}</span>
                    </div>
                    <p className="text-slate-600 break-words">
                        Si el problema persiste, por favor contacta con nuestro equipo de soporte técnico con el código de error superior.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button asChild variant="outline" className="rounded-xl h-12 border-slate-200 hover:bg-slate-50">
                        <Link href="/" className="flex items-center justify-center gap-2">
                            <Home size={16} />
                            Inicio
                        </Link>
                    </Button>
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12" onClick={() => window.location.reload()}>
                        <RefreshCcw size={16} className="mr-2" />
                        Reintentar
                    </Button>
                </div>
            </div>
        </div>
    );
}
