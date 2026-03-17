"use client";

import React, { useState } from "react";
import { TechnicianLayout } from "@/components/technician/TechnicianLayout";
import { VoiceAssistant } from "@/components/shared/VoiceAssistant";
import { 
  History, 
  Search, 
  ArrowRight, 
  BookOpen, 
  Sparkles,
  ChevronRight
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export default function TechnicianSearchPage() {
  const t = useTranslations("technician.search");
  const [results, setResults] = useState<any[]>([]);

  const handleVoiceQuery = (query: string) => {
    // Simular búsqueda RAG
    setTimeout(() => {
      setResults([
        { 
          id: "1", 
          title: "Sincronización de Maniobra Arca II", 
          source: "Manual_Tecnico_Arca_v2.pdf",
          snippet: "Para resolver el error de sincronización, verifique el bus CAN y reinicie el módulo secundario...",
          match: 98
        },
        { 
          id: "2", 
          title: "Protocolo de Seguridad Puertas", 
          source: "Normativa_EN81_20.pdf",
          snippet: "La distancia de seguridad entre la puerta de cabina y el rellano no debe exceder los 6mm...",
          match: 85
        }
      ]);
    }, 1000);
  };

  return (
    <TechnicianLayout>
      <div className="flex flex-col h-full space-y-8 pb-12">
        {/* Header */}
        <div className="text-center pt-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {t("title")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {t("subtitle")}
          </p>
        </div>

        {/* Big Voice Assistant Trigger Area */}
        <div className="flex justify-center py-8">
          <VoiceAssistant onQuery={handleVoiceQuery} />
        </div>

        {/* Results or Suggestions */}
        <div className="flex-1 space-y-6">
          {results.length > 0 ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                {t("results_found")}
              </h3>
              <div className="space-y-3">
                {results.map((res) => (
                  <div key={res.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm active:scale-[0.98] transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {res.source}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                        {res.match}%
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                      {res.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-3">
                      {res.snippet}
                    </p>
                    <button className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                      {t("read_more")}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <History className="w-3 h-3" />
                  {t("recent_searches")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {["Error 04 Arca II", "Esquema eléctrico", "Ajuste frenos"].map((q) => (
                    <button key={q} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-2xl text-xs font-medium border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-600 rounded-3xl p-5 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mb-1">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg">{t("hands_free_tip")}</h3>
                  <p className="text-indigo-100 text-xs leading-relaxed">
                    {t("hands_free_desc")}
                  </p>
                </div>
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              </div>
            </div>
          )}
        </div>
      </div>
    </TechnicianLayout>
  );
}
