
import { connectDB } from "./db";
import { Ticket, TicketSchema } from "./ticket-schema";
import { AppError } from "./errors";
import { logEvento } from "./logger";

export class TicketService {

    /**
     * Crea un nuevo ticket secuencial (TKT-YYYY-XXXXX)
     */
    static async createTicket(data: Omit<Ticket, 'ticketNumber' | 'createdAt' | 'updatedAt' | 'status'> & { status?: string }) {
        const db = await connectDB();

        // Generar ID secuencial "human readable"
        const count = await db.collection("tickets").countDocuments();
        const year = new Date().getFullYear();
        const ticketNumber = `TKT-${year}-${(count + 1).toString().padStart(5, '0')}`;

        const newTicket = {
            ...data,
            ticketNumber,
            status: data.status || "OPEN",
            createdAt: new Date(),
            updatedAt: new Date(),
            internalNotes: []
        };

        const validated = TicketSchema.parse(newTicket);

        const result = await db.collection("tickets").insertOne(validated);

        await logEvento({
            nivel: 'INFO',
            origen: 'TICKET_SERVICE',
            accion: 'CREATE_TICKET',
            mensaje: `Ticket creado ${ticketNumber} para ${data.userEmail}`,
            correlacion_id: ticketNumber,
            tenantId: data.tenantId,
            userId: data.createdBy,
            userEmail: data.userEmail
        });

        return { ...validated, _id: result.insertedId };
    }

    /**
     * Recupera tickets aplicando lógica Multi-Tenant estricta
     * @param options Filtros y contexto de seguridad
     */
    static async getTickets(options: {
        tenantIds: string[]; // Lista de tenants permitidos para el usuario
        userId?: string;     // Si es usuario normal, solo ve los suyos. Si es Admin/Tech, ve todos los del tenant.
        status?: string;
        priority?: string;
        limit?: number;
    }) {
        const db = await connectDB();
        const query: any = {
            tenantId: { $in: options.tenantIds }
        };

        if (options.userId) {
            query.createdBy = options.userId;
        }

        if (options.status) query.status = options.status;
        if (options.priority) query.priority = options.priority;

        const tickets = await db.collection("tickets")
            .find(query)
            .sort({ updatedAt: -1, priority: -1 }) // Priorizar recientes y urgentes
            .limit(options.limit || 50)
            .toArray();

        return tickets;
    }

    /**
     * Añade nota interna o actualiza estado
     */
    static async updateTicket(id: string, updates: Partial<Ticket> & { note?: string, authorId?: string }) {
        const db = await connectDB();
        // Lógica de actualización (pendiente de implementación completa en fase UI)
        // ...
    }
}
