const fs = require('fs');
const path = require('path');

const adminI18n = {
    es: {
        page: {
            title: "Gobernanza i18n",
            highlight: "Idiomas",
            subtitle: "Gestiona la voz de la plataforma en múltiples idiomas con asistencia de IA.",
            syncBtn: "Sincronizar L4 → DB",
            newKeyBtn: "Nueva Llave",
            searchPlaceholder: "Buscar por llave o contenido..."
        },
        languages: {
            es: "Español (ES)",
            en: "English (EN)"
        },
        table: {
            keyHeader: "Llave (i18n ID)",
            primaryLabel: "Primario",
            secondaryLabel: "Secundario",
            autoTranslateBtn: "AUTOTRADUCIR FALTANTES",
            save: "Guardar",
            cancel: "Cancelar",
            empty: "Vacío",
            missing: "Faltante",
            noResults: "No se encontraron llaves de traducción"
        },
        notifications: {
            aiSuccessTitle: "IA: Traducción completada",
            aiSuccessDesc: "Se han generado las traducciones faltantes.",
            upToDateTitle: "Todo al día",
            upToDateDesc: "No hay llaves faltantes en este idioma."
        }
    },
    en: {
        page: {
            title: "i18n Governance",
            highlight: "Languages",
            subtitle: "Manage the platform's voice across multiple languages with AI assistance.",
            syncBtn: "Sync L4 → DB",
            newKeyBtn: "New Key",
            searchPlaceholder: "Search by key or content..."
        },
        languages: {
            es: "Spanish (ES)",
            en: "English (EN)"
        },
        table: {
            keyHeader: "Key (i18n ID)",
            primaryLabel: "Primary",
            secondaryLabel: "Secondary",
            autoTranslateBtn: "AUTO-TRANSLATE MISSING",
            save: "Save",
            cancel: "Cancel",
            empty: "Empty",
            missing: "Missing",
            noResults: "No translation keys found"
        },
        notifications: {
            aiSuccessTitle: "AI: Translation completed",
            aiSuccessDesc: "Missing translations have been generated.",
            upToDateTitle: "Up to date",
            upToDateDesc: "No missing keys in this language."
        }
    }
};

['es', 'en'].forEach(lang => {
    const filePath = path.join(process.cwd(), 'messages', `${lang}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.admin) data.admin = {};
    if (!data.admin.i18n) data.admin.i18n = {};

    Object.assign(data.admin.i18n, adminI18n[lang]);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    console.log(`Updated ${filePath}`);
});
