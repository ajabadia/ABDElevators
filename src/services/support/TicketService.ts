import crypto from 'crypto';
import { Ticket, TicketSchema, TicketMessage } from "./schemas/TicketSchema";
import { TicketRepository } from "./TicketRepository";
import { AppError } from "@/lib/errors";
import { logEvento } from "@/lib/logger";

/**
 * TicketService - Domain service for the Support/Ticketing module.
 * Reinforces separation as an independent app within the suite.
 */
export class TicketService {

    /**
     * Creates a new ticket with a sequential TKT-YYYY-XXXXX format.
     */
    static async createTicket(data: Partial<Ticket> & { tenantId: string, createdBy: string, userEmail: string }) {
        // Generar ID secuencial
        const count = await TicketRepository.count({ tenantId: data.tenantId });
        const year = new Date().getFullYear();
        const ticketNumber = `TKT-${year}-${(count + 1).toString().padStart(5, '0')}`;

        const newTicket: Ticket = {
            ...data,
            ticketNumber,
            status: data.status || "OPEN",
            priority: data.priority || "MEDIUM",
            category: data.category || "TECHNICAL",
            createdAt: new Date(),
            updatedAt: new Date(),
            messages: [],
            internalNotes: [],
            attachments: data.attachments || [],
            tags: data.tags || [],
            tenantId: data.tenantId,
            createdBy: data.createdBy,
            userEmail: data.userEmail,
            subject: data.subject || "Sin asunto",
            description: data.description || "Sin descripción"
        };

        const validated = TicketSchema.parse(newTicket);
        const insertedId = await TicketRepository.create(validated as Ticket);

        await logEvento({
            level: 'INFO',
            source: 'SUPPORT_TICKETS',
            action: 'CREATE_TICKET',
            message: `Ticket ${ticketNumber} creado para ${data.userEmail}`,
            correlationId: ticketNumber,
            tenantId: data.tenantId,
            userId: data.createdBy
        });

        return { ...validated, _id: insertedId };
    }

    /**
     * Lists tickets with multi-tenant isolation.
     */
    static async getTickets(options: {
        userId?: string;
        userEmail?: string;
        status?: string;
        priority?: string;
        limit?: number;
    }) {
        const query: any = {};
        if (options.userId) query.createdBy = options.userId;
        if (options.userEmail) query.userEmail = options.userEmail;
        if (options.status) query.status = options.status;
        if (options.priority) query.priority = options.priority;

        return await TicketRepository.list(query, {
            sort: { updatedAt: -1, priority: -1 },
            limit: options.limit || 50
        });
    }

    /**
     * Retrieves a single ticket ensuring ACL.
     */
    static async getTicketByIdWithAcl(id: string, session: any) {
        const ticket = await TicketRepository.findById(id, session.user.tenantId);

        if (!ticket) {
            throw new AppError('NOT_FOUND', 404, 'Ticket no encontrado');
        }

        // ACL logic
        const canManage = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'].includes(session.user.role);

        if (canManage) {
            // Simplified: getTenantCollection already filters by session tenantId or allowed list if using multi-tenant wrapper
            // But we reinforce here for the explicit logic requested
            if (session.user.role !== 'SUPER_ADMIN') {
                const allowedTenants = [
                    session.user.tenantId,
                    ...(session.user.tenantAccess || []).map((t: any) => t.tenantId)
                ].filter(Boolean);

                if (!allowedTenants.includes(ticket.tenantId)) {
                    throw new AppError('FORBIDDEN', 403, 'Acceso denegado a este ticket de otro tenant');
                }
            }
        } else {
            if (ticket.createdBy !== session.user.id) {
                throw new AppError('FORBIDDEN', 403, 'Solo puedes ver tus propios tickets');
            }
        }

        return ticket;
    }

    /**
     * Adds a message to the conversation.
     */
    static async addMessage(
        ticketId: string,
        tenantId: string,
        message: Omit<TicketMessage, 'id' | 'timestamp'>
    ) {
        const newMessage: TicketMessage = {
            id: crypto.randomUUID(),
            ...message,
            timestamp: new Date()
        };

        const updateOp = {
            $push: { messages: newMessage },
            $set: { updatedAt: new Date() }
        };

        const success = await TicketRepository.update(ticketId, updateOp);

        if (!success) {
            throw new AppError('NOT_FOUND', 404, 'No se pudo añadir el mensaje');
        }

        await logEvento({
            level: 'INFO',
            source: 'SUPPORT_TICKETS',
            action: 'ADD_MESSAGE',
            message: `Nuevo mensaje en ticket ${ticketId}`,
            correlationId: ticketId,
            tenantId
        });

        return newMessage;
    }

    /**
     * Updates ticket status based on reply authorship.
     */
    static async updateStatusOnReply(ticketId: string, tenantId: string, authorType: 'User' | 'Support') {
        const ticket = await TicketRepository.findById(ticketId, tenantId);
        if (!ticket) return;

        let newStatus = ticket.status;
        if (authorType === 'User' && ticket.status === 'WAITING_USER') {
            newStatus = 'OPEN';
        } else if (authorType === 'Support' && !['RESOLVED', 'CLOSED'].includes(ticket.status)) {
            newStatus = 'WAITING_USER';
        }

        if (newStatus !== ticket.status) {
            await TicketRepository.update(ticketId, {
                $set: { status: newStatus as any, updatedAt: new Date() }
            });
        }
    }

    /**
     * Reassigns a ticket to another team member.
     */
    static async reassignTicket(ticketId: string, tenantId: string, data: { assignedTo: string, note?: string, authorId: string }) {
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

        const success = await TicketRepository.update(ticketId, updateOp);
        if (!success) throw new AppError('NOT_FOUND', 404, 'Ticket no encontrado');

        await logEvento({
            level: 'INFO',
            source: 'SUPPORT_TICKETS',
            action: 'REASSIGN',
            message: `Ticket ${ticketId} reasignado a ${data.assignedTo}`,
            correlationId: ticketId,
            tenantId
        });
    }
}
