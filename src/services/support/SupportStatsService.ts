import { ticketRepository } from "@/lib/repositories/TicketRepository";
import { Ticket } from "./schemas/TicketSchema";

/**
 * 🎧 SupportStatsService (Phase 219)
 * Provides real-time metrics for the support dashboard.
 */
export class SupportStatsService {
    /**
     * Calculates support metrics by tenant or globally.
     */
    static async getSupportStats(tenantId?: string) {
        const query: any = {};
        if (tenantId) query.tenantId = tenantId;

        // Fetch all tickets for calculation (or use aggregation if database grows large)
        // For simplified MVP/ERA 8 coverage, we fetch and calculate
        const tickets = await ticketRepository.list(query, { limit: 1000 }) as Ticket[];

        const activeTicketsArr = tickets.filter(t => !["RESOLVED", "CLOSED"].includes(t.status));
        const activeTickets = activeTicketsArr.length;
        const criticalTickets = activeTicketsArr.filter(t => t.priority === "CRITICAL").length;

        // SLA Global: % of tickets not breached
        const breachedCount = tickets.filter(t => t.sla?.breached).length;
        const slaGlobal = tickets.length > 0
            ? `${(((tickets.length - breachedCount) / tickets.length) * 100).toFixed(1)}%`
            : "100%";

        // IA Deflection: % of tickets handled by System without escalation (simplified logic)
        const systemResolved = tickets.filter(t =>
            t.status === "RESOLVED" &&
            t.messages.some(m => m.author === "System") &&
            !t.assignedTo
        ).length;

        const iaDeflection = tickets.length > 0
            ? `${((systemResolved / tickets.length) * 100).toFixed(0)}%`
            : "0%";

        return {
            activeTickets,
            criticalTickets,
            slaGlobal,
            iaDeflection,
            totalTickets: tickets.length
        };
    }
}
