# Roadmap Status: Architecture Pivot (Source: 09/01 vuelta de tuerca.txt)

This document tracks the migration from "Vertical Platform" to "Universal Meta-Model".

## 🚀 Quick Wins (Immediate Value)
| ID | Task | Status | Notes |
|----|------|--------|-------|
| QW.1 | **Rename/Abstract Concepts** | ⏳ PENDING | Alias internal types (`Pedido` -> `EntityInstance`) without breaking legacy code. |
| QW.2 | **Demo Mode (PLG)** | ⏳ PENDING | Add "Industry Switcher" in UI (Elevators/Legal/Medical) to demonstrate flexibility. |
| QW.3 | **Explainable AI UI** | ⏳ PENDING | Add "Why is this relevant?" reasoning field in RAG results. |

## 🏗️ Phase 0: Preparation (Structural Changes)
| ID | Task | Status | Notes |
|----|------|--------|-------|
| P0.1 | **Feature Flags** | ⏳ PENDING | Implement `DYNAMIC_ENTITIES_ENABLED`, `GRAPH_RELATIONS_ENABLED`. |
| P0.2 | **Folder Restructuring** | ⏳ PENDING | Create `src/core` (Universal) and `src/verticals` (Legacy/Specific). |
| P0.3 | **Dual Database Prep** | ⏳ PENDING | Define `unified_entities` schema (conceptually) or prepare Mongo migration scripts. |

## 🧩 Phase 1: Meta-Model (Future)
| ID | Task | Status | Notes |
|----|------|--------|-------|
| P1.1 | **Ontology Registry** | 🏖️ FUTURE | JSON Config for entities (`entity-engine`). |
| P1.2 | **Dynamic API Routes** | 🏖️ FUTURE | `/api/core/entities/[type]`. |
| P1.3 | **Zod Generator** | 🏖️ FUTURE | `buildZodSchema(config)`. |

## 🔄 Phase 2: Dynamic UI (Future)
| ID | Task | Status | Notes |
|----|------|--------|-------|
| P2.1 | **Dynamic Form** | 🏖️ FUTURE | JSON Schema Forms + Shadcn. |
| P2.2 | **Dynamic Table** | 🏖️ FUTURE | Configurable Columns. |
