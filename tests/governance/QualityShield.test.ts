import { PromptRunner } from '@/lib/llm-core/PromptRunner';
import { AIModelFindingSchema, AIRiskFindingSchema } from '@/types/ai';
import { MaintenancePredictionSchema } from '@/core/engine/PredictiveEngine';

/**
 * Quality Shield: Regression Tests for Era 16 Governance
 * Verifies that standard prompts produce valid structural outputs.
 */
describe('Quality Shield - Governance Regression', () => {
  const tenantId = 'abd_global';

  it('should extract models with strict JSON schema', async () => {
    const text = 'Pedido de compra para instalar cuadro de maniobra ARCA II con motor VVVF Siemens y operador de puertas Fermator de 900mm.';
    const result = await PromptRunner.runJson({
      key: 'EXTRACT_MODELS',
      variables: { text },
      schema: AIModelFindingSchema.array(),
      tenantId,
      correlationId: 'test-extract-models',
      task: 'AGENT_EXTRACTION'
    });

    console.log("[TEST_RESULT] EXTRACT_MODELS result:", JSON.stringify(result, null, 2));
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.find((r: any) => r.model.toUpperCase().includes('ARCA II'))).toBeDefined();
  });

  it('should analyze risks with steering by industry', async () => {
    const result = await PromptRunner.runJson({
      key: 'AGENT_RISK_ANALYSIS',
      variables: { findings: [{ model: 'ARCA II', type: 'panel' }], industry: 'ELEVATORS' },
      schema: AIRiskFindingSchema.array(),
      tenantId,
      correlationId: 'test-risk-analysis',
      industry: 'ELEVATORS',
      task: 'AGENT_RISK_ANALYSIS'
    });

    expect(Array.isArray(result)).toBe(true);
    // Verificar que el output tiene campos de riesgo válidos
    if (result.length > 0) {
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result[0].risk_level);
    }
  });

  it('should predict maintenance with correct task steering', async () => {
    const result = await PromptRunner.runJson({
      key: 'MAINTENANCE_PREDICTION',
      variables: { equipmentId: 'ELEV-001', history: 'Last oil change 6 months ago. Noise in pulley.' },
      schema: MaintenancePredictionSchema,
      tenantId,
      correlationId: 'test-maintenance-prediction',
      task: 'MAINTENANCE_PREDICTION'
    });

    expect(result.predictedDate).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });
});
