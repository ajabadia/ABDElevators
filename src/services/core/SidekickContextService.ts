/**
 * SidekickContextService
 * Central registry dictating what the LLM should know about every single page in the application.
 */

export interface ContextDefinition {
    pattern: RegExp;
    llmDescription: string;
}

/**
 * Route dictionary mapping URL patterns to their specific context explanations.
 * This array is evaluated top-to-bottom, so put more specific routes first.
 */
const ROUTE_CONTEXT_MAP: ContextDefinition[] = [
    // --- WORK CLUSTER ---
    {
        pattern: /^\/work\/orders\/[a-zA-Z0-9_-]+$/,
        llmDescription: "The user is viewing the SPECIFIC ORDER DETAILS in the industrial platform. Here they can see the detected components (motor, panel, etc.) and if they comply with regulations. Their questions will be about this specific order."
    },
    {
        pattern: /^\/work\/orders$/,
        llmDescription: "The user is in the ORDERS EXPLORER. It is a list where they monitor elevator orders, their RAG analysis status, and technical compliance."
    },
    {
        pattern: /^\/work\/checklists$/,
        llmDescription: "The user is in the TECHNICAL CHECKLISTS view. Here they audit step-by-step inspection procedures for elevators or maintenance."
    },
    {
        pattern: /^\/work\/cases$/,
        llmDescription: "The user is in the INDUSTRIAL CASES INBOX. These are technical support tickets or cases escalated by technicians from the field."
    },
    {
        pattern: /^\/work\/workshop$/,
        llmDescription: "The user is in the WORKSHOP MODULE. Here physical component repairs, parts breakdown, and technician assignment are managed."
    },
    {
        pattern: /^\/work$/,
        llmDescription: "The user is in the WORK HUB, the main business operations center. They see key metrics for orders, tasks, and backoffice team performance."
    },

    // --- INTELLIGENCE CLUSTER ---
    {
        pattern: /^\/intelligence\/explorer$/,
        llmDescription: "The user is in the NEURAL EXPLORER (RAG Search). It is the main conversational search engine where they explore elevator manuals and regulations. If they ask questions, help them refine their search terms."
    },
    {
        pattern: /^\/intelligence\/my-docs$/,
        llmDescription: "The user is in 'MY DOCUMENTS'. Here they manage their own technical manuals and regulations uploaded to the platform. They can see the vectorization status."
    },
    {
        pattern: /^\/intelligence\/document-types$/,
        llmDescription: "The user is configuring DOCUMENT TYPES (e.g., Manuals, Drawings, Certificates). This defines ontologies for the RAG engine."
    },
    {
        pattern: /^\/intelligence\/trends$/,
        llmDescription: "The user is viewing INTELLIGENCE TRENDS. Analytical metrics on what technicians are asking and which elevator models are causing the most problems."
    },
    {
        pattern: /^\/intelligence$/,
        llmDescription: "The user is in the INTELLIGENCE HUB. It is the main Artificial Intelligence panel showing the global status of manuals and RAG query usage."
    },

    // --- AGENTS CLUSTER ---
    {
        pattern: /^\/agents\/agents$/,
        llmDescription: "The user is in the AGENT BUILDER. Here they design custom AI agents, defining their prompts and specific knowledge bases."
    },
    {
        pattern: /^\/agents\/workflows$/,
        llmDescription: "The user is in the WORKFLOW STUDIO. Here they define state-to-state workflows (transitions, roles, validations) to automate company processes."
    },
    {
        pattern: /^\/agents\/rag-quality$/,
        llmDescription: "The user is in the RAG QUALITY PANEL. They review model hallucination incidents or poor manual retrieval (faithfulness/relevance)."
    },
    {
        pattern: /^\/agents\/golden-sets$/,
        llmDescription: "The user manages GOLDEN SETS. These are collections of 'Perfect Q&A' used to automatically evaluate RAG engine quality with each update."
    },
    {
        pattern: /^\/agents\/governance$/,
        llmDescription: "The user is in AI GOVERNANCE. Here they configure which LLM models (Gemini 1.5, 2.0) are used for which tasks, and manage budgets and quotas."
    },
    {
        pattern: /^\/agents\/prompts$/,
        llmDescription: "The user is in PROMPT STUDIO. Configuration of master fallbacks and refinement of the central AI system instructions."
    },
    {
        pattern: /^\/agents\/playground$/,
        llmDescription: "The user is in the AI PLAYGROUND. A safe environment (Sandbox) to test how the RAG system responds without affecting real data."
    },
    {
        pattern: /^\/agents$/,
        llmDescription: "The user is in the AGENTS HUB. Automation control center, workflows, and visual metrics for assistants."
    },

    // --- INSIGHTS CLUSTER ---
    {
        pattern: /^\/insights\/analytics$/,
        llmDescription: "The user is in the GLOBAL DASHBOARD (Analytics). They see company KPIs, metric violations, and system status. Explain metrics if requested."
    },
    {
        pattern: /^\/insights\/reports$/,
        llmDescription: "The user manages REPORTS. Configures periodic data extractions (Excel, PDF) regarding maintenance and inspections."
    },
    {
        pattern: /^\/insights\/audit$/,
        llmDescription: "The user is exploring AUDIT LOGS (SOC2). Maximum traceability of which user performed which technical action or system change."
    },
    {
        pattern: /^\/insights\/security$/,
        llmDescription: "The user is in the SECURITY HUB. Monitoring panel against attacks, failed login attempts, and exceeded rate limits."
    },
    {
        pattern: /^\/insights\/compliance$/,
        llmDescription: "The user reviews COMPLIANCE. Monitors GDPR, technical data retention, and client consents."
    },
    {
        pattern: /^\/insights\/notifications$/,
        llmDescription: "The user views the NOTIFICATION HISTORY sent by the platform to technicians or clients."
    },
    {
        pattern: /^\/insights$/,
        llmDescription: "The user is in the INSIGHTS HUB. General analytical summary of the operational platform."
    },

    // --- SETTINGS CLUSTER ---
    {
        pattern: /^\/settings\/users$/,
        llmDescription: "The user manages corporate USERS AND TECHNICIANS. They can invite, block, or audit access."
    },
    {
        pattern: /^\/settings\/permissions$/,
        llmDescription: "The user configures the PERMISSION MATRIX (Guardian V3). Assigning which roles can execute which technical actions or ABAC."
    },
    {
        pattern: /^\/settings\/billing$/,
        llmDescription: "The user reviews BILLING AND ROI. Plans, monthly AI token usage, and projected savings."
    },
    {
        pattern: /^\/settings\/organization$/,
        llmDescription: "The user configures the Tenant's visual identity (White Label, logos, colors) and corporate data."
    },
    {
        pattern: /^\/settings\/api-keys$/,
        llmDescription: "The user manages API KEYS to connect external systems (ERPs, CRMs) to the ABDElevators platform."
    },
    {
        pattern: /^\/settings$/,
        llmDescription: "The user is in the SETTINGS HUB. Central panel for organization configuration."
    },
    {
        pattern: /^\/settings\/system$/,
        llmDescription: "The user (likely SuperAdmin) reviews base SYSTEM PARAMETERS."
    },
    {
        pattern: /^\/settings\/profile$/,
        llmDescription: "The user is viewing THEIR OWN PROFILE. Language preferences, avatar, and password change."
    },

    // --- HELP CLUSTER ---
    {
        pattern: /^\/help\/support$/,
        llmDescription: "The user is in the SUPPORT PORTAL. Trying to find technical help or raising a support ticket for the ABDElevators development team."
    },
    {
        pattern: /^\/help\/api$/,
        llmDescription: "The user is consulting API DOCUMENTATION (Swagger). If they ask about integration, give technical advice on REST consumption."
    },

    // --- ADMIN / SUPERADMIN ---
    {
        pattern: /^\/admin-dashboard.*$/,
        llmDescription: "The user is in the SUPERADMIN ZONE. Monitoring all Tenants, Infrastructure, and global system logs. Danger of destructive actions."
    },

    // --- GENERIC FALLBACK ---
    {
        pattern: /^\/.*$/,
        llmDescription: "The user is navigating the ABD Elevators RAG Platform. Provide general help or ask them to specify what they are looking for."
    }
];

export class SidekickContextService {
    /**
     * Resolves the human/LLM-readable description of the current route.
     * @param pathname Current browser pathname
     * @returns The context description string and a boolean indicating if it's a specific match
     */
    static resolveContext(pathname: string): { description: string, isSpecific: boolean } {
        // Enforce fallback to the last generic pattern if nothing matches (which it always should)
        const matchIndex = ROUTE_CONTEXT_MAP.findIndex(route => route.pattern.test(pathname));

        if (matchIndex === -1 || matchIndex === ROUTE_CONTEXT_MAP.length - 1) {
            return {
                description: ROUTE_CONTEXT_MAP[ROUTE_CONTEXT_MAP.length - 1].llmDescription,
                isSpecific: false
            };
        }

        return {
            description: ROUTE_CONTEXT_MAP[matchIndex].llmDescription,
            isSpecific: true
        };
    }
}
