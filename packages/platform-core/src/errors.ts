
export class AppError extends Error {
    constructor(
        public code: string,
        public status: number,
        public message: string,
        public details?: unknown
    ) {
        super(message);
        this.name = 'AppError';
    }

    toJSON() {
        const isInternalError = this.status >= 500;

        return {
            success: false,
            error: {
                code: this.code,
                message: isInternalError ? 'Error interno del servidor' : this.message,
                details: isInternalError
                    ? null
                    : (this.details instanceof Error
                        ? { message: this.details.message, name: this.details.name }
                        : (this.details || null)),
            },
        };
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: unknown) {
        super('VALIDATION_ERROR', 400, message, details);
    }
}

export class DatabaseError extends AppError {
    constructor(message: string, details?: unknown) {
        super('DATABASE_ERROR', 500, message, details);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string, details?: unknown) {
        super('NOT_FOUND', 404, message, details);
    }
}

export class ExternalServiceError extends AppError {
    constructor(message: string, details?: unknown) {
        super('EXTERNAL_SERVICE_ERROR', 503, message, details);
    }
}
