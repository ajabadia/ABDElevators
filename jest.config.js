module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@abd/platform-core/(.*)$': '<rootDir>/packages/platform-core/src/$1',
        '^@abd/platform-core$': '<rootDir>/packages/platform-core/src/index.ts',
        '^@abd/workflow-engine/(.*)$': '<rootDir>/packages/workflow-engine/src/$1',
        '^@abd/workflow-engine$': '<rootDir>/packages/workflow-engine/src/index.ts',
        '^@abd/rag-engine/(.*)$': '<rootDir>/packages/rag-engine/src/$1',
        '^@abd/rag-engine$': '<rootDir>/packages/rag-engine/src/index.ts'
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx', '**/__tests__/**/*.test.ts'],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: 'tsconfig.json',
        }],
    },
};
