/**
 * 🎵 ERA 10 FEATURE FLAG (Phase 260)
 * 
 * Provides utilities to toggle between Era 9 and Era 10 UX layouts.
 */

/**
 * Checks if the Era 10 "Clarity" UX mode is active.
 * Controlled by the NEXT_PUBLIC_ERA10_UX environment variable.
 */
export function isEra10Mode(): boolean {
    return process.env.NEXT_PUBLIC_ERA10_UX === 'true';
}

/**
 * Helper to return different values based on the current Era mode.
 * Useful for breadcrumbs, labels, or layout configurations.
 */
export function withEra10Value<T>(era9: T, era10: T): T {
    return isEra10Mode() ? era10 : era9;
}
