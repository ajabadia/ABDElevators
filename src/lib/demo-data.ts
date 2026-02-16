export interface DemoDocument {
    id: string;
    title: string;
    type: 'MANUAL' | 'CONTRACT' | 'REPORT';
    content: string;
    summary: string;
}

export const DEMO_DOCUMENTS: DemoDocument[] = [
    {
        id: 'demo-doc-1',
        title: 'Manual de Mantenimiento - Otis Gen2 (Demo)',
        type: 'MANUAL',
        summary: 'Extracto del manual de mantenimiento para ascensores Otis Gen2, cubriendo códigos de error y procedimientos de seguridad.',
        content: `
manual_id: OTIS-GEN2-MAINT-2024
revision: 4.2
date: 2024-01-15

SECTION 1: SAFETY PROCEDURES
1.1 Lockout/Tagout (LOTO)
Before performing any maintenance, the main power disconnect must be locked out and tagged.
Ensure the car is secured against uncontrolled movement using rail blocks.

SECTION 2: ERROR CODES
Error 100: Drive Fault. Check VFD cooling fan and input voltage (380V-415V).
Error 205: Door Lock Failure. Inspect interlock contacts on floor 5.
Error 302: Safety Chain Open. Check pit switch and governor overspeed switch.

SECTION 3: LUBRICATION
Rails should be lubricated with ISO-32 guide rail oil.
Do NOT lubricate the governor rope.

SECTION 4: EMERGENCY RESCUE
In case of power failure, use the Manual Rescue Device (MRD) located in the machine room.
Release the brake slowly to drift the car to the nearest floor.
`
    },
    {
        id: 'demo-doc-2',
        title: 'Poliza de Mantenimiento - Edificio Torre Norte (Demo)',
        type: 'CONTRACT',
        summary: 'Contrato de mantenimiento preventivo y correctivo para la comunidad de propietarios.',
        content: `
contrato_n: CNT-2024-8892
cliente: Comunidad de Propietarios Torre Norte
fecha_inicio: 2024-01-01
duracion: 3 años

CLAUSULAS:
1. OBJETO
Mantenimiento integral de 4 ascensores Orona en C/ Principal 123.

2. COBERTURAS
- Mantenimiento preventivo mensual (según normativa EN 81-20).
- Asistencia de averías 24/7 (tiempo de respuesta < 2h).
- Piezas de repuesto incluidas hasta 500€ por reparación.

3. EXCLUSIONES
- Vandalismo y mal uso.
- Decoración de cabina.
- Modificaciones exigidas por cambios normativos futuros.

4. PRECIO
Cuota mensual: 450€ + IVA por ascensor.
Revisión anual según IPC.
`
    }
];

export const DEMO_CONTEXT_PROMPT = `
You are an AI assistant in a DEMO Sandbox environment for ABDElevators.
You have access to a LIMITED set of documents provided in the context below.
User is anonymous.

RULES:
1. ONLY answer based on the provided context.
2. If the user asks about something not in the context, say: "In this demo, I only have access to the provided sample documents (Otis Gen2 Manual and Torre Norte Contract)."
3. Be professional and concise.
`;
