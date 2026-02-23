import { BaseRepository } from '@/lib/repositories/BaseRepository';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';

// Mock getTenantCollection
jest.mock('@/lib/db-tenant', () => ({
    getTenantCollection: jest.fn()
}));

// Concrete implementation for testing
class TestRepository extends BaseRepository<any> {
    protected readonly collectionName = 'test_collection';
}

describe('🏛️ BaseRepository', () => {
    let repository: TestRepository;
    let mockCollection: any;

    beforeEach(() => {
        repository = new TestRepository();
        mockCollection = {
            findOne: jest.fn(),
            find: jest.fn().mockReturnThis(),
            toArray: jest.fn(),
            insertOne: jest.fn(),
            updateOne: jest.fn(),
            countDocuments: jest.fn(),
            bulkWrite: jest.fn()
        };
        (getTenantCollection as jest.Mock).mockResolvedValue(mockCollection);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findById()', () => {
        it('should call findOne with correct ObjectId filter', async () => {
            const id = new ObjectId();
            mockCollection.findOne.mockResolvedValue({ _id: id, name: 'Test' });

            const result = await repository.findById(id.toString());

            expect(getTenantCollection).toHaveBeenCalledWith('test_collection', undefined);
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: id });
            expect(result).toEqual({ _id: id, name: 'Test' });
        });
    });

    describe('create()', () => {
        it('should call insertOne and return insertedId string', async () => {
            const data = { name: 'New Item' };
            const id = new ObjectId();
            mockCollection.insertOne.mockResolvedValue({ insertedId: id });

            const result = await repository.create(data);

            expect(mockCollection.insertOne).toHaveBeenCalledWith(data, { session: undefined });
            expect(result).toBe(id.toString());
        });
    });

    describe('list()', () => {
        it('should call find with defaults and return array', async () => {
            const items = [{ _id: new ObjectId(), name: 'Item 1' }];
            mockCollection.toArray.mockResolvedValue(items);

            const result = await repository.list();

            expect(mockCollection.find).toHaveBeenCalledWith({}, expect.objectContaining({
                limit: 50,
                skip: 0
            }));
            expect(result).toEqual(items);
        });
    });

    describe('softDelete()', () => {
        it('should call updateOne with deletedAt date', async () => {
            const id = new ObjectId();
            mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 });

            const result = await repository.softDelete(id);

            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                { _id: id },
                expect.objectContaining({
                    $set: expect.objectContaining({
                        deletedAt: expect.any(Date)
                    })
                }),
                { session: undefined }
            );
            expect(result).toBe(true);
        });
    });
});
