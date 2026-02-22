import { z } from 'zod';
import { UserRole } from '../../types/roles';

/**
 * ⚡ FASE 200: Workflow Schema Orchestrator
 * This file avoids direct definitions that caused circular ReferenceErrors.
 */

export * from './workflow-base';
export * from './workflow-types';

/**
 * ⚠️ Compatibility Bridge: This triggers @abd/workflow-engine
 * Use with caution in other schemas to avoid cycle triggers during initialization.
 */
export { WorkflowTaskSchema } from './workflow-task';
export type { WorkflowTask } from './workflow-task';

