/**
 * Shared types for the RAG and Checklist modules.
 * This file re-exports types from schemas.ts to ensure consistency.
 */

import {
    IndustryType as SchemaIndustryType,
    GenericCase as SchemaGenericCase,
    ChecklistItem as SchemaChecklistItem,
    ChecklistCategory as SchemaChecklistCategory,
    ChecklistConfig as SchemaChecklistConfig
} from './schemas';

export type IndustryType = SchemaIndustryType;
export type GenericCase = SchemaGenericCase;
export type ChecklistItem = SchemaChecklistItem;
export type ChecklistCategory = SchemaChecklistCategory;
export type ChecklistConfig = SchemaChecklistConfig;
