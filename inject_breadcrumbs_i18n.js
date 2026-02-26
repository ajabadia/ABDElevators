const fs = require('fs');
const path = require('path');

const esPath = path.join(__dirname, 'messages/es/common.json');
const enPath = path.join(__dirname, 'messages/en/common.json');

const esData = JSON.parse(fs.readFileSync(esPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// ES
esData.breadcrumbs = {
    admin: "Administración",
    users: "Usuarios",
    prompts: "Prompts",
    dashboard: "Dashboard",
    inventory: "Inventario",
    studio: "Automation Studio",
    knowledge: "Conocimiento",
    logs: "Logs",
    intelligence: "Inteligencia",
    trends: "Tendencias",
    configurator: "Configurador",
    detail: "Detalle"
};

// EN
enData.breadcrumbs = {
    admin: "Administration",
    users: "Users",
    prompts: "Prompts",
    dashboard: "Dashboard",
    inventory: "Inventory",
    studio: "Automation Studio",
    knowledge: "Knowledge",
    logs: "Logs",
    intelligence: "Intelligence",
    trends: "Trends",
    configurator: "Configurator",
    detail: "Detail"
};

fs.writeFileSync(esPath, JSON.stringify(esData, null, 2) + '\n', 'utf8');
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2) + '\n', 'utf8');

console.log('common.json breadcrumbs injected successfully!');
