import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { uploadUserDocument } from '@/lib/cloudinary';
import { DocumentoUsuarioSchema } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';
import { ObjectId } from 'mongodb';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const db = await connectDB();
        const user = await db.collection('usuarios').findOne({ email: session.user.email });
        if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

        const documentos = await db.collection('documentos_usuarios')
            .find({ usuario_id: user._id.toString() })
            .sort({ creado: -1 })
            .toArray();

        return NextResponse.json(documentos);
    } catch (error) {
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const descripcion = formData.get('descripcion') as string;

        if (!file) {
            return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
        }

        const db = await connectDB();
        const user = await db.collection('usuarios').findOne({ email: session.user.email });
        if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadResult = await uploadUserDocument(buffer, file.name, user._id.toString());

        const docData = {
            usuario_id: user._id.toString(),
            nombre_original: file.name,
            nombre_guardado: uploadResult.publicId, // Cloudinary publicId
            cloudinary_url: uploadResult.secureUrl,
            cloudinary_public_id: uploadResult.publicId,
            tipo_mime: file.type,
            tamanio_bytes: file.size,
            descripcion: descripcion || '',
            creado: new Date(),
        };

        const validated = DocumentoUsuarioSchema.parse(docData);
        await db.collection('documentos_usuarios').insertOne(validated);

        await logEvento({
            nivel: 'INFO',
            origen: 'API_DOCS_USUARIO',
            accion: 'UPLOAD_DOC',
            mensaje: `Documento subido por ${user.email}: ${file.name}`,
            correlacion_id: `user-upload-${Date.now()}`
        });

        return NextResponse.json({ success: true, url: uploadResult.secureUrl });
    } catch (error: any) {
        console.error('Error uploading user document:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
