/**
 * 🛡️ Maintenance Guard Utility
 * Prevents accidental execution of destructive scripts in production.
 */
export function guardProduction(scriptName: string) {
    if (process.env.NODE_ENV === 'production') {
        console.error(`\x1b[31m[CRITICAL] Destructive script '${scriptName}' blocked in production environment!\x1b[0m`);
        console.error(`[CRITICAL] To override, unset NODE_ENV or use a non-production environment.`);
        process.exit(1);
    }
    console.log(`\x1b[32m[GUARD] Safe to run '${scriptName}' in ${process.env.NODE_ENV || 'development'} mode.\x1b[0m`);
}
