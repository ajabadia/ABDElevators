import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { TipoDocumentoSchema } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';

export async function GET() {
    try {
        const db = await connectDB();
        const tipos = await db.collection('tipos_documento').find({}).toArray();
        return NextResponse.json(tipos);
    } catch (error) {
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validated = TipoDocumentoSchema.parse(body);

        const db = await connectDB();
        const result = await db.collection('tipos_documento').insertOne({
            ...validated,
            creado: new Date()
        });

        await logEvento({
            nivel: 'INFO',
            origen: 'API_TIPOS_DOC',
            accion: 'CREATE_TYPE',
            mensaje: `Tipo de documento creado: ${validated.nombre}`,
            correlacion_id: `type-create-${Date.now()}`
        });

        return NextResponse.json({ success: true, id: result.insertedId });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
