import { connectDB } from '../src/lib/db';
import { logEvento } from '../src/lib/logger';

/**
 * Script de migración para renombrar campos de castellano a inglés (Ontology Agnostic).
 * Ejecutar con: npx ts-node scripts/migrate-to-ontology.ts
 */
async function migrate() {
    console.log('🚀 Iniciando migración a Ontología Agnóstica...');
    const db = await connectDB();
    const correlationId = 'migration-' + Date.now();

    try {
        // 1. Colección de Pedidos -> Entities
        console.log('📦 Migrando Pedidos a Entities...');
        await db.collection('pedidos').updateMany({}, {
            $rename: {
                "numero_pedido": "identifier",
                "nombre_archivo": "filename",
                "modelos_detectados": "detectedPatterns",
                "fecha_analisis": "analysisDate",
                "estado": "status",
                "error_mensaje": "errorMessage",
                "cliente": "client",
                "fecha_ingreso": "receivedAt",
                "validado": "isValidated",
                "creado": "createdAt",
                "actualizado": "updatedAt"
            }
        });
        // Renombrar la colección si existe
        const collections = await db.listCollections({ name: 'pedidos' }).toArray();
        if (collections.length > 0) {
            await db.collection('pedidos').rename('entities');
        }

        // 2. Documentos Técnicos -> KnowledgeAssets
        console.log('📄 Migrando Documentos Técnicos a KnowledgeAssets...');
        await db.collection('documentos_tecnicos').updateMany({}, {
            $rename: {
                "nombre_archivo": "filename",
                "tipo_componente": "componentType",
                "modelo": "model",
                "version": "version",
                "fecha_revision": "revisionDate",
                "language": "language",
                "estado": "status",
                "cloudinary_url": "cloudinaryUrl",
                "cloudinary_public_id": "cloudinaryPublicId",
                "archivo_md5": "fileMd5",
                "total_chunks": "totalChunks",
                "creado": "createdAt"
            }
        });
        const docCols = await db.listCollections({ name: 'documentos_tecnicos' }).toArray();
        if (docCols.length > 0) {
            await db.collection('documentos_tecnicos').rename('knowledge_assets');
        }

        // 3. Usuarios -> Users
        console.log('👥 Migrando campos de Usuarios...');
        await db.collection('usuarios').updateMany({}, {
            $rename: {
                "nombre": "firstName",
                "apellidos": "lastName",
                "puesto": "position",
                "foto_url": "photoUrl",
                "foto_cloudinary_id": "photoCloudinaryId",
                "rol": "role",
                "activo": "isActive",
                "creado": "createdAt",
                "modificado": "updatedAt"
            }
        });
        const userCols = await db.listCollections({ name: 'usuarios' }).toArray();
        if (userCols.length > 0) {
            await db.collection('usuarios').rename('users');
        }

        // 4. Logs de Aplicación -> ApplicationLogs
        console.log('📋 Migrando Logs de Aplicación...');
        await db.collection('logs_aplicacion').updateMany({}, {
            $rename: {
                "nivel": "level",
                "origen": "source",
                "accion": "action",
                "mensaje": "message",
                "correlacion_id": "correlationId",
                "detalles": "details",
                "stack": "stack",
                "timestamp": "timestamp"
            }
        });
        const logCols = await db.listCollections({ name: 'logs_aplicacion' }).toArray();
        if (logCols.length > 0) {
            await db.collection('logs_aplicacion').rename('application_logs');
        }

        // 5. Invitaciones -> UserInvites
        console.log('✉️ Migrando Invitaciones...');
        await db.collection('invitaciones').updateMany({}, {
            $rename: {
                "invitadoPor": "invitedBy",
                "estado": "status",
                "expira": "expiresAt",
                "creado": "createdAt"
            }
        });
        const inviteCols = await db.listCollections({ name: 'invitaciones' }).toArray();
        if (inviteCols.length > 0) {
            await db.collection('invitaciones').rename('user_invites');
        }

        // 6. Auditoria RAG -> RagAudit
        console.log('🔍 Migrando Auditoría RAG...');
        await db.collection('auditoria_rag').updateMany({}, {
            $rename: {
                "correlacion_id": "correlationId",
                "fase": "phase",
                "input": "input",
                "output": "output",
                "duracion_ms": "durationMs",
                "timestamp": "timestamp"
            }
        });
        const ragAuditCols = await db.listCollections({ name: 'auditoria_rag' }).toArray();
        if (ragAuditCols.length > 0) {
            await db.collection('auditoria_rag').rename('rag_audit');
        }

        // 7. Taxonomías -> Taxonomies
        console.log('🏷️ Migrando Taxonomías...');
        await db.collection('taxonomias').updateMany({}, {
            $rename: { "creado": "createdAt" }
        });
        const taxCols = await db.listCollections({ name: 'taxonomias' }).toArray();
        if (taxCols.length > 0) {
            await db.collection('taxonomias').rename('taxonomies');
        }

        // 8. Casos -> Cases
        console.log('💼 Migrando Casos...');
        await db.collection('casos').updateMany({}, {
            $rename: { "creado": "createdAt", "actualizado": "updatedAt" }
        });
        const caseCols = await db.listCollections({ name: 'casos' }).toArray();
        if (caseCols.length > 0) {
            await db.collection('casos').rename('cases');
        }

        // 9. Validaciones -> Validations
        console.log('✅ Migrando Validaciones...');
        await db.collection('validaciones').updateMany({}, {
            $rename: {
                "pedidoId": "entityId",
                "validadoPor": "validatedBy",
                "nombreTecnico": "technicianName",
                "estadoGeneral": "generalStatus"
            }
        });
        const valCols = await db.listCollections({ name: 'validaciones' }).toArray();
        if (valCols.length > 0) {
            await db.collection('validaciones').rename('validations');
        }

        // 10. Configuración Tenant -> TenantConfigs
        console.log('⚙️ Migrando Configuración Tenant...');
        await db.collection('configuraciones_tenant').updateMany({}, {
            $rename: { "creado": "createdAt" }
        });
        const tenantCols = await db.listCollections({ name: 'configuraciones_tenant' }).toArray();
        if (tenantCols.length > 0) {
            await db.collection('configuraciones_tenant').rename('tenant_configs');
        }

        // 11. Soporte Tickets -> Tickets
        console.log('🎫 Migrando Tickets...');
        const ticketCols = await db.listCollections({ name: 'soporte_tickets' }).toArray();
        if (ticketCols.length > 0) {
            await db.collection('soporte_tickets').rename('tickets');
        }

        // 12. Tipos de Documento -> DocumentTypes
        console.log('📑 Migrando Tipos de Documento...');
        await db.collection('tipos_documento').updateMany({}, {
            $rename: {
                "nombre": "name",
                "descripcion": "description",
                "activo": "isActive",
                "creado": "createdAt"
            }
        });
        const docTypeCols = await db.listCollections({ name: 'tipos_documento' }).toArray();
        if (docTypeCols.length > 0) {
            await db.collection('tipos_documento').rename('document_types');
        }

        // 13. Documentos de Usuario -> UserDocuments
        console.log('📂 Migrando Documentos de Usuario...');
        await db.collection('documentos_usuario').updateMany({}, {
            $rename: {
                "usuario_id": "userId",
                "nombre_original": "originalName",
                "nombre_guardado": "savedName",
                "tamanio_bytes": "sizeBytes",
                "creado": "createdAt"
            }
        });
        const userDocCols = await db.listCollections({ name: 'documentos_usuario' }).toArray();
        if (userDocCols.length > 0) {
            await db.collection('documentos_usuario').rename('user_documents');
        }

        // 14. Document Chunks -> KnowledgeChunks
        console.log('🧩 Migrando Document Chunks...');
        await db.collection('document_chunks').updateMany({}, {
            $rename: {
                "texto_chunk": "chunkText",
                "origen_doc": "sourceDoc",
                "tipo_componente": "componentType",
                "modelo": "model",
                "cloudinary_url": "cloudinaryUrl",
                "creado": "createdAt"
            }
        });
        const chunkCols = await db.listCollections({ name: 'document_chunks' }).toArray();
        if (chunkCols.length > 0) {
            await db.collection('document_chunks').rename('knowledge_chunks');
        }

        // 15. Human Validations
        console.log('🤝 Migrando Validaciones de Empleados...');
        await db.collection('validaciones_empleados').updateMany({}, {
            $rename: {
                "pedidoId": "entityId",
                "estadoGeneral": "generalStatus",
                "nombreTecnico": "technicianName"
            }
        });
        const humValCols = await db.listCollections({ name: 'validaciones_empleados' }).toArray();
        if (humValCols.length > 0) {
            await db.collection('validaciones_empleados').rename('human_validations');
        }

        // 16. LLM Reports
        console.log('📊 Migrando Informes LLM...');
        await db.collection('informes_llm').updateMany({}, {
            $rename: {
                "pedidoId": "entityId",
                "validacionId": "validationId",
                "generadoPor": "generatedBy",
                "nombreTecnico": "technicianName"
            }
        });
        const reportCols = await db.listCollections({ name: 'informes_llm' }).toArray();
        if (reportCols.length > 0) {
            await db.collection('informes_llm').rename('llm_reports');
        }

        // 17. Search Results
        console.log('🔍 Migrando Resultados de Búsqueda...');
        await db.collection('vector_search_results').updateMany({}, {
            $rename: {
                "pedidoId": "entityId"
            }
        });
        const searchCols = await db.listCollections({ name: 'vector_search_results' }).toArray();
        if (searchCols.length > 0) {
            await db.collection('vector_search_results').rename('search_results');
        }

        console.log('✅ Migración completada con éxito.');
        await logEvento({
            level: 'INFO',
            source: 'MIGRATION',
            action: 'ONTOLOGY_REFRESH',
            message: 'Migración a nombres ingleses y agnósticos completada.',
            correlationId: correlationId
        });

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

migrate();
