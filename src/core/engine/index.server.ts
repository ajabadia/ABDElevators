import { createSingleton } from '@/lib/singleton';
import { AgentEngine } from './AgentEngine';
import { GovernanceEngine } from './GovernanceEngine';
import { GraphEngine } from './GraphEngine';
import { InsightEngine, Insight } from './InsightEngine';
import { CrossVerticalEngine } from './CrossVerticalEngine';
import { IntelligenceDashboard } from './IntelligenceDashboard';
import { PredictiveEngine } from './PredictiveEngine';
import { ReliabilityEngine } from './ReliabilityEngine';
import { AIWorkflowEngine } from './AIWorkflowEngine';
import { CaseWorkflowEngine } from './CaseWorkflowEngine';
import { GuardianEngine } from '../guardian/GuardianEngine';

// Server-only singletons (these pull in DB, LLM, or server-side packages)
export const getAgentEngine = createSingleton(() => new AgentEngine());
export const getGuardianEngine = createSingleton(() => GuardianEngine.getInstance());
export const getGovernanceEngine = createSingleton(() => new GovernanceEngine());
export const getGraphEngine = createSingleton(() => new GraphEngine());
export const getInsightEngine = createSingleton(() => new InsightEngine());
export const getCrossVerticalEngine = createSingleton(() => new CrossVerticalEngine());
export const getIntelligenceDashboard = createSingleton(() => new IntelligenceDashboard());
export const getPredictiveEngine = createSingleton(() => new PredictiveEngine());
export const getReliabilityEngine = createSingleton(() => new ReliabilityEngine());
export const getAIWorkflowEngine = createSingleton(() => (AIWorkflowEngine as any).getInstance());
export const getCaseWorkflowEngine = createSingleton(() => (CaseWorkflowEngine as any).getInstance());

// Re-export types for convenience
export type { 
    AgentEngine, 
    GovernanceEngine, 
    GraphEngine, 
    InsightEngine, 
    Insight,
    CrossVerticalEngine,
    PredictiveEngine,
    ReliabilityEngine
};
