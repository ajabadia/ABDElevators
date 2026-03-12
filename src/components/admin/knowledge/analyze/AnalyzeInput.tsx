"use client";

import { Send, Hash, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface AnalyzeInputProps {
    value: string;
    onChange: (val: string) => void;
    onSend: () => void;
    disabled?: boolean;
}

export function AnalyzeInput({ value, onChange, onSend, disabled }: AnalyzeInputProps) {
    const t = useTranslations("knowledge_hub");

    return (
        <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700 group-focus-within:text-teal-500 transition-colors">
                    <Hash size={20} />
                </div>
                <input 
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
                    disabled={disabled}
                    placeholder={t('analyze_modal.input_placeholder')}
                    className="w-full h-16 pl-12 pr-32 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[1.5rem] outline-none focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/5 dark:focus:ring-teal-500/10 transition-all font-medium text-slate-800 dark:text-slate-100"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-200/50 dark:bg-slate-800 rounded-lg text-[10px] font-black text-slate-400 mr-2 border border-slate-200/50 dark:border-slate-700">
                        <CornerDownLeft size={10} />
                        ENTER
                    </div>
                    <Button 
                        size="icon"
                        disabled={disabled || !value.trim()}
                        onClick={onSend}
                        className="h-10 w-10 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl shadow-lg shadow-teal-500/20 transition-all active:scale-95"
                    >
                        <Send size={18} />
                    </Button>
                </div>
            </div>
        </div>
    );
}
