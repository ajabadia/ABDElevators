import { BackupService, ComplianceService } from '../src/lib/services/backup-compliance-service';
import fs from 'fs';

async function main() {
    const tenantId = 'demo-tenant-id'; // Replace with a valid ID if you want real data

    console.log("1. Generating Knowledge Package (ZIP)...");
    const zipBuffer = await BackupService.createKnowledgePackage(tenantId);
    fs.writeFileSync('test-backup.zip', zipBuffer);
    console.log("   > Saved test-backup.zip");

    console.log("2. Generating GDPR Certificate (PDF)...");
    const pdfBuffer = await ComplianceService.generateDeletionCertificate(tenantId, 'user@example.com');
    fs.writeFileSync('test-certificate.pdf', pdfBuffer);
    console.log("   > Saved test-certificate.pdf");

    process.exit(0);
}

main().catch(console.error);
