"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function PublicNavbar() {
    const navT = useTranslations('nav');
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav aria-label="Main navigation" className="fixed top-0 w-full z-50 flex items-center justify-between px-8 py-4 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
            <Link href="/" aria-label="ABD RAG Platform Home" className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
                <div role="img" aria-hidden="true" className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center font-black text-white">A</div>
                <div className="text-xl font-black tracking-tighter text-white font-outfit">
                    ABD<span className="text-teal-500"> RAG</span>
                </div>
            </Link>
            <div className="hidden md:flex gap-10 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <Link href="/#soluciones" className="hover:text-teal-400 transition-colors">
                    {navT('solutions')}
                </Link>
                <Link href="/#tecnologia" className="hover:text-teal-400 transition-colors">
                    {navT('technology')}
                </Link>
                <Link
                    href="/pricing"
                    className={cn(
                        "hover:text-teal-400 transition-colors",
                        isActive('/pricing') && "text-teal-500 border-b-2 border-teal-500 pb-1"
                    )}
                >
                    {navT('pricing')}
                </Link>
                <Link href="/#seguridad" className="hover:text-teal-400 transition-colors">
                    {navT('security')}
                </Link>
                <Link
                    href="/about"
                    className={cn(
                        "hover:text-teal-400 transition-colors",
                        isActive('/about') && "text-teal-500 border-b-2 border-teal-500 pb-1"
                    )}
                >
                    {navT('contact')}
                </Link>
            </div>
            <div className="flex items-center gap-4">
                <LocaleSwitcher />
                <Link href="/login">
                    <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5 font-bold text-sm">
                        {navT('login')}
                    </Button>
                </Link>
                <Link href="/login">
                    <Button className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 shadow-lg shadow-teal-600/20">
                        {navT('demo')}
                    </Button>
                </Link>
            </div>
        </nav>
    );
}
