const fs = require('fs');
const path = require('path');

const adminDashboard = {
    es: {
        userDashboardTitle: "Dashboard",
        userDashboardSubtitle: "Métricas de rendimiento y consumo de tu organización.",
        warRoomToggle: "Toggle War Room Mode",
        liveFeed: "Live Feed",
        metrics: {
            tenants: "Total Tenants",
            activeUsers: "Usuarios Activos",
            documents: "Documentos",
            cases: "Pedidos / Casos",
            iaSearches: "IA Searches"
        },
        charts: {
            consumptionTitle: "Consumo de IA y Almacenamiento",
            labels: {
                tokens: "Tokens Gemini (Input/Output)",
                storage: "Espacio en Disco (Cloudinary/S3)",
                searches: "Búsquedas Vectoriales"
            }
        },
        distribution: {
            title: "Distribución por Sector"
        },
        plan: {
            title: "Estado del Plan",
            active: "ACTIVE",
            renewal: "Renovación automática",
            manageBtn: "Gestionar Suscripción"
        },
        activity: {
            title: "Actividad Reciente del Sistema",
            empty: "No hay actividad reciente registrada."
        }
    },
    en: {
        userDashboardTitle: "Dashboard",
        userDashboardSubtitle: "Performance and consumption metrics of your organization.",
        warRoomToggle: "Toggle War Room Mode",
        liveFeed: "Live Feed",
        metrics: {
            tenants: "Total Tenants",
            activeUsers: "Active Users",
            documents: "Documents",
            cases: "Orders / Cases",
            iaSearches: "AI Searches"
        },
        charts: {
            consumptionTitle: "AI Consumption & Storage",
            labels: {
                tokens: "Gemini Tokens (Input/Output)",
                storage: "Disk Space (Cloudinary/S3)",
                searches: "Vector Searches"
            }
        },
        distribution: {
            title: "Industry Distribution"
        },
        plan: {
            title: "Plan Status",
            active: "ACTIVE",
            renewal: "Automatic renewal",
            manageBtn: "Manage Subscription"
        },
        activity: {
            title: "Recent System Activity",
            empty: "No recent activity recorded."
        }
    }
};

['es', 'en'].forEach(lang => {
    const filePath = path.join(process.cwd(), 'messages', `${lang}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.admin) data.admin = {};
    if (!data.admin.dashboard) data.admin.dashboard = {};

    Object.assign(data.admin.dashboard, adminDashboard[lang]);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    console.log(`Updated ${filePath}`);
});
