import { ShieldAlert, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RateLimitErrorPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-outfit">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="relative mx-auto w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center">
                    <div className="absolute inset-0 bg-amber-200/20 rounded-full animate-ping" />
                    <Clock className="text-amber-600 relative z-10" size={48} />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">Demasiadas Peticiones</h1>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Has alcanzado el límite de seguridad de peticiones permitido para tu cuenta en este momento.
                        Este mecanismo protege la integridad y el rendimiento de la plataforma.
                    </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100">
                    <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">¿Qué ha pasado?</h4>
                    <p className="text-xs text-slate-600">
                        Cada acción (clics, búsquedas, subidas) cuenta como una petición. Para prevenir abusos o errores en bucle,
                        hemos establecido un umbral de seguridad.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">¿Qué puedes hacer?</h4>
                    <ul className="text-xs text-slate-600 space-y-2">
                        <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-amber-500 rounded-full" />
                            Espera unos minutos y vuelve a intentarlo.
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-amber-500 rounded-full" />
                            Reduce la frecuencia de acciones rápidas.
                        </li>
                    </ul>
                </div>

                <div className="pt-4 border-t border-slate-50">
                    <Button asChild className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12">
                        <Link href="/" className="flex items-center justify-center gap-2">
                            <ArrowLeft size={16} />
                            Volver al Inicio
                        </Link>
                    </Button>
                </div>

                <p className="text-[10px] text-slate-400">
                    Si eres Administrador y necesitas un límite superior, contacta con soporte técnico.
                </p>
            </div>
        </div>
    );
}
