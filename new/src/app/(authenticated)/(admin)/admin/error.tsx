"use client"

import React, { useEffect } from "react"
import { AlertCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageContainer } from "@/components/ui/page-container"

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Admin Dashboard Error:", error)
    }, [error])

    return (
        <PageContainer>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-slate-950/50 rounded-3xl border border-red-500/20 backdrop-blur-xl">
                <div className="relative mb-8">
                    <AlertCircle className="text-red-500 w-16 h-16 animate-pulse" />
                    <div className="absolute inset-0 blur-2xl bg-red-500/20" />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight mb-2 uppercase">Fallo de Continuidad</h2>
                <p className="text-slate-400 max-w-md mb-8 font-medium">
                    El panel de control ha experimentado un error inesperado al orquestar las métricas industriales.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        onClick={() => reset()}
                        className="bg-red-600 hover:bg-red-700 text-white px-8 rounded-2xl h-12 font-black uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <RotateCcw className="mr-2 h-4 w-4" /> Reintentar Carga
                    </Button>
                    <Button
                        variant="ghost"
                        asChild
                        className="text-slate-400 hover:text-white rounded-2xl h-12 px-8 font-bold"
                    >
                        <a href="/support">Informar al Soporte Técnico</a>
                    </Button>
                </div>
            </div>
        </PageContainer>
    )
}
