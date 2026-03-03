jest.setTimeout(30000);

// Global environment setup
if (!process.env.NODE_ENV) {
    (process.env as any).NODE_ENV = 'test';
}
process.env.AUTH_SECRET = 'test-secret';

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
