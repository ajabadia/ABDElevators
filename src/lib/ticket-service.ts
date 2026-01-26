
import { connectDB } from "./db";
import { ObjectId } from "mongodb";
import { Ticket, TicketSchema } from "./ticket-schema";
import { AppError } from "./errors";
import { logEvento } from "./logger";
import crypto from 'crypto';

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
            messages: [],
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
        userEmail?: string;  // Filtro por email (para Admin UI)
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

        if (options.userEmail) {
            query.userEmail = options.userEmail;
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
     * Añade un mensaje público a la conversación del ticket
     */
    static async addMessage(
        ticketId: string,
        message: { content: string, author: 'User' | 'Support' | 'System', authorName?: string }
    ) {
        const db = await connectDB();

        const newMessage = {
            id: crypto.randomUUID(),
            ...message,
            timestamp: new Date(),
            isInternal: false
        };

        // Si contesta el usuario, reabrimos si estaba esperando usuario
        // Si contesta soporte, cambiamos a esperando usuario
        let newStatus = undefined;
        // Lógica de estado automática (opcional, pero recomendada)

        const updateOp: any = {
            $push: { messages: newMessage },
            $set: { updatedAt: new Date() }
        };

        // ... (dentro de la clase)

        await db.collection("tickets").updateOne(
            { _id: new ObjectId(ticketId) },
            updateOp
        );

        // Log para auditoría
        await logEvento({
            nivel: 'INFO',
            origen: 'TICKET_SERVICE',
            accion: 'ADD_MESSAGE',
            mensaje: `Nuevo mensaje en ticket ${ticketId} por ${message.author}`,
            correlacion_id: ticketId,
            detalles: { author: message.author }
        });

        return newMessage;
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
