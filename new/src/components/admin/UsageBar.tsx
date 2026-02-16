"use client";

import { motion } from "framer-motion";

interface UsageBarProps {
    label: string;
    value: number;
    max: number;
    format: 'tokens' | 'bytes' | 'count';
    color: string;
}

export function UsageBar({ label, value, max, format, color }: UsageBarProps) {
    const percentage = Math.min((value / max) * 100, 100);

    const formatValue = (v: number) => {
        if (format === 'tokens') return `${(v / 1000).toFixed(1)}k`;
        if (format === 'bytes') return `${(v / (1024 * 1024)).toFixed(1)}MB`;
        return v.toLocaleString();
    };

    const colors: Record<string, string> = {
        teal: "bg-gradient-to-r from-teal-400 to-teal-600",
        blue: "bg-gradient-to-r from-blue-400 to-blue-600",
        purple: "bg-gradient-to-r from-purple-400 to-purple-600",
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end">
                <p className="text-xs font-black uppercase tracking-tight text-muted-foreground">{label}</p>
                <p className="text-xs font-mono font-bold">
                    <span className="text-foreground">{formatValue(value)}</span> <span className="text-muted-foreground px-1">/</span> <span className="text-muted-foreground">{formatValue(max)}</span>
                </p>
            </div>
            <div className="h-4 bg-secondary rounded-full overflow-hidden p-[2px] border border-border">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className={`h-full rounded-full shadow-lg ${colors[color] || colors.blue}`}
                />
            </div>
        </div>
    );
}
