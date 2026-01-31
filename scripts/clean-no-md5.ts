import { MongoClient } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function cleanLegacyData() {
    const client = new MongoClient(process.env.MONGODB_URI!);

    try {
        await client.connect();
        const db = client.db('ABDElevators');

        console.log('🧹 Iniciando limpieza de registros legacy (sin MD5)...');

        // 1. Limpiar Documentos Técnicos
        const docsCollection = db.collection('documentos_tecnicos');
        const chunksCollection = db.collection('document_chunks');

        const docsToDelete = await docsCollection.find({ archivo_md5: { $exists: false } }).toArray();
        console.log(`\n📄 Documentos Técnicos a eliminar: ${docsToDelete.length}`);

        for (const doc of docsToDelete) {
            console.log(`   - Procesando: ${doc.nombre_archivo} (${doc._id})`);

            // Borrar de Cloudinary
            if (doc.cloudinary_public_id) {
                try {
                    await cloudinary.uploader.destroy(doc.cloudinary_public_id, { resource_type: 'raw' }); // PDFs suelen ser raw
                    // Intento backup como image por si acaso
                    await cloudinary.uploader.destroy(doc.cloudinary_public_id, { resource_type: 'image' });
                    console.log(`     ☁️  Eliminado de Cloudinary`);
                } catch (e: any) {
                    console.error(`     ❌ Error Cloudinary: ${e.message}`);
                }
            }

            // Borrar Chunks asociados
            if (doc.cloudinary_public_id) {
                const deleteChunks = await chunksCollection.deleteMany({ cloudinary_public_id: doc.cloudinary_public_id });
                console.log(`     🧩 Chunks eliminados: ${deleteChunks.deletedCount}`);
            }

            // Borrar de DB
            await docsCollection.deleteOne({ _id: doc._id });
            console.log(`     🗑️  Eliminado de DB`);
        }

        // 2. Limpiar Pedidos (si aplica)
        const pedidosCollection = db.collection('pedidos');
        const pedidosToDelete = await pedidosCollection.find({ archivo_md5: { $exists: false } }).toArray();
        console.log(`\n📦 Pedidos a eliminar (sin MD5): ${pedidosToDelete.length}`);

        for (const pedido of pedidosToDelete) {
            console.log(`   - Procesando Entity: ${pedido.numero_pedido || pedido.nombre_archivo}`);
            // Los pedidos viejos a veces no tienen cloudinary_public_id guardado igual que los docs, 
            // pero si lo tuvieran en metadatos, habría que borrarlo.
            // Asumimos limpiar solo el registro DB si no hay referencia clara a Cloudinary estructurada
            // Ojo: Pedidos en este sistema no siempre subían a Cloudinary 'estructurado' en versiones previas

            // Si tiene pdf_texto, es un registro ligero, borramos db
            await pedidosCollection.deleteOne({ _id: pedido._id });
            console.log(`     🗑️  Entity eliminado de DB`);
        }

        // 3. Documentos de Usuario
        const userDocsCollection = db.collection('documentos_usuarios');
        const userDocsToDelete = await userDocsCollection.find({ archivo_md5: { $exists: false } }).toArray();
        console.log(`\n👤 Documentos de Usuario a eliminar: ${userDocsToDelete.length}`);

        for (const doc of userDocsToDelete) {
            console.log(`   - Procesando: ${doc.nombre_original}`);
            if (doc.cloudinary_public_id) {
                try {
                    await cloudinary.uploader.destroy(doc.cloudinary_public_id, { resource_type: 'raw' });
                    console.log(`     ☁️  Eliminado de Cloudinary`);
                } catch (e) {
                    // ignore
                }
            }
            await userDocsCollection.deleteOne({ _id: doc._id });
            console.log(`     🗑️  Eliminado de DB`);
        }

        console.log('\n✅ Limpieza completada.');

    } catch (error) {
        console.error('Error fatal:', error);
    } finally {
        await client.close();
    }
}

cleanLegacyData();
