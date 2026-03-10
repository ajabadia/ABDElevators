import { DashboardService } from './src/services/admin/dashboard-service';

async function testStats() {
    console.log("Starting test...");
    try {
        const stats = await DashboardService.getGlobalStats();
        console.log("Stats retrieved successfully:", !!stats);
    } catch (error) {
        console.error("Error retrieving global stats:", error);
    }
    process.exit(0);
}

testStats();
