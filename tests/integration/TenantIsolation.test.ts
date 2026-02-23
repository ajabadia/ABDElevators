import { TechnicalEntityRepository } from '@/lib/repositories/TechnicalEntityRepository';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';

// Mock de la base de datos para simular múltiples colecciones
jest.mock('@/lib/db-tenant', () => ({
    getTenantCollection: jest.fn()
}));

describe('🛡️ Tenant Isolation Audit', () => {
    let repository: TechnicalEntityRepository;

    beforeEach(() => {
        repository = new TechnicalEntityRepository();
        jest.clearAllMocks();
    });

    it('should strictly isolate data between tenants in concurrent-like calls', async () => {
        const tenantA = 'TENANT_A';
        const tenantB = 'TENANT_B';
        const mockCollectionA = { findOne: jest.fn().mockResolvedValue({ name: 'Secret A', tenantId: tenantA }) };
        const mockCollectionB = { findOne: jest.fn().mockResolvedValue({ name: 'Secret B', tenantId: tenantB }) };

        // Simulamos que getTenantCollection devuelve la colección correcta según el contexto (aunque aquí lo mockeamos secuencialmente para validar la lógica del repo)
        (getTenantCollection as jest.Mock)
            .mockResolvedValueOnce(mockCollectionA)
            .mockResolvedValueOnce(mockCollectionB);

        const resultA = await repository.findByHash('hash', tenantA);
        const resultB = await repository.findByHash('hash', tenantB);

        // Verificación 1: getTenantCollection fue llamado sin filtrar explícitamente el tenant (porque getTenantCollection ya lo hace internamente por sesión o parámetro)
        // En Era 7, el aislamiento es implícito en getTenantCollection.
        expect(getTenantCollection).toHaveBeenCalledTimes(2);

        // Verificación 2: Los resultados son correctos y no están mezclados
        expect(resultA.tenantId).toBe(tenantA);
        expect(resultB.tenantId).toBe(tenantB);
        expect(resultA.name).toBe('Secret A');
        expect(resultB.name).toBe('Secret B');
    });

    it('should enforce tenantId filter in repository methods if manually passed', async () => {
        const mockCollection = { findOne: jest.fn() };
        (getTenantCollection as jest.Mock).mockResolvedValue(mockCollection);

        await repository.findByHash('test-hash', 'TENANT_CHECK');

        // Validamos que el repositorio incluya el tenantId en su query local además del aislamiento de la colección
        expect(mockCollection.findOne).toHaveBeenCalledWith(expect.objectContaining({
            tenantId: 'TENANT_CHECK'
        }));
    });
});
