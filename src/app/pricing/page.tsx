"use client";

import { useEffect, useState } from "react";
import { PricingTable } from "@/components/landing/PricingTable";
import { Loader2 } from "lucide-react";

export default function PricingPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchPlans() {
            try {
                const res = await fetch('/api/pricing/plans');
                const data = await res.json();
                if (data.success) {
                    setPlans(data.plans);
                }
            } catch (error) {
                console.error("Error fetching plans:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchPlans();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-teal-500 animate-spin mb-4" />
                <p className="text-slate-400 font-medium">Cargando planes comerciales...</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950">
            {/* Nav placeholder (en una app real iría el NavBar global) */}
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-between items-center relative z-20">
                <div className="text-2xl font-black bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                    ABD RAG PLATFORM
                </div>
                <div className="flex gap-8 text-sm font-bold text-slate-400">
                    <a href="/" className="hover:text-white transition-colors">Inicio</a>
                    <a href="/features" className="hover:text-white transition-colors">Características</a>
                    <a href="/pricing" className="text-white border-b-2 border-teal-500 pb-1">Precios</a>
                    <a href="/contacto" className="hover:text-white transition-colors">Contacto</a>
                </div>
            </nav>

            <PricingTable plans={plans} />

            {/* Footer placeholder */}
            <footer className="bg-slate-900/50 py-12 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-slate-500 text-sm">
                        © 2026 ABD RAG Platform. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </main>
    );
}
