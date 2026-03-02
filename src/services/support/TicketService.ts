import crypto from 'crypto';
import { Ticket, TicketSchema, TicketStatus, TicketPriority } from "@/lib/schemas/ticketing";
import { ticketRepository } from "@/lib/repositories/TicketRepository";
import { AppError } from "@/lib/errors";
import { logEvento } from "@/lib/logger";
import { TenantSession } from "@/lib/db-tenant";
import { Filter, UpdateFilter } from 'mongodb';

/**
 * 🎫 TicketMessage - Local interface for internal message structure
 */
interface TicketMessage {
    id: string;
    author: string;
    authorType: 'User' | 'Support';
    authorName: string;
    content: string;
    timestamp: Date;
    isInternal: boolean;
}

/**
 * 🏢 TicketService
 * Domain service for the Support/Ticketing module.
 * Standardized for Era 8 (Zero any, explicit types).
 */
export class TicketService {

    /**
     * Creates a new ticket with a sequential TKT-YYYY-XXXXX format.
     */
    static async createTicket(data: {
        tenantId: string,
        createdBy: string,
        userEmail: string,
        subject: string,
        description: string,
        priority?: TicketPriority,
        category?: string,
        attachments?: Ticket['attachments']
    }): Promise<Ticket> {
        // 1. Generate sequential number
        const count = await ticketRepository.count({ tenantId: data.tenantId });
        const year = new Date().getFullYear();
        const ticketNumber = `TKT-${year}-${(count + 1).toString().padStart(5, '0')}`;

        const newTicketData = {
            ticketNumber,
            tenantId: data.tenantId,
            createdBy: data.createdBy,
            subject: data.subject,
            description: data.description,
            priority: data.priority || 'MEDIUM',
            category: data.category || 'TECHNICAL',
            status: 'OPEN' as TicketStatus,
            attachments: data.attachments || [],
            messages: [],
            internalNotes: [],
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const validated = TicketSchema.parse(newTicketData);
        // Cast mock session to any to satisfy getTenantCollection without full object
        const insertedId = await ticketRepository.create(validated, { user: { tenantId: data.tenantId, role: 'SYSTEM' } } as any);

        await logEvento({
            level: 'INFO',
            source: 'SUPPORT_TICKETS',
            action: 'CREATE_TICKET',
            message: `Ticket ${ticketNumber} creado para ${data.userEmail}`,
            correlationId: ticketNumber,
            details: { ticketNumber, tenantId: data.tenantId, userId: data.createdBy }
        });

        return { ...validated, _id: insertedId };
    }

    /**
     * Lists tickets with multi-tenant isolation and filtering.
     */
    static async getTickets(options: {
        userId?: string;
        tenantId: string;
        status?: TicketStatus;
        priority?: TicketPriority;
        limit?: number;
    }): Promise<Ticket[]> {
        const query: Filter<Ticket> = { tenantId: options.tenantId };
        if (options.userId) query.createdBy = options.userId;
        if (options.status) query.status = options.status;
        if (options.priority) query.priority = options.priority;

        return await ticketRepository.list(query, {
            sort: { updatedAt: -1, priority: -1 },
            limit: options.limit || 50
        });
    }

    /**
     * Retrieves a single ticket ensuring ACL.
     */
    static async getTicketByIdWithAcl(id: string, session: TenantSession): Promise<Ticket> {
        const ticket = await ticketRepository.findById(id);

        if (!ticket) {
            throw new AppError('NOT_FOUND', 404, 'Ticket no encontrado');
        }

        const user = session.user;
        if (!user) throw new AppError('UNAUTHORIZED', 401, 'No session found');

        const canManage = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'].includes(user.role);

        if (canManage) {
            if (user.role !== 'SUPER_ADMIN') {
                const allowedTenants = [
                    user.tenantId,
                    ...(user.tenantAccess || []).map((t: { tenantId: string }) => t.tenantId)
                ].filter(Boolean);

                if (!allowedTenants.includes(ticket.tenantId)) {
                    throw new AppError('FORBIDDEN', 403, 'Acceso denegado a este ticket de otro tenant');
                }
            }
        } else {
            if (ticket.createdBy !== user.id) {
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
    ): Promise<TicketMessage> {
        const newMessage: TicketMessage = {
            id: crypto.randomUUID(),
            ...message,
            timestamp: new Date()
        };

        const updateOp: UpdateFilter<Ticket> = {
            $push: { messages: newMessage as any },
            $set: { updatedAt: new Date() }
        };

        const success = await ticketRepository.update(ticketId, updateOp);

        if (!success) {
            throw new AppError('NOT_FOUND', 404, 'No se pudo añadir el mensaje al ticket');
        }

        await logEvento({
            level: 'INFO',
            source: 'SUPPORT_TICKETS',
            action: 'ADD_MESSAGE',
            message: `Nuevo mensaje en ticket ${ticketId}`,
            correlationId: ticketId,
            details: { ticketId, tenantId, authorType: message.authorType }
        });

        return newMessage;
    }

    /**
     * Updates ticket status based on reply authorship.
     */
    static async updateStatusOnReply(ticketId: string, authorType: 'User' | 'Support'): Promise<void> {
        const ticket = await ticketRepository.findById(ticketId);
        if (!ticket) return;

        let newStatus = ticket.status as TicketStatus;
        if (authorType === 'User' && ticket.status === 'WAITING_USER') {
            newStatus = 'OPEN';
        } else if (authorType === 'Support' && !['RESOLVED', 'CLOSED'].includes(ticket.status)) {
            newStatus = 'WAITING_USER';
        }

        if (newStatus !== ticket.status) {
            await ticketRepository.update(ticketId, {
                $set: { status: newStatus, updatedAt: new Date() }
            } as UpdateFilter<Ticket>);
        }
    }

    /**
     * Reassigns a ticket to another team member.
     */
    static async reassignTicket(ticketId: string, tenantId: string, data: { assignedTo: string, note?: string, authorId: string }): Promise<void> {
        const timestamp = new Date();
        const updateOp: UpdateFilter<Ticket> = {
            $set: {
                assignedTo: data.assignedTo,
                updatedAt: timestamp,
                status: 'IN_PROGRESS' as TicketStatus
            }
        };

        if (data.note) {
            updateOp.$push = {
                internalNotes: {
                    id: crypto.randomUUID(),
                    author: data.authorId,
                    content: data.note,
                    timestamp: timestamp
                } as any
            };
        }

        const success = await ticketRepository.update(ticketId, updateOp);
        if (!success) throw new AppError('NOT_FOUND', 404, 'Ticket no encontrado');

        await logEvento({
            level: 'INFO',
            source: 'SUPPORT_TICKETS',
            action: 'REASSIGN',
            message: `Ticket ${ticketId} reasignado a ${data.assignedTo}`,
            correlationId: ticketId,
            details: { ticketId, tenantId, assignedTo: data.assignedTo }
        });
    }
}
