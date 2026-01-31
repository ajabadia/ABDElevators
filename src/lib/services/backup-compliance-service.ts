import { connectDB } from '@/lib/db';
import { jsPDF } from 'jspdf';
import { logEvento } from '@/lib/logger';
import AdmZip from 'adm-zip';

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
     * Creates a portable .zip package containing:
     * 1. data.json (Metadata)
     * 2. README.txt
     * (Future: could include physical PDF files if we fetch them from storage)
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

export class ComplianceService {

    /**
     * Generates a legal PDF certificate of data destruction.
     * To be sent to the user after a GDPR "Right to be Forgotten" request is processed.
     */
    static async generateDeletionCertificate(
        tenantId: string,
        requesterEmail: string,
        reason: string = "GDPR Rights Request"
    ): Promise<Buffer> {
        const doc = new jsPDF();
        const date = new Date();

        // Header
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('DATA DESTRUCTION CERTIFICATE', 20, 30);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Certificate ID: ${date.getTime()}-${tenantId.substring(0, 5)}`, 20, 45);
        doc.text(`Date of Issuance: ${date.toISOString()}`, 20, 52);

        // Body
        doc.setFontSize(14);
        doc.text('Certification Statement:', 20, 70);

        doc.setFontSize(11);
        const text = `
This document certifies that ABD RAG PLATFORM has permanently deleted 
all logical and physical data associated with the Tenant ID: ${tenantId}.

Request Details:
- Requester: ${requesterEmail}
- Reason: ${reason}
- Process Completion: ${date.toLocaleString()}

Scope of Deletion:
- User Accounts and Personal Profiles
- Uploaded Documents and RAG Knowledge Assets
- Usage Logs and Audit Trails (Anonymized retention where required by law)
- Billing Methods and Payment Tokens

This action is irreversible.
        `;

        doc.text(text, 20, 80);

        // Signature
        doc.text('Digitally Signed,', 20, 180);
        doc.setFont('helvetica', 'bold');
        doc.text('ABD Compliance Officer', 20, 185);

        return Buffer.from(doc.output('arraybuffer'));
    }
}
