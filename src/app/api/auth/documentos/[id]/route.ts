import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary para borrado
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.email) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const db = await connectDB();
        const user = await db.collection('usuarios').findOne({ email: session.user.email });
        if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

        const doc = await db.collection('documentos_usuarios').findOne({
            _id: new ObjectId(id),
            usuario_id: user._id.toString() // Seguridad: solo el dueño puede borrar
        });

        if (!doc) {
            return NextResponse.json({ error: 'Documento no encontrado o no autorizado' }, { status: 404 });
        }

        // Borrar de Cloudinary
        await cloudinary.uploader.destroy(doc.cloudinary_public_id);

        // Borrar de BD
        await db.collection('documentos_usuarios').deleteOne({ _id: new ObjectId(id) });

        await logEvento({
            nivel: 'INFO',
            origen: 'API_DOCS_USUARIO',
            accion: 'DELETE_DOC',
            mensaje: `Documento borrado por ${user.email}: ${doc.nombre_original}`,
            correlacion_id: `user-delete-${Date.now()}`
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting user document:', error);
        return NextResponse.json({ error: 'Error al borrar documento' }, { status: 500 });
    }
}
