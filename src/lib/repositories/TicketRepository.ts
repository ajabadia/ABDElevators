import { BaseRepository } from './BaseRepository';
import { Ticket } from '../schemas/ticketing';

/**
 * 🎫 TicketRepository
 * Centralized data access for support tickets.
 * Cluster: MAIN
 */
export class TicketRepository extends BaseRepository<Ticket> {
    protected readonly collectionName = 'tickets';

    constructor() {
        super();
    }
}

export const ticketRepository = new TicketRepository();
