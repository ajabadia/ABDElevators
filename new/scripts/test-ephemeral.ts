import { EphemeralTenantService } from '../src/lib/services/ephemeral-service';

async function main() {
    console.log("Testing Ephemeral Tenant Factory...");

    // 1. Create
    const result = await EphemeralTenantService.createEphemeralTenant('test-user@demo.inc', 1);
    console.log("Created Tenant:", result);

    // 2. Cleanup (Simulate expiry by passing strict time if needed, but our logic scans DB)
    // In a real test we would hack the DB date. For this script, we just run the scan.
    console.log("Running Cleanup Scan...");
    const cleanup = await EphemeralTenantService.cleanupExpiredTenants();
    console.log("Cleanup Result:", cleanup);

    process.exit(0);
}

main().catch(console.error);
