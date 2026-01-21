import { z } from 'zod';

/**
 * Esquema para fragmentos de documentos (RAG Corpus)
 * Regla de Oro #2: Validación Zod ANTES del procesamiento.
 */
export const DocumentChunkSchema = z.object({
    _id: z.any().optional(),
    tipo_componente: z.string(),
    modelo: z.string(),
    origen_doc: z.string(),
    version_doc: z.string(),
    fecha_revision: z.date(),
    pagina_aproximada: z.number().optional(),
    texto_chunk: z.string(),
    texto_antes: z.string().optional(),
    texto_despues: z.string().optional(),
    embedding: z.array(z.number()),
    creado: z.date().default(() => new Date()),
});

/**
 * Esquema para Pedidos de Ascensores
 */
export const PedidoSchema = z.object({
    _id: z.any().optional(),
    numero_pedido: z.string(),
    nombre_archivo: z.string().optional(),
    texto_original: z.string(),
    modelos_detectados: z.array(z.object({
        tipo: z.string(),
        modelo: z.string(),
    })),
    fecha_analisis: z.date().default(() => new Date()),
    estado: z.enum(['procesando', 'analizado', 'error']).default('procesando'),
    error_mensaje: z.string().nullable().optional(),
    creado: z.date().default(() => new Date()),
});

/**
 * Esquema para Auditoría RAG (Trazabilidad)
 * Regla de Oro #4
 */
export const AuditoriaRagSchema = z.object({
    _id: z.any().optional(),
    correlacion_id: z.string().uuid(),
    fase: z.string(),                    // 'EXTRACCION_MODELOS', 'VECTOR_SEARCH', 'REPORTE'
    input: z.any(),                      // prompt o query
    output: z.any(),                     // respuesta Gemini o resultados search
    duracion_ms: z.number(),
    token_usage: z.object({
        prompt: z.number(),
        completion: z.number(),
    }).optional(),
    timestamp: z.date().default(() => new Date()),
});

/**
 * Esquema para Logs de Aplicación
 */
export const LogAplicacionSchema = z.object({
    _id: z.any().optional(),
    nivel: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']),
    origen: z.string(),
    accion: z.string(),
    mensaje: z.string(),
    correlacion_id: z.string(),
    detalles: z.any().optional(),
    stack: z.string().optional(),
    timestamp: z.date(),
});

/**
 * Esquema para Documentos Técnicos (metadatos)
 */
export const DocumentoTecnicoSchema = z.object({
    _id: z.any().optional(),
    nombre_archivo: z.string(),
    tipo_componente: z.string(),
    modelo: z.string(),
    version: z.string(),
    fecha_revision: z.date(),
    estado: z.enum(['vigente', 'obsoleto', 'borrador']),
    cloudinary_url: z.string().optional(),
    cloudinary_public_id: z.string().optional(),
    total_chunks: z.number(),
    creado: z.date(),
});

/**
 * Esquema para Tipos de Documento (configurables por admin)
 */
export const TipoDocumentoSchema = z.object({
    _id: z.any().optional(),
    nombre: z.string(),
    descripcion: z.string().optional(),
    activo: z.boolean().default(true),
    creado: z.date(),
});

/**
 * Esquema para Usuarios (extendido con perfil completo)
 */
export const UsuarioSchema = z.object({
    _id: z.any().optional(),
    email: z.string().email(),
    password: z.string(),
    nombre: z.string(),
    apellidos: z.string(),
    puesto: z.string().optional(),
    foto_url: z.string().url().optional(),
    foto_cloudinary_id: z.string().optional(),
    rol: z.enum(['ADMIN', 'TECNICO', 'INGENIERIA']),
    activo: z.boolean().default(true),
    ultimo_acceso: z.date().optional(),
    creado: z.date(),
    modificado: z.date(),
});

/**
 * Esquema para Documentos de Usuario
 */
export const DocumentoUsuarioSchema = z.object({
    _id: z.any().optional(),
    usuario_id: z.string(),
    nombre_original: z.string(),
    nombre_guardado: z.string(),
    cloudinary_url: z.string(),
    cloudinary_public_id: z.string(),
    tipo_mime: z.string(),
    tamanio_bytes: z.number(),
    descripcion: z.string().optional(),
    creado: z.date(),
});

export type DocumentChunk = z.infer<typeof DocumentChunkSchema>;
export type Pedido = z.infer<typeof PedidoSchema>;
export type AuditoriaRag = z.infer<typeof AuditoriaRagSchema>;
export type LogAplicacion = z.infer<typeof LogAplicacionSchema>;
export type DocumentoTecnico = z.infer<typeof DocumentoTecnicoSchema>;
export type TipoDocumento = z.infer<typeof TipoDocumentoSchema>;
export type Usuario = z.infer<typeof UsuarioSchema>;
export type DocumentoUsuario = z.infer<typeof DocumentoUsuarioSchema>;
