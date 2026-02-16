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
            level: 'INFO',
            source: 'TICKET_SERVICE',
            action: 'CREATE_TICKET',
            message: `Ticket creado ${ticketNumber} para ${data.userEmail}`,
            correlationId: ticketNumber,
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
            level: 'INFO',
            source: 'TICKET_SERVICE',
            action: 'ADD_MESSAGE',
            message: `Nuevo mensaje en ticket ${ticketId} por ${message.author}`,
            correlationId: ticketId,
            details: { author: message.author }
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
            level: 'INFO',
            source: 'TICKET_SERVICE',
            action: 'REASSIGN_TICKET',
            message: `Ticket ${ticketId} reasignado a ${data.assignedTo}`,
            correlationId: ticketId,
            details: { assignedTo: data.assignedTo, note: !!data.note }
        });
    }

    /**
     * Recupera un ticket individual validando acceso por tenant y rol.
     * Fase 173.1: Consolidación de ACL.
     */
    static async getTicketByIdWithAcl(id: string, session: any) {
        const ticketColl = await getTenantCollection<Ticket>("tickets");
        const ticket = await ticketColl.findOne({ _id: new ObjectId(id) as any });

        if (!ticket) {
            throw new AppError('NOT_FOUND', 404, 'Ticket no encontrado');
        }

        const isSupport = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'].includes(session.user.role);

        if (isSupport) {
            if (session.user.role !== 'SUPER_ADMIN') {
                const allowedTenants = [
                    session.user.tenantId,
                    ...(session.user.tenantAccess || []).map((t: any) => t.tenantId)
                ].filter(Boolean);

                if (!allowedTenants.includes(ticket.tenantId)) {
                    throw new AppError('FORBIDDEN', 403, 'No tienes permiso para ver este ticket');
                }
            }
        } else {
            if (ticket.createdBy !== session.user.id) {
                throw new AppError('FORBIDDEN', 403, 'No tienes permiso para ver este ticket');
            }
        }

        return ticket;
    }

    /**
     * Actualiza el estado del ticket basado en el tipo de autor (User/Support).
     */
    static async updateStatusOnReply(ticketId: string, authorType: 'User' | 'Support') {
        const ticketColl = await getTenantCollection<Ticket>("tickets");
        const ticket = await ticketColl.findOne({ _id: new ObjectId(ticketId) as any });

        if (!ticket) return;

        let newStatus = ticket.status;
        if (authorType === 'User' && ticket.status === 'WAITING_USER') {
            newStatus = 'OPEN';
        } else if (authorType === 'Support' && !['RESOLVED', 'CLOSED'].includes(ticket.status)) {
            newStatus = 'WAITING_USER';
        }

        if (newStatus !== ticket.status) {
            await ticketColl.updateOne(
                { _id: new ObjectId(ticketId) as any },
                { $set: { status: newStatus as any, updatedAt: new Date() } }
            );
        }
    }
}
