import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables for tests
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

jest.setTimeout(30000);

// Global environment setup
if (!process.env.NODE_ENV) {
    (process.env as any).NODE_ENV = 'test';
}
process.env.AUTH_SECRET = 'test-secret';

// Disable real Redis connections to prevent quota issues during tests
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.REDIS_URL;

// Common global mocks
jest.mock('@/lib/logger', () => ({
    logEvento: jest.fn().mockResolvedValue(undefined),
}));

// Mock next/headers for server components/actions
jest.mock('next/headers', () => ({
    headers: jest.fn().mockImplementation(() => {
        return Promise.resolve({
            get: jest.fn().mockReturnValue('127.0.0.1'),
        });
    }),
}));
