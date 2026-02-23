import { TechnicalEntityRepository } from '@/lib/repositories/TechnicalEntityRepository';
import { getTenantCollection } from '@/lib/db-tenant';

jest.mock('@/lib/db-tenant', () => ({
    getTenantCollection: jest.fn()
}));

describe('🏛️ TechnicalEntityRepository', () => {
    let repository: TechnicalEntityRepository;
    let mockCollection: any;

    beforeEach(() => {
        repository = new TechnicalEntityRepository();
        mockCollection = {
            findOne: jest.fn()
        };
        (getTenantCollection as jest.Mock).mockResolvedValue(mockCollection);
    });

    it('should find by hash and tenantId', async () => {
        const md5Hash = 'test-hash';
        const tenantId = 'test-tenant';
        mockCollection.findOne.mockResolvedValue({ md5Hash, tenantId, name: 'Entity' });

        const result = await repository.findByHash(md5Hash, tenantId);

        expect(mockCollection.findOne).toHaveBeenCalledWith({ md5Hash, tenantId });
        expect(result?.name).toBe('Entity');
    });
});
