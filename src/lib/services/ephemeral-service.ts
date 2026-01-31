import { connectDB } from '@/lib/db';
import { TenantConfigSchema, UserSchema } from '@/lib/schemas';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

export class EphemeralTenantService {

    /**
     * Creates a temporary tenant for demo purposes.
     * Includes a default admin user and sets an expiration date (TTL).
     */
    static async createEphemeralTenant(email: string, daysToLive: number = 7) {
        const db = await connectDB();
        const tenantId = `demo-${crypto.randomBytes(4).toString('hex')}`;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + daysToLive);

        // 1. Create Tenant Config
        const tenantConfig = {
            tenantId,
            name: `Demo Tenant ${tenantId}`,
            industry: 'ELEVATORS',
            storage: {
                provider: 'cloudinary',
                quota_bytes: 1024 * 1024 * 100 // 100MB for demo
            },
            subscription: {
                tier: 'FREE',
                status: 'ACTIVE',
                current_period_end: expiresAt
            },
            active: true,
            isEphemeral: true, // Marker for cleanup
            expiresAt: expiresAt,
            createdAt: new Date()
        };

        // Validate loosely (schemas might be strict, so we adapt)
        // Note: We might need to extend TenantConfigSchema in schemas.ts to support 'isEphemeral' if strict
        // For now, we assume schema flexibility or we bypass strict checking for the extra field in DB
        // But let's stick to the schema defined in code if possible. 
        // Logic: We will store 'expiresAt' in the subscription or root if schema allows.
        // Checking schema: Subscription has period_end. We can use that.

        await db.collection('tenant_configs').insertOne(tenantConfig);

        // 2. Create Admin User
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const user = {
            email,
            password: tempPassword, // In prod, hash this!
            firstName: 'Demo',
            lastName: 'Admin',
            role: 'ADMIN',
            tenantId,
            industry: 'ELEVATORS',
            activeModules: ['TECHNICAL', 'RAG'],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await db.collection('users').insertOne(user);

        // 3. Seed Demo Data (Optional - simplified for V1)
        // await DataSeeder.seedBasicDocs(tenantId); 

        return {
            success: true,
            tenantId,
            email,
            tempPassword,
            expiresAt
        };
    }

    /**
     * Scans for expired tenants and purges ALL their data.
     * This ensures the "Right to be Forgotten" and resource optimization.
     */
    static async cleanupExpiredTenants() {
        const db = await connectDB();
        const now = new Date();

        // Find expired tenants
        const expiredTenants = await db.collection('tenant_configs').find({
            isEphemeral: true,
            expiresAt: { $lt: now }
        }).toArray();

        const results = [];

        for (const tenant of expiredTenants) {
            const tId = tenant.tenantId;
            console.log(`[Cleanup] Purging expired tenant: ${tId}`);

            // Parallel deletion of resources
            await Promise.all([
                db.collection('users').deleteMany({ tenantId: tId }),
                db.collection('documents').deleteMany({ tenantId: tId }),
                db.collection('knowledge_assets').deleteMany({ tenantId: tId }),
                db.collection('document_chunks').deleteMany({ tenantId: tId }),
                db.collection('audit_ingestion').deleteMany({ tenantId: tId }),
                db.collection('rag_audit').deleteMany({ tenantId: tId }),
                db.collection('tickets').deleteMany({ tenantId: tId }),
                db.collection('tenant_configs').deleteOne({ tenantId: tId })
            ]);

            results.push(tId);
        }

        return {
            purgedCount: results.length,
            purgedTenants: results
        };
    }
}
