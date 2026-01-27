module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: 'tsconfig.json',
        }],
    },
};
