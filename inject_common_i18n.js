const fs = require('fs');
const path = require('path');

const esPath = path.join(__dirname, 'messages/es/common.json');
const enPath = path.join(__dirname, 'messages/en/common.json');

const esData = JSON.parse(fs.readFileSync(esPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// ES
esData.navigation.actions = {
    selectApp: "Seleccionar App",
    switchApp: "Cambiar Aplicación",
    loading: "Cargando...",
    signOut: "Cerrar Sesión"
};

// EN
enData.navigation.actions = {
    selectApp: "Select App",
    switchApp: "Switch Application",
    loading: "Loading...",
    signOut: "Sign Out"
};

fs.writeFileSync(esPath, JSON.stringify(esData, null, 2) + '\n', 'utf8');
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2) + '\n', 'utf8');

console.log('common.json i18n injected successfully!');
