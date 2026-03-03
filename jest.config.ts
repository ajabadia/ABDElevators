import type { Config } from 'jest';

const config: Config = {
    roots: ['<rootDir>/tests'],
    testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
    transform: {
        '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
    },
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^lib/(.*)$': '<rootDir>/src/lib/$1',
        '^services/(.*)$': '<rootDir>/src/services/$1',
        '^@abd/platform-core/(.*)$': '<rootDir>/packages/platform-core/src/$1',
        '^@abd/platform-core$': '<rootDir>/packages/platform-core/src/index.ts',
        '^@abd/workflow-engine/(.*)$': '<rootDir>/packages/workflow-engine/src/$1',
        '^@abd/workflow-engine$': '<rootDir>/packages/workflow-engine/src/index.ts',
        '^@abd/rag-engine/(.*)$': '<rootDir>/packages/rag-engine/src/$1',
        '^@abd/rag-engine$': '<rootDir>/packages/rag-engine/src/index.ts'
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}',
        '!src/**/index.{ts,tsx,js,jsx}',
        '!src/**/_app.{ts,tsx,js,jsx}',
        '!src/**/_document.{ts,tsx,js,jsx}',
    ],
    coverageDirectory: '<rootDir>/coverage',
    verbose: true,
};

export default config;
