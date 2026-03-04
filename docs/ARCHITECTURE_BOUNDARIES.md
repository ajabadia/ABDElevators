# Architectural Boundaries & Bounded Contexts

This document defines the formal frontiers between the different modules of the ABD RAG Platform to ensure scalability, maintainability, and security.

## 核心 (Core) - Platform Foundations
The "Platform Core" provides the essential infrastructure used by all other modules.

- **Responsibility**: Database connectivity, multi-tenant isolation (`getTenantCollection`), unified logging (`logEvento`), and basic error handling (`AppError`).
- **Invariants**: Must not depend on any vertical or specific feature module.

## 身份与安全 (Auth & Security)
The gateway for users and machines.

- **Responsibility**: User authentication (NextAuth), MFA management (`MfaService`), and Authorization (`GuardianV3`).
- **Boundaries**: Communicates with the `users` and `mfa_configs` collections. Must provide the `correlationId` for every request.

## 知识中心 (Knowledge Hub / RAG)
The engine for document processing and retrieval.

- **Responsibility**: PDF ingestion, text extraction, chunking, embedding generation, and vector search.
- **Boundaries**: Uses the `knowledge_assets` and `knowledge_graph` collections. Depends on LLM providers (Gemini).

## 计费与订阅 (Billing & Subscription)
Financial health and quota management.

- **Responsibility**: Pricing plans, Stripe integration, quota enforcement, and `BillingCircuitBreaker`.
- **Boundaries**: Interacts with the `organizations` and `billing_history` collections.

## 治理与探查 (Governance & Observability)
Transparency and system health.

- **Responsibility**: System logs, audit trails, and configuration changes (prompts, feature flags).
- **Boundaries**: Inmutable record of every "Sensitive Area" change.

## 🌉 Legacy Bridges & Compatibility
For details on legacy components and architectural transitions, see the [Bridge & Stub Audit](file:///d:/desarrollos/ABDElevators/docs/bridge-audit.md).

---

> [!NOTE]
> All inter-module communication should ideally happen via Services or well-defined internal APIs, avoiding direct database access to another module's primary collections where possible.
