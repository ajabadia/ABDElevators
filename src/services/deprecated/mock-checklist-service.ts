
import { LLMCaller } from "@/services/ingest/ChecklistExtractor";
import { ChecklistItem } from "@/lib/types";

// deterministic UUIDs for consistent testing
const MOCK_UUID_1 = "00000000-0000-0000-0000-000000000001";
const MOCK_UUID_2 = "00000000-0000-0000-0000-000000000002";

/**
 * A mock implementation of the LLMCaller interface for testing purposes.
 * It returns a deterministic JSON string based on keywords found in the prompt.
 */
export const mockLLMCaller: LLMCaller = async (prompt: string, tenantId: string) => {
    // Simulate network latency typical of LLM calls
    await new Promise(resolve => setTimeout(resolve, 500));

    // Basic keyword detection to vary the response
    const isMaintenance = prompt.toLowerCase().includes("mantenimiento") || prompt.toLowerCase().includes("preventive");
    const isModernization = prompt.toLowerCase().includes("modernizacion") || prompt.toLowerCase().includes("modernization");

    let items: ChecklistItem[] = [];

    if (isMaintenance) {
        items = [
            { id: MOCK_UUID_1, category: "Mantenimiento", label: "Nivel Aceite", description: "Verificar nivel de aceite en la central hidráulica.", required: true, type: 'BOOLEAN' },
            { id: MOCK_UUID_2, category: "Mantenimiento", label: "Frenos", description: "Comprobar estado de las zapatas de freno.", required: true, type: 'BOOLEAN' }
        ];
    } else if (isModernization) {
        items = [
            { id: MOCK_UUID_1, category: "Modernizacion", label: "Cuadro", description: "Sustituir cuadro de maniobra por modelo compatible EN-81-20.", required: true, type: 'BOOLEAN' },
            { id: MOCK_UUID_2, category: "Modernizacion", label: "Barrera", description: "Instalar barrera fotoeléctrica en puertas de cabina.", required: true, type: 'BOOLEAN' },
            { id: "00000000-0000-0000-0000-000000000003", category: "Modernizacion", label: "Paracaidas", description: "Verificar paracaídas progresivo.", required: true, type: 'BOOLEAN' }
        ];
    } else {
        // Default generic checklist
        items = [
            { id: MOCK_UUID_1, category: "Generic", label: "Documentacion", description: "Revisar documentación técnica del expediente.", required: true, type: 'BOOLEAN' },
            { id: MOCK_UUID_2, category: "Generic", label: "Marcado CE", description: "Confirmar marcado CE de los componentes de seguridad.", required: true, type: 'BOOLEAN' }
        ];
    }

    // Return as a JSON string wrapped in markdown block to simulate real LLM behavior
    return "```json\n" + JSON.stringify(items, null, 2) + "\n```";
};

/**
 * Service to execute extraction using the mock caller, useful for integration tests.
 */
export class MockChecklistService {
    static async getMockResponse(scenario: 'maintenance' | 'modernization' | 'generic'): Promise<string> {
        // Construct a dummy prompt that triggers the desired logic in mockLLMCaller
        const dummyPrompt = `Scenario: ${scenario}. Extract items.`;
        return mockLLMCaller(dummyPrompt, "test-tenant");
    }
}
