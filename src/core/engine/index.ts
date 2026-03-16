import { createSingleton } from '@/lib/singleton';
import { EntityEngine } from './EntityEngine';

// Shared / Client-safe singletons
export const getEntityEngine = createSingleton(() => new EntityEngine());

// Export types
export type { EntityEngine };
export * from './EntityEngine';
