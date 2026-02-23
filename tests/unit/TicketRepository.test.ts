import { TicketRepository } from '@/lib/repositories/TicketRepository';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';

jest.mock('@/lib/db-tenant', () => ({
    getTenantCollection: jest.fn()
}));

describe('🏛️ TicketRepository', () => {
    let repository: TicketRepository;
    let mockCollection: any;

    beforeEach(() => {
        repository = new TicketRepository();
        mockCollection = {
            findOne: jest.fn(),
            insertOne: jest.fn()
        };
        (getTenantCollection as jest.Mock).mockResolvedValue(mockCollection);
    });

    it('should be correctly initialized with tickets collection', async () => {
        const id = new ObjectId().toString();
        mockCollection.findOne.mockResolvedValue(null);
        await repository.findById(id);
        expect(getTenantCollection).toHaveBeenCalledWith('tickets', undefined);
    });
});
