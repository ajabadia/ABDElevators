/**
 * 🛠️ Demo Mode Utility (ERA 8)
 * Centralized logic to determine if the application is running in demonstration mode.
 * Based on NEXT_PUBLIC_DEMO_MODE environment variable.
 */

export function isDemoMode(): boolean {
    return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/**
 * Higher-order logic for demo-only components or features.
 */
export function withDemoData<T>(prodData: T, demoData: T): T {
    return isDemoMode() ? demoData : prodData;
}
