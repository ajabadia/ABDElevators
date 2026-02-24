/**
 * 🏢 Real Estate Demo Data (ERA 8)
 * Isolation of hardcoded findings and assets for the vertical demo.
 */

export const MOCK_REAL_ESTATE_FINDINGS = [
    {
        id: 'f1',
        label: 'Fisura detectada en muro de carga (Sector C)',
        type: 'STRUCTURAL_HEALTH',
        page: 2,
        coordinates: { x: 450, y: 320 }
    },
    {
        id: 'f2',
        label: 'Punto de inspección eléctrica: Cuadro E-02',
        type: 'MAINTENANCE',
        page: 2,
        coordinates: { x: 120, y: 550 }
    }
];

export const MOCK_REAL_ESTATE_ASSET = {
    id: "698b48e7907e95bcba694d1a",
    name: "Edificio ABD-IV",
    location: "Madrid, ES - Distrito Tecnológico",
    health: "88%",
    lastAudit: "12 Feb 2026",
    filename: "Planos_Tecnicos_ABD_IV_Planta_2.pdf",
    initialPage: 2
};
