import { NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        if (secret !== 'elevator-nuke-seed') {
            return NextResponse.json({ error: 'Unauthorized seed access' }, { status: 403 });
        }

        const db = await connectAuthDB();
        const usersCollection = db.collection('users');

        // 1. Wipe Collection
        try {
            await usersCollection.drop();
        } catch (e) {
            // Ignore if collection doesn't exist
        }

        // 2. Prepare Hashes
        const adminHash = await bcrypt.hash('super123', 10); // Updated password per screenshot hint? No, user screenshot had 'super123'
        const technicalHash = await bcrypt.hash('tecnico123', 10);

        // 3. Seed Data (English Schema)
        const users = [
            {
                email: 'superadmin@abd.com', // Updated to match user screenshot
                password: adminHash,
                firstName: 'Super',
                lastName: 'Admin',
                position: 'System Administrator',
                role: 'SUPER_ADMIN', // Updated role? Or just ADMIN?
                tenantId: 'default_tenant',
                industry: 'ELEVATORS',
                activeModules: ['TECHNICAL', 'RAG', 'ADMIN'],
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                tenantAccess: []
            },
            {
                email: 'admin@abd.com',
                password: adminHash,
                firstName: 'Admin',
                lastName: 'System',
                position: 'Administrator',
                role: 'ADMIN',
                tenantId: 'default_tenant',
                industry: 'ELEVATORS',
                activeModules: ['TECHNICAL', 'RAG'],
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                tenantAccess: []
            },
            {
                email: 'tecnico@abd.com',
                password: technicalHash,
                firstName: 'Tech',
                lastName: 'Field',
                position: 'Field Technician',
                role: 'TECNICO',
                tenantId: 'default_tenant',
                industry: 'ELEVATORS',
                activeModules: ['TECHNICAL', 'RAG'],
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                tenantAccess: []
            }
        ];

        await usersCollection.insertMany(users);

        return NextResponse.json({
            status: 'ok',
            message: 'Database reduced to atoms and rebuilt.',
            usersCreated: users.length,
            sampleUser: users[0].email
        });

    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
