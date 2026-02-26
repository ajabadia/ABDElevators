const fs = require('fs');
const content = fs.readFileSync('map.md', 'utf-8');

const lines = content.split('\n');
const updatedLines = lines.map(line => {
    if (line.startsWith('| Ruta | Funcionalidad | Estado |')) {
        return '| Ruta | Funcionalidad | API Contract | Estado | Líneas | Revisión |';
    }
    if (line.startsWith('|------|---------------|--------|')) {
        return '|------|---------------|--------------|--------|--------|----------|';
    }
    if (line.startsWith('| `/admin` | **Dashboard Unificado (Hub)**:')) {
        return line.replace('| ✅ |', '| `/api/admin/stats` | ✅ |');
    }
    if (line.startsWith('| `/admin/knowledge` | **Knowledge Hub**:')) {
        return line.replace('| ✅ |', '| `/api/knowledge/stats` | ✅ |');
    }
    if (line.startsWith('| `/admin/ai` | **AI Hub**:')) {
        return line.replace('| ✅ |', '| `/api/ai/stats` | ✅ |');
    }
    if (line.startsWith('| `/admin/security` | **Security Hub**:')) {
        return line.replace('| ✅ |', '| `/api/admin/security` | ✅ |');
    }
    if (line.startsWith('| `/admin/users` | **Users Hub**:')) {
        return line.replace('| ✅ |', '| `/api/admin/users/stats`| ✅ |');
    }
    if (line.startsWith('| `/admin/billing` | **Billing Hub**:')) {
        return line.replace('| ✅ |', '| `/api/admin/billing` | ✅ |');
    }
    if (line.startsWith('| `/admin/organizations` | **Organization Hub**:')) {
        return line.replace('| ✅ |', '| `/api/organizations` | ✅ |');
    }
    if (line.startsWith('| `/admin/operations` | **Operations Hub**:')) {
        return line.replace('| ✅ |', '| `/api/admin/operations` | ✅ |');
    }
    if (line.startsWith('| `/admin/notifications` | **Communication Hub**:')) {
        return line.replace('| ✅ |', '| `/api/admin/notifications` | ✅ |');
    }
    if (line.startsWith('| `/admin/settings` | **Settings Hub**:')) {
        return line.replace('| ✅ |', '| `/api/admin/settings` | ✅ |');
    }
    if (line.startsWith('| `/admin/reports` | **Report Hub**:')) {
        return line.replace('| ✅ |', '| `/api/admin/reports` | ✅ |');
    }

    // Catch-all for other table rows in those tables
    if (line.startsWith('| `/') && line.includes('| ✅ |') && !line.includes('API Contract') && !line.includes('API Reference') && line.split('|').length === 7) {
        return line.replace('| ✅ |', '| - | ✅ |');
    }
    if (line.startsWith('| `/') && line.includes('| 🆕 |') && line.split('|').length === 7) {
        return line.replace('| 🆕 |', '| - | 🆕 |');
    }
    if (line.startsWith('| `/') && line.includes('| 🏗️ |') && line.split('|').length === 7) {
        return line.replace('| 🏗️ |', '| - | 🏗️ |');
    }
    if (line.startsWith('| `/') && line.includes('| 🎭 |') && line.split('|').length === 7) {
        return line.replace('| 🎭 |', '| - | 🎭 |');
    }

    return line;
});

fs.writeFileSync('map.md', updatedLines.join('\n'), 'utf-8');
console.log('map.md updated globally with API Contract column');
