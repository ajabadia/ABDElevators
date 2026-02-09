
import { NextRequest, NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get('tenantId') || 'elevadores_mx';
        const newVal = searchParams.get('val') || 'DEBUG_WRITE_' + Date.now();

        const db = await connectAuthDB();
        const result = await db.collection('tenants').updateOne(
            { tenantId },
            { $set: { "billing.fiscalName": newVal } }
        );

        return NextResponse.json({
            success: true,
            msg: "Write attempted via GET",
            tenantId,
            newVal,
            modified: result.modifiedCount
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
