"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Globe, Lock } from "lucide-react";

export function PublicFooter() {
    const navT = useTranslations('nav');

    return (
        <footer className="py-20 border-t border-white/5 bg-slate-950">
            <div className="container mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="col-span-1 md:col-span-1">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center font-black text-white">A</div>
                        <div className="text-xl font-black tracking-tighter text-white font-outfit">
                            ABD<span className="text-teal-500"> RAG</span>
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Plataforma líder en inteligencia documental industrial y multi-tenant.
                    </p>
                </div>
                <div className="space-y-4">
                    <h4 className="text-white font-bold uppercase tracking-widest text-xs">Producto</h4>
                    <ul className="text-slate-500 text-sm space-y-2">
                        <li><Link href="/#tecnologia" className="hover:text-teal-400 transition-colors cursor-pointer">Características</Link></li>
                        <li><Link href="/#seguridad" className="hover:text-teal-400 transition-colors cursor-pointer">Seguridad</Link></li>
                        <li><Link href="/pricing" className="hover:text-teal-400 transition-colors">{navT('pricing')}</Link></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="text-white font-bold uppercase tracking-widest text-xs">Empresa</h4>
                    <ul className="text-slate-500 text-sm space-y-2">
                        <li className="text-slate-600 cursor-not-allowed">Sobre Nosotros</li>
                        <li><Link href="/contact" className="hover:text-teal-400 transition-colors cursor-pointer">{navT('contact')}</Link></li>
                        <li><Link href="/terms" className="hover:text-teal-400 transition-colors cursor-pointer">Legal</Link></li>
                        <li><Link href="/accessibility" className="hover:text-teal-400 transition-colors cursor-pointer">Accesibilidad</Link></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="text-white font-bold uppercase tracking-widest text-xs">Social</h4>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-not-allowed opacity-50">
                            <Globe size={18} className="text-slate-400" />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-not-allowed opacity-50">
                            <Lock size={18} className="text-slate-400" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-8 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                <p>&copy; 2026 ABD RAG Platform. Todos los derechos reservados.</p>
                <div className="flex gap-12 mt-4 md:mt-0">
                    <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                </div>
            </div>
        </footer>
    );
}
