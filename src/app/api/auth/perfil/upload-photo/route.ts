import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadProfilePhoto } from '@/lib/cloudinary';
import { connectDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
        }

        const db = await connectDB();
        const user = await db.collection('usuarios').findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadProfilePhoto(buffer, file.name, user._id.toString());

        return NextResponse.json({
            url: result.url,
            public_id: result.publicId
        });
    } catch (error) {
        console.error('Error uploading profile photo:', error);
        return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 });
    }
}
