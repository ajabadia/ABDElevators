/**
 * ErrorMapperService: Converts technical exceptions into human-friendly,
 * actionable business messages. 
 * Part of FASE 216.5 UX Surgical Polish.
 */
export class ErrorMapperService {
    private static ERROR_MAP: Record<string, { title: string; message: string; action?: string }> = {
        'DatabaseError': {
            title: 'Error de Conexión',
            message: 'Estamos teniendo dificultades temporales para conectar con la base de datos.',
            action: 'Estamos reintentando automáticamente. Por favor, espera unos segundos.'
        },
        'ExternalServiceError': {
            title: 'Servicio Externo no Disponible',
            message: 'Uno de nuestros proveedores de IA está tardando más de lo habitual.',
            action: 'Prueba a simplificar tu consulta o inténtalo en un momento.'
        },
        'ValidationError': {
            title: 'Datos no Válidos',
            message: 'La información proporcionada no cumple con los requisitos técnicos.',
            action: 'Revisa que el archivo sea un PDF válido y no esté protegido por contraseña.'
        },
        'NotFoundError': {
            title: 'No Encontrado',
            message: 'El activo que intentas consultar ya no existe o ha sido movido.',
            action: 'Regresa al panel principal para refrescar la lista de documentos.'
        },
        'INTERNAL_ERROR': {
            title: 'Algo salió mal',
            message: 'Ha ocurrido un error inesperado en nuestro motor de procesamiento.',
            action: 'Nuestro equipo técnico ha sido notificado. Por favor, intenta refrescar la página.'
        }
    };

    /**
     * Maps a technical error code or name to a friendly message.
     */
    static map(errorCode: string): { title: string; message: string; action?: string } {
        return this.ERROR_MAP[errorCode] || this.ERROR_MAP['INTERNAL_ERROR'];
    }

    /**
     * Wraps a generic Error object and returns the best matching friendly message.
     */
    static fromError(error: any): { title: string; message: string; action?: string } {
        const code = error.code || error.name || 'INTERNAL_ERROR';
        return this.map(code);
    }
}
