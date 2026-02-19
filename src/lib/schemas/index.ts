/**
 * 🧩 Modular Schema Orchestrator (Orquestador de Esquemas)
 * 
 * Este archivo centraliza y re-exporta todos los esquemas modulares.
 * Se ubica en 'index.ts' para asegurar una resolución limpia por parte de Turbopack.
 */

export * from './core';
export * from './auth';
export * from './knowledge';
export * from './workflow';
export * from './business';
export * from './billing';
export * from './ticketing';
export * from './system';
export * from './api-keys';
export * from './federated';
export * from './access';
export * from './notifications';
export * from './prompts';
export * from './spaces';
export * from './collaboration';
export * from './checklist';
export * from './workshop';
export * from './intelligence';
// The instruction to add 'spaceId' to 'KnowledgeAssetSchema' cannot be applied directly here
// as 'KnowledgeAssetSchema' is defined within the './knowledge' module, not in this 'index.ts' file.
// This file only re-exports modules.
// The provided snippet for 'KnowledgeAssetSchema' definition is syntactically incorrect for this file.
export * from './pagination';
export * from './feedback';

// Explicit re-exports for problematic symbols to help Turbopack indexing
export { DocumentTypeSchema } from './knowledge';
export type { DocumentType } from './knowledge';
