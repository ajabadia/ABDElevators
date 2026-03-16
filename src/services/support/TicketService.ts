import { Ticket, TicketSchema, TicketStatus, TicketPriority } from "@/lib/schemas/ticketing";
import { ticketRepository } from "@/lib/repositories/TicketRepository";
import { AppError } from "@/lib/errors";
import { TenantSession } from "@/lib/db-tenant";
import { EntityId, EntityIdSchema, TenantId, TenantIdSchema } from "@/lib/schemas/common";
import { Filter, UpdateFilter } from 'mongodb';
import { withCorrelation } from "@/lib/logger/with-correlation";
import { getSystemSession } from "@/lib/sessions/system-session";
import { CorrelationIdService } from "@/services/observability/CorrelationIdService";

/**
 * 🎫 TicketMessage - Local interface for internal message structure
 */
interface TicketMessage {
    id: EntityId;
    author: EntityId;
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
        tenantId: TenantId,
        createdBy: EntityId,
        userEmail: string,
        subject: string,
        description: string,
        priority?: TicketPriority,
        category?: string,
        attachments?: Ticket['attachments']
    }): Promise<Ticket> {
        return withCorrelation({ level: 'INFO', source: 'SUPPORT_TICKETS', action: 'CREATE_TICKET', tenantId: data.tenantId }, async ({ log, correlationId }) => {
            // 1. Generate sequential number
            const systemSession = getSystemSession(data.tenantId);
            const count = await ticketRepository.count({ tenantId: data.tenantId } as any, systemSession);
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
            const insertedId = await ticketRepository.create(validated, systemSession);

            await log({
                message: `Ticket ${ticketNumber} created for ${data.userEmail}`,
                details: { ticketNumber, tenantId: data.tenantId, userId: data.createdBy }
            });

            return { ...validated, _id: insertedId } as any;
        });
    }

    /**
     * Lists tickets with multi-tenant isolation and filtering.
     */
    static async getTickets(options: {
        userId?: EntityId;
        tenantId: TenantId;
        status?: TicketStatus;
        priority?: TicketPriority;
        limit?: number;
    }, session?: TenantSession): Promise<Ticket[]> {
        const query: Filter<Ticket> = { tenantId: options.tenantId };
        if (options.userId) query.createdBy = options.userId;
        if (options.status) query.status = options.status;
        if (options.priority) query.priority = options.priority;

        return await ticketRepository.find(query, {
            sort: { updatedAt: -1, priority: -1 } as any,
            limit: options.limit || 50
        }, session);
    }

    /**
     * Retrieves a single ticket ensuring ACL.
     */
    static async getTicketByIdWithAcl(id: EntityId, session: TenantSession): Promise<Ticket> {
        const ticket = await ticketRepository.findById(id);

        if (!ticket) {
            throw new AppError('NOT_FOUND', 404, 'Ticket not found');
        }

        const user = session.user;
        if (!user) throw new AppError('UNAUTHORIZED', 401, 'No session found');

        const canManage = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'].includes(user.role);

        if (canManage) {
            if (user.role !== 'SUPER_ADMIN') {
                const allowedTenants = [
                    user.tenantId,
                    ...(user.tenantAccess || []).map((t: { tenantId: string }) => t.tenantId as TenantId)
                ].filter(Boolean) as TenantId[];

                if (!allowedTenants.includes(ticket.tenantId)) {
                    throw new AppError('FORBIDDEN', 403, 'Access denied to this ticket from another tenant');
                }
            }
        } else {
            if (ticket.createdBy !== user.id) {
                throw new AppError('FORBIDDEN', 403, 'You can only view your own tickets');
            }
        }

        return ticket;
    }

    /**
     * Adds a message to the conversation.
     */
    static async addMessage(
        ticketId: EntityId,
        tenantId: TenantId,
        message: Omit<TicketMessage, 'id' | 'timestamp'>,
        session?: TenantSession
    ): Promise<TicketMessage> {
        return withCorrelation({ level: 'INFO', source: 'SUPPORT_TICKETS', action: 'ADD_MESSAGE', tenantId }, async ({ log, correlationId }) => {
            const newMessage: TicketMessage = {
                id: CorrelationIdService.generate() as EntityId,
                ...message,
                timestamp: new Date()
            };

            const updateOp: UpdateFilter<Ticket> = {
                $push: { messages: newMessage as any },
                $set: { updatedAt: new Date() }
            };

            const success = await ticketRepository.update(ticketId, updateOp, session);

            if (!success) {
                throw new AppError('NOT_FOUND', 404, 'Could not add message to ticket');
            }

            await log({
                message: `New message in ticket ${ticketId}`,
                details: { ticketId, tenantId, authorType: message.authorType }
            });

            return newMessage;
        });
    }

    /**
     * Updates ticket status based on reply authorship.
     */
    static async updateStatusOnReply(ticketId: EntityId, authorType: 'User' | 'Support'): Promise<void> {
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
    static async reassignTicket(ticketId: EntityId, tenantId: TenantId, data: { assignedTo: EntityId, note?: string, authorId: EntityId }, session?: TenantSession): Promise<void> {
        return withCorrelation({ level: 'INFO', source: 'SUPPORT_TICKETS', action: 'REASSIGN', tenantId }, async ({ log, correlationId }) => {
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
                        id: CorrelationIdService.generate() as EntityId,
                        author: data.authorId,
                        content: data.note,
                        timestamp: timestamp
                    } as any
                };
            }

            const success = await ticketRepository.update(ticketId, updateOp, session);
            if (!success) throw new AppError('NOT_FOUND', 404, 'Ticket not found');

            await log({
                message: `Ticket ${ticketId} reassigned to ${data.assignedTo}`,
                details: { ticketId, tenantId, assignedTo: data.assignedTo }
            });
        });
    }
}
