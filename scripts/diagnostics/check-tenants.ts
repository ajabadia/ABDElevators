import { TenantService } from "../src/services/tenant/tenant-service";
import { connectDB } from "../src/lib/db";

async function main() {
    try {
        await connectDB();
        const tenants = await TenantService.getAllTenants();
        console.log("Total tenants found:", tenants.length);
        tenants.forEach(t => {
            console.log(`- [${t.tenantId}] ${t.name}`);
        });
        process.exit(0);
    } catch (err: any) {
        console.error("Error checking tenants:", err);
        if (err.stack) console.error(err.stack);
        if (err.details) console.log("Error details:", JSON.stringify(err.details, null, 2));
        process.exit(1);
    }
}

main();
