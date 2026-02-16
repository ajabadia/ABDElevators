import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, HelpCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeConfig {
    label: string;
    className: string;
    icon?: any;
    animate?: boolean;
}

const STATUS_CONFIG: Record<string, BadgeConfig> = {
    OPEN: {
        label: 'Abierto',
        className: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
    },
    IN_PROGRESS: {
        label: 'En Progreso',
        className: 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    },
    WAITING_USER: {
        label: 'Esperando Cliente',
        className: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
    },
    RESOLVED: {
        label: 'Resuelto',
        className: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
        icon: CheckCircle2
    },
    CLOSED: {
        label: 'Cerrado',
        className: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
    }
};

const PRIORITY_CONFIG: Record<string, BadgeConfig> = {
    CRITICAL: {
        label: 'Crítico',
        className: 'bg-red-600 text-white border-transparent shadow-lg shadow-red-500/20',
        icon: AlertCircle
    },
    HIGH: {
        label: 'Alta',
        className: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
        icon: Zap
    },
    MEDIUM: {
        label: 'Media',
        className: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        icon: Clock
    },
    LOW: {
        label: 'Baja',
        className: 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700',
        icon: HelpCircle
    }
};

export function TicketStatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status] || { label: status, className: "" };
    const Icon = config.icon;

    return (
        <Badge
            variant="outline"
            className={cn("font-bold px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider transition-all", config.className)}
        >
            {Icon && <Icon className="w-3 h-3 mr-1" />}
            {config.label}
        </Badge>
    );
}

export function TicketPriorityBadge({ priority }: { priority: string }) {
    const config = PRIORITY_CONFIG[priority] || { label: priority, className: "" };
    const Icon = config.icon;

    return (
        <Badge
            variant="outline"
            className={cn("font-bold px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider items-center flex gap-1", config.className)}
        >
            {Icon && <Icon className="w-3 h-3 text-[0.8em]" />}
            {config.label}
        </Badge>
    );
}
