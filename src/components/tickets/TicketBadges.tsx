
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, HelpCircle, Zap } from "lucide-react";

export function TicketStatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'OPEN':
            return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Abierto</Badge>;
        case 'IN_PROGRESS':
            return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 animate-pulse">En Progreso</Badge>;
        case 'WAITING_USER':
            return <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">Esperando Cliente</Badge>;
        case 'RESOLVED':
            return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Resuelto</Badge>;
        case 'CLOSED':
            return <Badge variant="secondary" className="text-slate-500">Cerrado</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}

export function TicketPriorityBadge({ priority }: { priority: string }) {
    switch (priority) {
        case 'CRITICAL':
            return <Badge variant="destructive" className="items-center flex gap-1"><AlertCircle className="w-3 h-3" /> Crítico</Badge>;
        case 'HIGH':
            return <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 items-center flex gap-1"><Zap className="w-3 h-3" /> Alta</Badge>;
        case 'MEDIUM':
            return <Badge variant="outline" className="text-slate-600 items-center flex gap-1"><Clock className="w-3 h-3" /> Media</Badge>;
        case 'LOW':
            return <Badge variant="outline" className="text-slate-400 items-center flex gap-1"><HelpCircle className="w-3 h-3" /> Baja</Badge>;
        default:
            return <Badge variant="outline">{priority}</Badge>;
    }
}
