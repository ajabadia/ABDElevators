const fs = require('fs');

const esAudit = {
    title: "Registro de Auditoría",
    highlight: "Auditoría",
    subtitle: "Monitoreo de actividad, seguridad y validación de reglas de negocio en tiempo real.",
    config_button: "Auditoría Config",
    export_button: "Exportar Logs",
    table: {
        title: "Eventos de Auditoría",
        subtitle: "Feed industrial de operaciones y seguridad",
        timestamp: "Timestamp",
        source: "Origen",
        action: "Acción",
        level: "Nivel",
        duration: "Duración",
        correlation: "Correlación ID",
        empty: "No se han registrado eventos que coincidan con los filtros."
    },
    metrics: {
        total_cases: "Pedidos (Total)",
        accumulated: "Acumulados en plataforma",
        sla_violations: "Incidencias SLA",
        last_30d: "Últimos 30 días",
        tokens_consumed: "Tokens Consumidos",
        llm_inference: "Inferencia LLM Activa",
        rag_faithfulness: "Inteligencia Técnica Fiabilidad",
        hallucination_score: "Score de Alucinaciones"
    },
    filters: {
        search_placeholder: "Busca por mensaje, acción, correlationId o email de usuario...",
        all: "TODOS",
        errors_only: "Solo Errores"
    },
    empty_state: {
        title: "Activa el monitor de auditoría",
        description: "Usa los filtros de nivel, origen o la barra de búsqueda para cargar los registros. Elige \"TODOS\" para ver la actividad general reciente.",
        load_all: "Cargar Todos"
    }
};

const enAudit = {
    title: "Audit Log",
    highlight: "Audit",
    subtitle: "Real-time activity monitoring, security, and business rule validation.",
    config_button: "Config Audit",
    export_button: "Export Logs",
    table: {
        title: "Audit Events",
        subtitle: "Industrial feed of operations and security",
        timestamp: "Timestamp",
        source: "Source",
        action: "Action",
        level: "Level",
        duration: "Duration",
        correlation: "Correlation ID",
        empty: "No events recorded matching the filters."
    },
    metrics: {
        total_cases: "Requests (Total)",
        accumulated: "Accumulated on platform",
        sla_violations: "SLA Incidents",
        last_30d: "Last 30 days",
        tokens_consumed: "Tokens Consumed",
        llm_inference: "Active LLM Inference",
        rag_faithfulness: "Technical Intelligence Reliability",
        hallucination_score: "Hallucination Score"
    },
    filters: {
        search_placeholder: "Search by message, action, correlationId or user email...",
        all: "ALL",
        errors_only: "Errors Only"
    },
    empty_state: {
        title: "Activate the audit monitor",
        description: "Use the level or source filters or the search bar to load the logs. Choose \"ALL\" to see recent general activity.",
        load_all: "Load All"
    }
};

const esPath = 'messages/es/admin.json';
const esData = JSON.parse(fs.readFileSync(esPath, 'utf8'));
esData.audit = esAudit;
fs.writeFileSync(esPath, JSON.stringify(esData, null, 2));

const enPath = 'messages/en/admin.json';
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
enData.audit = enAudit;
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));

console.log("Translations added to admin.json for audit");
