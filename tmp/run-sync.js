
const { execSync } = require('child_process');
const path = require('path');

try {
    process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
        module: "CommonJS",
        esModuleInterop: true
    });

    console.log('Running sync script...');
    execSync('npx ts-node scripts/migrations/sync-all-i18n.ts', { stdio: 'inherit' });
    console.log('Sync finished.');
} catch (error) {
    console.error('Execution failed:', error);
}
