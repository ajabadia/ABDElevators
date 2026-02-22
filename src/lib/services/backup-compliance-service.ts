import { connectDB } from '@/lib/db';
import AdmZip from 'adm-zip';

/**
 * BackupService
 * Handles data portability and backup packages.
 */
export class BackupService {

    /**
     * Generates a full JSON dump of a tenant's data.
     * Useful for Backup, Migration, or Portability.
     */
    static async generateTenantBackup(tenantId: string) {
        const db = await connectDB();
        const collections = ['users', 'tenant_configs', 'knowledge_assets', 'tickets', 'audit_ingestion'];

        const backupData: Record<string, any[]> = {};

        for (const col of collections) {
            backupData[col] = await db.collection(col).find({ tenantId }).toArray();
        }

        return backupData;
    }

    /**
     * Creates a portable .zip package containing metadata and readme.
     */
    static async createKnowledgePackage(tenantId: string): Promise<Buffer> {
        const zip = new AdmZip();

        // 1. Fetch Metadata
        const data = await this.generateTenantBackup(tenantId);
        zip.addFile("tenant_data.json", Buffer.from(JSON.stringify(data, null, 2)));

        // 2. Add Readme
        const readme = `
        ABD RAG PLATFORM - KNOWLEDGE EXPORT
        ===================================
        Tenant ID: ${tenantId}
        Export Date: ${new Date().toISOString()}

        Contents:
        - tenant_data.json: valid JSON containing users, assets, and config.
        `;
        zip.addFile("README.txt", Buffer.from(readme));

        return zip.toBuffer();
    }
}
