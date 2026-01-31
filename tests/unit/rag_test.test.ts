import { performTechnicalSearch } from '../../src/lib/rag-service';
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";

jest.mock('@langchain/mongodb');

describe('Simple Test', () => {
    it('should pass', () => {
        expect(1).toBe(1);
    });
});
