
import { LLMCaller } from "@/lib/checklist-extractor";
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
            { id: MOCK_UUID_1, description: "Verificar nivel de aceite en la central hidráulica." },
            { id: MOCK_UUID_2, description: "Comprobar estado de las zapatas de freno." }
        ];
    } else if (isModernization) {
        items = [
            { id: MOCK_UUID_1, description: "Sustituir cuadro de maniobra por modelo compatible EN-81-20." },
            { id: MOCK_UUID_2, description: "Instalar barrera fotoeléctrica en puertas de cabina." },
            { id: "00000000-0000-0000-0000-000000000003", description: "Verificar paracaídas progresivo." }
        ];
    } else {
        // Default generic checklist
        items = [
            { id: MOCK_UUID_1, description: "Revisar documentación técnica del expediente." },
            { id: MOCK_UUID_2, description: "Confirmar marcado CE de los componentes de seguridad." }
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
