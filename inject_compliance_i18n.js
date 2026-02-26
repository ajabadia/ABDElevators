const fs = require('fs');
const path = require('path');

const esPath = path.join(__dirname, 'messages/es/admin.json');
const enPath = path.join(__dirname, 'messages/en/admin.json');

const esData = JSON.parse(fs.readFileSync(esPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// ES
esData.compliance.aiGovernance.euRisk = "Riesgo EU";
esData.compliance.aiGovernance.governed = "Gobernado";
esData.compliance.aiGovernance.complianceNoteHtml = "<strong>Nota de Cumplimiento:</strong> Esta implementación RAG se clasifica como <strong>riesgo {risk}</strong> ya que proporciona asistencia técnica y recuperación de información sin toma de decisiones automatizada.";
esData.compliance.buttons.manualAdminRequest = "Petición manual de Administrador";

// EN
enData.compliance.aiGovernance.euRisk = "EU Risk";
enData.compliance.aiGovernance.governed = "Governed";
enData.compliance.aiGovernance.complianceNoteHtml = "<strong>Compliance Note:</strong> This RAG implementation is categorized as <strong>{risk} risk</strong> as it provides technical assistance and information retrieval without automated decision-making.";
enData.compliance.buttons.manualAdminRequest = "Manual Admin Request";

fs.writeFileSync(esPath, JSON.stringify(esData, null, 2) + '\n', 'utf8');
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2) + '\n', 'utf8');

console.log('Compliance i18n injected successfully!');
