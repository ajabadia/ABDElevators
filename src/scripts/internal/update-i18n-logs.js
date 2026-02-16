const fs = require('fs');
const path = require('path');

// --- SAFETY ENFORCEMENT ---
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_PROD_SCRIPTS) {
    console.error('❌ CRITICAL: This script and its metadata updates are strictly for DEVELOPMENT/STAGING.');
    console.error('If you must run this in production, set ALLOW_PROD_SCRIPTS=true');
    process.exit(1);
}
// ---------------------------

const adminLogs = {
    es: {
        page: {
            title: "Registros del Sistema",
            subtitle: "Supervisa la salud del sistema y auditoría de cumplimiento."
        },
        levels: {
            all: "TODOS",
            error: "ERROR",
            warn: "WARN",
            info: "INFO",
            debug: "DEBUG"
        },
        badges: {
            unknown: "Desconocido",
            prompt: "Prompt AI",
            billing: "Facturación",
            storage: "Almacenamiento",
            ingest: "Ingesta",
            config: "Configuración",
            audit_log: "LOG DE AUDITORÍA",
            modified: "MODIFICADO"
        },
        stats: {
            total: "Total Registros",
            recent: "últimos 100",
            errors: "Errores Críticos"
        },
        tabs: {
            system: "Logs de Sistema",
            audit: "Pista de Auditoría"
        },
        actions: {
            export: "Exportar",
            live: "En Vivo",
            refresh: "Refrescar"
        },
        filters: {
            search_logs: "Buscar en logs (mensaje, origen...)",
            search_audit: "Buscar en auditoría (usuario, acción...)",
            all_users: "Todos los Usuarios",
            all_tenants: "Todas las Organizaciones"
        },
        table: {
            timestamp: "Fecha/Hora",
            level: "Nivel",
            source: "Origen",
            message: "Mensaje",
            entity: "Entidad/Usuario",
            trace: "Traza de Correlación",
            context: "Contexto",
            system: "SISTEMA"
        },
        status: {
            loading: "Cargando registros...",
            no_results: "No se encontraron registros con los filtros actuales."
        },
        detail: {
            analyze_diff: "Analizar Diff",
            close: "Cerrar",
            message: "Mensaje Detallado",
            stack: "Stack Trace (Error)",
            json: "Detalles Técnicos (JSON)",
            integrity: "Verificación de Integridad",
            diff_title: "Cambios en la Entidad",
            property: "Propiedad",
            previous: "Estado Anterior",
            next: "Estado Nuevo",
            initial_creation: "Creación Inicial",
            initial_desc: "Esta entrada representa la creación del objeto. No hay estado previo.",
            snapshot: "Snapshot Completo del Objeto",
            responsable: "Responsable",
            ip_origin: "IP Origen",
            correlation: "Correlación",
            view_trace: "Ver Trace",
            user_agent: "Contexto User Agent",
            admin_auth: "Autoridad Admin",
            secure_agent: "AGENTE SEGURO"
        }
    },
    en: {
        page: {
            title: "System Logs",
            subtitle: "Monitor system health and compliance audit trail."
        },
        levels: {
            all: "ALL",
            error: "ERROR",
            warn: "WARN",
            info: "INFO",
            debug: "DEBUG"
        },
        badges: {
            unknown: "Unknown",
            prompt: "AI Prompt",
            billing: "Billing",
            storage: "Storage",
            ingest: "Ingestion",
            config: "Configuration",
            audit_log: "AUDIT LOG",
            modified: "MODIFIED"
        },
        stats: {
            total: "Total Logs",
            recent: "last 100",
            errors: "Critical Errors"
        },
        tabs: {
            system: "System Logs",
            audit: "Audit Trail"
        },
        actions: {
            export: "Export",
            live: "Live",
            refresh: "Refresh"
        },
        filters: {
            search_logs: "Search logs (message, source...)",
            search_audit: "Search audit (user, action...)",
            all_users: "All Users",
            all_tenants: "All Organizations"
        },
        table: {
            timestamp: "Timestamp",
            level: "Level",
            source: "Source",
            message: "Message",
            entity: "Entity/User",
            trace: "Correlation Trace",
            context: "Context",
            system: "SYSTEM"
        },
        status: {
            loading: "Loading logs...",
            no_results: "No logs found with current filters."
        },
        detail: {
            analyze_diff: "Analyze Diff",
            close: "Close",
            message: "Detailed Message",
            stack: "Stack Trace (Error)",
            json: "Technical Details (JSON)",
            integrity: "Integrity Verification",
            diff_title: "Entity Changes",
            property: "Property",
            previous: "Previous State",
            next: "New State",
            initial_creation: "Initial Creation",
            initial_desc: "This entry represents the creation of the object. No previous state.",
            snapshot: "Full Object Snapshot",
            responsable: "Responsible",
            ip_origin: "Origin IP",
            correlation: "Correlation",
            view_trace: "View Trace",
            user_agent: "User Agent Context",
            admin_auth: "Admin Authority",
            secure_agent: "SECURE AGENT"
        }
    }
};

['es', 'en'].forEach(lang => {
    const filePath = path.join(process.cwd(), 'messages', `${lang}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.admin) data.admin = {};
    if (!data.admin.logs) data.admin.logs = {};

    Object.assign(data.admin.logs, adminLogs[lang]);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    console.log(`Updated ${filePath}`);
});
