import { BaseRepository } from './BaseRepository';
import { Ticket } from '@/services/support/schemas/TicketSchema';

/**
 * 🏛️ TicketRepository
 * Repositorio centralizado para tickets de soporte.
 */
export class TicketRepository extends BaseRepository<Ticket> {
    protected readonly collectionName = 'tickets';
}

export const ticketRepository = new TicketRepository();
