import { BaseRepository } from './BaseRepository';
import { Ticket } from '../schemas/ticketing';

/**
 * 🎫 TicketRepository
 * Centralized data access for support tickets.
 * Cluster: MAIN
 */
export class TicketRepository extends BaseRepository<Ticket> {
    constructor() {
        super('tickets');
    }
}

export const ticketRepository = new TicketRepository();
