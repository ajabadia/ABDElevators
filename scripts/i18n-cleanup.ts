/**
 * i18n Cleanup Script
 * 
 * Phase 1: Removes 211 dead keys from es.json and en.json
 * Phase 2: Checks DB for 188 missing keys and adds found ones to JSONs
 * Phase 3: Marks dead keys as obsolete in DB
 * Phase 4: Adds remaining missing keys with placeholder values
 * 
 * Usage: npx tsx scripts/i18n-cleanup.ts
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ── Helpers ──────────────────────────────────────────

function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key in obj) {
        const val = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
            Object.assign(result, flattenObject(val, newKey));
        } else {
            result[newKey] = String(val);
        }
    }
    return result;
}

function setNestedKey(obj: Record<string, any>, flatKey: string, value: string): void {
    const parts = flatKey.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
            current[parts[i]] = {};
        }
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
}

function deleteNestedKey(obj: Record<string, any>, flatKey: string): boolean {
    const parts = flatKey.split('.');
    let current = obj;
    const parents: Array<{ obj: Record<string, any>; key: string }> = [];

    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
            return false;
        }
        parents.push({ obj: current, key: parts[i] });
        current = current[parts[i]];
    }

    const lastKey = parts[parts.length - 1];
    if (!(lastKey in current)) return false;

    delete current[lastKey];

    // Clean up empty parent objects
    for (let i = parents.length - 1; i >= 0; i--) {
        const parent = parents[i];
        if (Object.keys(parent.obj[parent.key]).length === 0) {
            delete parent.obj[parent.key];
        } else {
            break;
        }
    }

    return true;
}

// ── Key context inference ────────────────────────────

function inferTranslation(key: string, locale: string): { es: string; en: string } {
    // Try to infer from key name
    const lastPart = key.split('.').pop() || key;
    const parentPart = key.split('.').slice(-2, -1)[0] || '';

    const inferences: Record<string, { es: string; en: string }> = {
        // Common UI
        'title': { es: 'Título', en: 'Title' },
        'subtitle': { es: 'Subtítulo', en: 'Subtitle' },
        'desc': { es: 'Descripción', en: 'Description' },
        'description': { es: 'Descripción', en: 'Description' },
        'cancel': { es: 'Cancelar', en: 'Cancel' },
        'save': { es: 'Guardar', en: 'Save' },
        'error': { es: 'Error', en: 'Error' },
        'email': { es: 'Email', en: 'Email' },
        'password': { es: 'Contraseña', en: 'Password' },
        'role': { es: 'Rol', en: 'Role' },
        'user': { es: 'Usuario', en: 'User' },
        'format': { es: 'Formato', en: 'Format' },
        'note': { es: 'Nota', en: 'Note' },
        'sending': { es: 'Enviando...', en: 'Sending...' },
        'verifying': { es: 'Verificando...', en: 'Verifying...' },
        'parsing': { es: 'Procesando...', en: 'Processing...' },
        'analyzing': { es: 'Analizando...', en: 'Analyzing...' },
        'updating': { es: 'Actualizando...', en: 'Updating...' },
        'loading': { es: 'Cargando...', en: 'Loading...' },

        // Buttons
        'saveBtn': { es: 'Guardar', en: 'Save' },
        'submitBtn': { es: 'Enviar', en: 'Submit' },
        'doneBtn': { es: 'Hecho', en: 'Done' },
        'setupBtn': { es: 'Configurar', en: 'Set up' },
        'activateBtn': { es: 'Activar', en: 'Activate' },
        'disableBtn': { es: 'Desactivar', en: 'Disable' },
        'autoTranslateBtn': { es: 'Auto-traducir faltantes', en: 'Auto-translate missing' },
        'syncAllBtn': { es: 'Sincronizar todos los idiomas', en: 'Sync all languages' },

        // Labels
        'confirmLabel': { es: 'Confirmar', en: 'Confirm' },
        'currentLabel': { es: 'Actual', en: 'Current' },
        'newLabel': { es: 'Nuevo', en: 'New' },
        'primaryLabel': { es: 'Idioma primario', en: 'Primary language' },
        'secondaryLabel': { es: 'Idioma secundario', en: 'Secondary language' },
        'keyHeader': { es: 'Clave', en: 'Key' },
        'missing': { es: 'Faltante', en: 'Missing' },
        'empty': { es: 'Sin resultados', en: 'No results' },
        'noResults': { es: 'Sin resultados', en: 'No results' },

        // Status
        'statusEnabled': { es: 'Activado', en: 'Enabled' },
        'statusDisabled': { es: 'Desactivado', en: 'Disabled' },
        'infoEnabled': { es: 'MFA activado', en: 'MFA enabled' },
        'infoDisabled': { es: 'MFA desactivado', en: 'MFA disabled' },
        'currentBadge': { es: 'Actual', en: 'Current' },

        // MFA
        'mfa': { es: 'Autenticación de doble factor', en: 'Two-factor authentication' },
        'copyCodes': { es: 'Copiar códigos', en: 'Copy codes' },
        'invalidCode': { es: 'Código inválido', en: 'Invalid code' },
        'manualKey': { es: 'Clave manual', en: 'Manual key' },
        'recoveryCodesTitle': { es: 'Códigos de recuperación', en: 'Recovery codes' },
        'recoveryCodesWarning': { es: 'Guarda estos códigos de recuperación en un lugar seguro', en: 'Store these recovery codes in a safe place' },
        'recoveryDesc': { es: 'Puedes usar estos códigos para acceder si pierdes tu dispositivo', en: 'You can use these codes to access your account if you lose your device' },
        'recoveryTitle': { es: 'Recuperación', en: 'Recovery' },
        'setupStep1': { es: 'Escanea el código QR', en: 'Scan the QR code' },
        'setupStep1Desc': { es: 'Usa una app de autenticación para escanear', en: 'Use an authenticator app to scan' },
        'setupStep2': { es: 'Ingresa el código de verificación', en: 'Enter the verification code' },

        // Profile
        'memberSince': { es: 'Miembro desde', en: 'Member since' },
        'personalInfo': { es: 'Información personal', en: 'Personal information' },
        'personalInfoSubtitle': { es: 'Actualiza tu información de perfil', en: 'Update your profile information' },
        'notificationPrefs': { es: 'Preferencias de notificaciones', en: 'Notification preferences' },
        'notificationPrefsSubtitle': { es: 'Configura cómo quieres recibir notificaciones', en: 'Configure how you want to receive notifications' },
        'securityCenter': { es: 'Centro de seguridad', en: 'Security center' },
        'securityCenterSubtitle': { es: 'Gestiona tu contraseña y autenticación', en: 'Manage your password and authentication' },
        'firstName': { es: 'Nombre', en: 'First name' },
        'lastName': { es: 'Apellido', en: 'Last name' },
        'inApp': { es: 'En la app', en: 'In-app' },
        'readOnly': { es: 'Solo lectura', en: 'Read only' },
        'eventType': { es: 'Tipo de evento', en: 'Event type' },

        // Errors
        'errorConnection': { es: 'Error de conexión', en: 'Connection error' },
        'errorDescription': { es: 'Ha ocurrido un error', en: 'An error occurred' },
        'errorSave': { es: 'Error al guardar', en: 'Error saving' },
        'errorUpdate': { es: 'Error al actualizar', en: 'Error updating' },
        'updateError': { es: 'Error al actualizar', en: 'Update error' },
        'uploadError': { es: 'Error al subir archivo', en: 'Upload error' },
        'connectionError': { es: 'Error de conexión', en: 'Connection error' },
        'matchError': { es: 'Las contraseñas no coinciden', en: 'Passwords do not match' },
        'sizeError': { es: 'Archivo demasiado grande', en: 'File too large' },
        'typeError': { es: 'Tipo de archivo no permitido', en: 'File type not allowed' },
        'csv_read_error': { es: 'Error al leer CSV', en: 'Error reading CSV' },
        'excel_read_error': { es: 'Error al leer Excel', en: 'Error reading Excel' },
        'error_no_valid': { es: 'Datos no válidos', en: 'Invalid data' },

        // Success
        'successTitle': { es: 'Éxito', en: 'Success' },
        'successDesc': { es: 'Operación realizada con éxito', en: 'Operation completed successfully' },
        'successDescription': { es: 'Operación realizada con éxito', en: 'Operation completed successfully' },
        'success_title': { es: 'Éxito', en: 'Success' },
        'cleanupSuccess': { es: 'Limpieza completada', en: 'Cleanup completed' },
        'cleanupDesc': { es: 'Se han eliminado los datos seleccionados', en: 'Selected data has been removed' },

        // File upload
        'drop_active': { es: 'Suelta el archivo aquí', en: 'Drop file here' },
        'drop_idle': { es: 'Arrastra un archivo o haz clic para seleccionar', en: 'Drag a file or click to select' },
        'file_hint': { es: 'Formatos aceptados: PDF, DOCX, XLSX', en: 'Accepted formats: PDF, DOCX, XLSX' },
        'columns_help': { es: 'Columnas del archivo', en: 'File columns' },
        'encoding_help': { es: 'Codificación del archivo', en: 'File encoding' },
        'roles_help': { es: 'Asignar roles', en: 'Assign roles' },
        'default_help': { es: 'Valor por defecto', en: 'Default value' },
        'hide_help': { es: 'Ocultar ayuda', en: 'Hide help' },
        'valid_to_send': { es: 'Válido para enviar', en: 'Valid to send' },
        'with_errors': { es: 'Con errores', en: 'With errors' },
        'instructions': { es: 'Instrucciones', en: 'Instructions' },

        // Sessions
        'revokeConfirmOthers': { es: '¿Revocar todas las demás sesiones?', en: 'Revoke all other sessions?' },
        'revokeDesc': { es: 'Se cerrarán todas las sesiones excepto la actual', en: 'All sessions except the current one will be closed' },
        'revokeError': { es: 'Error al revocar sesiones', en: 'Error revoking sessions' },
        'revokeOthersBtn': { es: 'Revocar otras sesiones', en: 'Revoke other sessions' },
        'revokeSuccess': { es: 'Sesiones revocadas', en: 'Sessions revoked' },
        'unknownBrowser': { es: 'Navegador desconocido', en: 'Unknown browser' },
        'unknownOs': { es: 'SO desconocido', en: 'Unknown OS' },
        'unprivilegedNotice': { es: 'No tienes permisos para esta acción', en: 'You do not have permission for this action' },
        'disableConfirm': { es: '¿Desactivar MFA?', en: 'Disable MFA?' },

        // Table
        'invalid_email': { es: 'Email inválido', en: 'Invalid email' },
        'missing_email': { es: 'Email faltante', en: 'Missing email' },
        'no_email': { es: 'Sin email', en: 'No email' },
        'status': { es: 'Estado', en: 'Status' },

        // Onboarding
        'finish': { es: 'Finalizar', en: 'Finish' },
        'next': { es: 'Siguiente', en: 'Next' },
        'skip': { es: 'Omitir', en: 'Skip' },

        // Dashboard
        'system': { es: 'Sistema', en: 'System' },
    };

    // Check specific full key patterns for unique contexts
    const fullKeyInferences: Record<string, { es: string; en: string }> = {
        // Admin i18n
        'admin.i18n.table.aiSuccessDesc': { es: 'Todas las traducciones faltantes han sido generadas', en: 'All missing translations have been generated' },
        'admin.i18n.table.aiSuccessTitle': { es: 'Traducción automática completada', en: 'Auto-translation completed' },
        'admin.i18n.table.upToDateDesc': { es: 'No hay traducciones faltantes', en: 'No missing translations' },
        'admin.i18n.table.upToDateTitle': { es: 'Traducciones al día', en: 'Translations up to date' },

        // Admin guardian
        'admin.guardian.audit.table.last_24h': { es: 'Últimas 24 horas', en: 'Last 24 hours' },

        // Admin knowledge
        'admin.knowledge.federated.investigating': { es: 'Investigando...', en: 'Investigating...' },
        'admin.knowledge.federated.match': { es: 'Coincidencia', en: 'Match' },
        'admin.knowledge.federated.title': { es: 'Búsqueda Federada', en: 'Federated Search' },

        // Admin users bulk
        'admin.users.bulk.cancel': { es: 'Cancelar importación', en: 'Cancel import' },
        'admin.users.bulk.error': { es: 'Error en la importación masiva', en: 'Bulk import error' },

        // Admin workflows
        'admin.workflows.canvas.title': { es: 'Editor de Flujos', en: 'Workflow Editor' },
        'admin.workflows.logs.no_details': { es: 'Sin detalles disponibles', en: 'No details available' },
        'admin.workflows.logs.summary.quick_stats': { es: 'Estadísticas rápidas', en: 'Quick stats' },

        // Profile
        'profile.form.error': { es: 'Error al guardar perfil', en: 'Error saving profile' },
        'profile.form.save': { es: 'Guardar perfil', en: 'Save profile' },
        'profile.notifications.connectionError': { es: 'Error de conexión', en: 'Connection error' },
        'profile.notifications.error': { es: 'Error', en: 'Error' },
        'profile.notifications.saving': { es: 'Guardando...', en: 'Saving...' },
        'profile.page.user': { es: 'Usuario', en: 'User' },
        'profile.photo.error': { es: 'Error al subir foto', en: 'Error uploading photo' },
        'profile.security.mfa.cancel': { es: 'Cancelar configuración', en: 'Cancel setup' },
        'profile.security.mfa.error': { es: 'Error en configuración MFA', en: 'MFA setup error' },
        'profile.security.mfa.notifications.success.title': { es: 'MFA configurado correctamente', en: 'MFA configured successfully' },
        'profile.security.mfa.updateError': { es: 'Error al actualizar MFA', en: 'Error updating MFA' },
        'profile.security.password.error': { es: 'Error al cambiar contraseña', en: 'Error changing password' },
        'profile.security.sessions.error': { es: 'Error al cargar sesiones', en: 'Error loading sessions' },

        // Dashboard
        'dashboard.system': { es: 'Sistema', en: 'System' },

        // Common activities
        'common.activities.subtitle': { es: 'Panel de actividad reciente', en: 'Recent activity panel' },
        'common.activities.system': { es: 'Sistema', en: 'System' },
        'common.activities.sections.activity': { es: 'Actividad reciente', en: 'Recent activity' },
        'common.activities.sections.contact': { es: 'Contacto', en: 'Contact' },
        'common.activities.sections.help': { es: 'Ayuda', en: 'Help' },
        'common.activities.sections.view_all': { es: 'Ver todo', en: 'View all' },
        'common.activities.stats.accuracy': { es: 'Precisión', en: 'Accuracy' },
        'common.activities.stats.documents': { es: 'Documentos', en: 'Documents' },
        'common.activities.stats.queries': { es: 'Consultas', en: 'Queries' },
        'common.activities.stats.time': { es: 'Tiempo medio', en: 'Average time' },
        'common.activities.empty.title': { es: 'Sin actividad reciente', en: 'No recent activity' },
        'common.activities.empty.desc': { es: 'Aquí aparecerán tus acciones recientes', en: 'Your recent actions will appear here' },
        'common.activities.actions.history.title': { es: 'Historial', en: 'History' },
        'common.activities.actions.history.desc': { es: 'Ver historial de consultas', en: 'View query history' },
        'common.activities.actions.search.title': { es: 'Buscar', en: 'Search' },
        'common.activities.actions.search.desc': { es: 'Realizar nueva consulta', en: 'Make a new query' },
        'common.activities.actions.upload.title': { es: 'Subir', en: 'Upload' },
        'common.activities.actions.upload.desc': { es: 'Subir nuevo documento', en: 'Upload new document' },
        'common.activities.help.search.title': { es: 'Cómo buscar', en: 'How to search' },
        'common.activities.help.search.desc': { es: 'Usa lenguaje natural para encontrar información', en: 'Use natural language to find information' },
        'common.activities.help.upload.title': { es: 'Cómo subir', en: 'How to upload' },
        'common.activities.help.upload.desc': { es: 'Soportamos PDF, DOCX y otros formatos', en: 'We support PDF, DOCX and other formats' },

        // Common table
        'common.table.email': { es: 'Email', en: 'Email' },
        'common.table.role': { es: 'Rol', en: 'Role' },
        'common.table.status': { es: 'Estado', en: 'Status' },
        'common.table.invalid_email': { es: 'Email inválido', en: 'Invalid email' },
        'common.table.missing_email': { es: 'Email faltante', en: 'Missing email' },
        'common.table.no_email': { es: 'Sin email', en: 'No email' },

        // Common onboarding
        'common.onboarding.finish': { es: 'Finalizar', en: 'Finish' },
        'common.onboarding.next': { es: 'Siguiente', en: 'Next' },
        'common.onboarding.skip': { es: 'Omitir', en: 'Skip' },

        // Search namespace
        'search.analyzing': { es: 'Analizando...', en: 'Analyzing...' },
        'search.disclaimer': { es: 'Los resultados son generados por IA y pueden contener inexactitudes', en: 'Results are AI-generated and may contain inaccuracies' },
        'search.error_connection': { es: 'Error de conexión con el servicio de búsqueda', en: 'Connection error with search service' },
        'search.error_message': { es: 'Ha ocurrido un error durante la búsqueda', en: 'An error occurred during search' },
        'search.placeholder': { es: '¿Qué necesitas saber sobre mantenimiento de ascensores?', en: 'What do you need to know about elevator maintenance?' },
        'search.sources_label': { es: 'Fuentes consultadas', en: 'Sources consulted' },
        'search.subtitle': { es: 'Consulta inteligente sobre especificaciones técnicas', en: 'Intelligent query on technical specifications' },
        'search.title': { es: 'Búsqueda Inteligente', en: 'Intelligent Search' },
        'search.welcome_desc': { es: 'Escribe tu pregunta técnica y nuestro sistema encontrará la información relevante', en: 'Type your technical question and our system will find the relevant information' },
        'search.welcome_title': { es: 'Bienvenido al buscador inteligente', en: 'Welcome to the intelligent search' },

        // Upgrade namespace
        'upgrade.back_dashboard': { es: 'Volver al panel', en: 'Back to dashboard' },
        'upgrade.current_plan': { es: 'Plan actual', en: 'Current plan' },
        'upgrade.discount': { es: 'Ahorra', en: 'Save' },
        'upgrade.error_checkout': { es: 'Error al procesar el pago', en: 'Checkout error' },
        'upgrade.error_price_missing': { es: 'Precio no disponible', en: 'Price not available' },
        'upgrade.error_title': { es: 'Error', en: 'Error' },
        'upgrade.faq_desc': { es: 'Preguntas frecuentes sobre planes', en: 'Frequently asked questions about plans' },
        'upgrade.faq_title': { es: 'Preguntas Frecuentes', en: 'FAQ' },
        'upgrade.free_plan': { es: 'Plan Gratuito', en: 'Free Plan' },
        'upgrade.monthly': { es: 'Mensual', en: 'Monthly' },
        'upgrade.per_month': { es: '/mes', en: '/month' },
        'upgrade.popular': { es: 'Más popular', en: 'Most popular' },
        'upgrade.searches': { es: 'búsquedas', en: 'searches' },
        'upgrade.storage': { es: 'Almacenamiento', en: 'Storage' },
        'upgrade.subtitle': { es: 'Elige el plan que mejor se adapte a tus necesidades', en: 'Choose the plan that best fits your needs' },
        'upgrade.title': { es: 'Planes y Precios', en: 'Plans & Pricing' },
        'upgrade.title_accent': { es: 'Premium', en: 'Premium' },
        'upgrade.toast_current': { es: 'Ya estás en este plan', en: 'You are already on this plan' },
        'upgrade.toast_current_desc': { es: 'Ya tienes este plan activo', en: 'You already have this plan active' },
        'upgrade.tokens': { es: 'tokens', en: 'tokens' },
        'upgrade.updating': { es: 'Actualizando...', en: 'Updating...' },
        'upgrade.yearly': { es: 'Anual', en: 'Annual' },
    };

    // Priority: full key match > last part match
    if (fullKeyInferences[key]) {
        return fullKeyInferences[key];
    }

    if (inferences[lastPart]) {
        return inferences[lastPart];
    }

    // Can't infer — use placeholder
    return {
        es: `[TRADUCIR] ${key}`,
        en: `[TRANSLATE] ${key}`,
    };
}

// ── Main ─────────────────────────────────────────────

async function main(): Promise<void> {
    const correlationId = 'I18N_CLEANUP_' + Date.now();
    console.log(`🧹 i18n Cleanup Script (Correlation: ${correlationId})\n`);

    // Load dead and missing keys from audit report
    const reportPath = path.join(process.cwd(), 'scripts', 'i18n-audit-report.json');
    if (!fs.existsSync(reportPath)) {
        console.error('❌ Run i18n-audit.js first');
        process.exit(1);
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const deadKeys: string[] = report.deadKeys;
    const missingKeys: string[] = report.missingKeys;

    console.log(`📋 Dead keys to remove: ${deadKeys.length}`);
    console.log(`📋 Missing keys to add: ${missingKeys.length}\n`);

    // Load JSON files
    const esPath = path.join(process.cwd(), 'messages', 'es.json');
    const enPath = path.join(process.cwd(), 'messages', 'en.json');
    const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

    // ── PHASE 1: Remove dead keys from JSONs ──
    console.log('═══ PHASE 1: Removing dead keys from JSONs ═══');
    let removedEs = 0;
    let removedEn = 0;
    for (const key of deadKeys) {
        if (deleteNestedKey(es, key)) removedEs++;
        if (deleteNestedKey(en, key)) removedEn++;
    }
    console.log(`  ✅ Removed ${removedEs} keys from es.json`);
    console.log(`  ✅ Removed ${removedEn} keys from en.json\n`);

    // ── PHASE 2: Check DB for missing keys ──
    console.log('═══ PHASE 2: Checking DB for missing keys ═══');

    const uri = process.env.MONGODB_URI;
    let dbFoundEs = 0;
    let dbFoundEn = 0;
    let inferredCount = 0;

    if (uri) {
        const client = new MongoClient(uri);
        try {
            await client.connect();
            console.log('  ✅ Connected to MongoDB');

            const db = client.db('ABDElevators');
            const collection = db.collection('translations');

            for (const key of missingKeys) {
                // Check both locales in DB
                const dbEs = await collection.findOne({ key, locale: 'es', tenantId: 'platform_master' });
                const dbEn = await collection.findOne({ key, locale: 'en', tenantId: 'platform_master' });

                if (dbEs?.value && !dbEs.value.startsWith('[TRADUCIR]') && !dbEs.value.startsWith('[TRANSLATE]')) {
                    setNestedKey(es, key, dbEs.value);
                    dbFoundEs++;
                    // Also set EN if found
                    if (dbEn?.value && !dbEn.value.startsWith('[TRADUCIR]') && !dbEn.value.startsWith('[TRANSLATE]')) {
                        setNestedKey(en, key, dbEn.value);
                        dbFoundEn++;
                    } else {
                        const inferred = inferTranslation(key, 'en');
                        setNestedKey(en, key, inferred.en);
                        inferredCount++;
                    }
                } else if (dbEn?.value && !dbEn.value.startsWith('[TRADUCIR]') && !dbEn.value.startsWith('[TRANSLATE]')) {
                    setNestedKey(en, key, dbEn.value);
                    dbFoundEn++;
                    const inferred = inferTranslation(key, 'es');
                    setNestedKey(es, key, inferred.es);
                    inferredCount++;
                } else {
                    // Not in DB — use inference
                    const inferred = inferTranslation(key, 'both');
                    setNestedKey(es, key, inferred.es);
                    setNestedKey(en, key, inferred.en);
                    inferredCount++;
                }
            }

            console.log(`  📦 Found ${dbFoundEs} ES keys in DB`);
            console.log(`  📦 Found ${dbFoundEn} EN keys in DB`);
            console.log(`  🤖 Inferred ${inferredCount} translations\n`);

            // ── PHASE 3: Mark dead keys as obsolete in DB ──
            console.log('═══ PHASE 3: Marking dead keys as obsolete in DB ═══');

            const deadOps = deadKeys.flatMap(key => ['es', 'en'].map(locale => ({
                updateOne: {
                    filter: { key, locale, tenantId: 'platform_master' },
                    update: {
                        $set: {
                            isObsolete: true,
                            lastUpdated: new Date(),
                            obsoletedAt: new Date(),
                            obsoletedBy: correlationId,
                        }
                    }
                }
            })));

            let obsoleteCount = 0;
            for (let i = 0; i < deadOps.length; i += 500) {
                const batch = deadOps.slice(i, i + 500);
                const result = await collection.bulkWrite(batch, { ordered: false });
                obsoleteCount += result.modifiedCount;
            }
            console.log(`  ✅ Marked ${obsoleteCount} DB entries as obsolete\n`);

            await client.close();
        } catch (error) {
            console.error('  ⚠️ DB operations failed, continuing with inference only:', error);
            // If DB fails, still apply inferred values for all missing keys
            for (const key of missingKeys) {
                const inferred = inferTranslation(key, 'both');
                setNestedKey(es, key, inferred.es);
                setNestedKey(en, key, inferred.en);
                inferredCount++;
            }
        }
    } else {
        console.log('  ⚠️ MONGODB_URI not found, using inference only');
        for (const key of missingKeys) {
            const inferred = inferTranslation(key, 'both');
            setNestedKey(es, key, inferred.es);
            setNestedKey(en, key, inferred.en);
            inferredCount++;
        }
        console.log(`  🤖 Inferred ${inferredCount} translations\n`);
    }

    // ── PHASE 4: Write updated JSONs ──
    console.log('═══ PHASE 4: Writing updated JSONs ═══');
    fs.writeFileSync(esPath, JSON.stringify(es, null, 2) + '\n', 'utf8');
    fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');

    // Count final keys
    const finalFlatEs = flattenObject(es);
    const finalFlatEn = flattenObject(en);

    console.log(`  ✅ es.json: ${Object.keys(finalFlatEs).length} keys (was 1302)`);
    console.log(`  ✅ en.json: ${Object.keys(finalFlatEn).length} keys (was 1302)`);

    // Verify both files have same keys
    const esKeys = new Set(Object.keys(finalFlatEs));
    const enKeys = new Set(Object.keys(finalFlatEn));
    const onlyInEs = [...esKeys].filter(k => !enKeys.has(k));
    const onlyInEn = [...enKeys].filter(k => !esKeys.has(k));
    if (onlyInEs.length > 0 || onlyInEn.length > 0) {
        console.log(`  ⚠️ Key mismatch: ${onlyInEs.length} only in ES, ${onlyInEn.length} only in EN`);
    } else {
        console.log(`  ✅ Both files have identical key structure`);
    }

    // ── Summary ──
    const placeholders = Object.entries(finalFlatEs).filter(([, v]) => v.startsWith('[TRADUCIR]'));
    console.log(`\n═══ SUMMARY ═══`);
    console.log(`  Removed: ${removedEs} dead keys`);
    console.log(`  Added from DB: ${dbFoundEs} ES / ${dbFoundEn} EN`);
    console.log(`  Added via inference: ${inferredCount}`);
    console.log(`  Remaining placeholders: ${placeholders.length}`);
    if (placeholders.length > 0) {
        console.log(`  Placeholder keys:`);
        placeholders.forEach(([k]) => console.log(`    - ${k}`));
    }
    console.log(`\n🎉 Cleanup completed!`);

    // Write cleanup report
    const cleanupReport = {
        timestamp: new Date().toISOString(),
        correlationId,
        removedFromEs: removedEs,
        removedFromEn: removedEn,
        addedFromDb: { es: dbFoundEs, en: dbFoundEn },
        inferred: inferredCount,
        finalKeysEs: Object.keys(finalFlatEs).length,
        finalKeysEn: Object.keys(finalFlatEn).length,
        remainingPlaceholders: placeholders.map(([k]) => k),
        deadKeysRemoved: deadKeys,
    };
    fs.writeFileSync(
        path.join(process.cwd(), 'scripts', 'i18n-cleanup-report.json'),
        JSON.stringify(cleanupReport, null, 2),
        'utf8'
    );
    console.log('📊 Report saved to scripts/i18n-cleanup-report.json');
}

main();
