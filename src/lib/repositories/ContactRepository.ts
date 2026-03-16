import { BaseRepository } from './BaseRepository';
import { ContactRequest } from '../schemas';

/**
 * 📞 ContactRepository
 * Centralized data access for contact requests.
 * Cluster: MAIN
 */
export class ContactRepository extends BaseRepository<ContactRequest> {
    constructor() {
        super('contact_requests');
    }
}

export const contactRepository = new ContactRepository();
