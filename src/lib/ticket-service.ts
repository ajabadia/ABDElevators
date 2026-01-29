import { ObjectId } from "mongodb";
import { Ticket, TicketSchema } from "@/lib/ticket-schema";
import { AppError } from "./errors";
import { logEvento } from "./logger";
import { getTenantCollection } from "./db-tenant";
import crypto from 'crypto';

export class TicketService {

    /**
     * Crea un nuevo ticket secuencial con aislamiento garantizado.
     */
    static async createTicket(data: Omit<Ticket, 'ticketNumber' | 'createdAt' | 'updatedAt' | 'status'> & { status?: string }) {
        const ticketColl = await getTenantCollection<Ticket>("tickets");

        // Generar ID secuencial
        const count = await ticketColl.countDocuments();
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
        const result = await ticketColl.insertOne(validated as any);

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
     * Recupera tickets aplicando blindaje multi-tenant automático.
     */
    static async getTickets(options: {
        userId?: string;     // Si es usuario normal, solo ve los suyos.
        userEmail?: string;  // Filtro por email
        status?: string;
        priority?: string;
        limit?: number;
    }) {
        const ticketColl = await getTenantCollection<Ticket>("tickets");

        const query: any = {};

        if (options.userId) {
            query.createdBy = options.userId;
        }

        if (options.userEmail) {
            query.userEmail = options.userEmail;
        }

        if (options.status) query.status = options.status;
        if (options.priority) query.priority = options.priority;

        // Note: tenantId injection is handled by ticketColl automatically
        const tickets = await ticketColl.find(query, {
            sort: { updatedAt: -1, priority: -1 } as any,
            limit: options.limit || 50
        });

        return tickets;
    }

    /**
     * Añade un mensaje a la conversación con validación de tenant.
     */
    static async addMessage(
        ticketId: string,
        message: {
            content: string,
            author: 'User' | 'Support' | 'System',
            authorName?: string,
            isInternal?: boolean
        }
    ) {
        const ticketColl = await getTenantCollection<Ticket>("tickets");

        const newMessage = {
            id: crypto.randomUUID(),
            ...message,
            timestamp: new Date(),
            isInternal: message.isInternal || false
        };

        const updateOp: any = {
            $push: { messages: newMessage },
            $set: { updatedAt: new Date() }
        };

        const result = await ticketColl.updateOne(
            { _id: new ObjectId(ticketId) as any },
            updateOp
        );

        if (result.matchedCount === 0) {
            throw new AppError('NOT_FOUND', 404, 'Ticket no encontrado o acceso denegado');
        }

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
     * Reasigna un ticket con auditoría interna.
     */
    static async reassignTicket(ticketId: string, data: { assignedTo: string, note?: string, authorId: string }) {
        const ticketColl = await getTenantCollection<Ticket>("tickets");
        const timestamp = new Date();

        const updateOp: any = {
            $set: {
                assignedTo: data.assignedTo,
                updatedAt: timestamp,
                status: 'IN_PROGRESS'
            }
        };

        if (data.note) {
            updateOp.$push = {
                internalNotes: {
                    id: crypto.randomUUID(),
                    author: data.authorId,
                    content: data.note,
                    timestamp: timestamp
                }
            };
        }

        const result = await ticketColl.updateOne(
            { _id: new ObjectId(ticketId) as any },
            updateOp
        );

        if (result.matchedCount === 0) {
            throw new AppError('NOT_FOUND', 404, 'Ticket no encontrado o acceso denegado');
        }

        await logEvento({
            nivel: 'INFO',
            origen: 'TICKET_SERVICE',
            accion: 'REASSIGN_TICKET',
            mensaje: `Ticket ${ticketId} reasignado a ${data.assignedTo}`,
            correlacion_id: ticketId,
            detalles: { assignedTo: data.assignedTo, note: !!data.note }
        });
    }
}
