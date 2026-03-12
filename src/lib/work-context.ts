export type WorkContext = 'inspection' | 'maintenance' | 'engineering' | 'admin';

export interface ContextConfig {
    promptKey: string;
    defaultQuestions: string[];
    relevantNorms: string[];
    suggestedChecklists: string[];
}

export const CONTEXT_DEFAULTS: Record<WorkContext, ContextConfig> = {
    inspection: {
        promptKey: 'WORK_CONTEXT_INSPECTION',
        defaultQuestions: [
            "What are the main safety requirements?",
            "What points should an annual inspection verify?",
            "What does the EN 81-20 standard say about the pit?"
        ],
        relevantNorms: ['EN 81-20', 'EN 81-50'],
        suggestedChecklists: ['annual_inspection', 'periodic_inspection']
    },
    maintenance: {
        promptKey: 'WORK_CONTEXT_MAINTENANCE',
        defaultQuestions: [
            "What is the recommended lubrication schedule?",
            "How to adjust guide rail clearance?",
            "Meaning of error E04 in the drive"
        ],
        relevantNorms: ['EN 81-28', 'Preventive Maintenance'],
        suggestedChecklists: ['monthly_maintenance', 'door_adjustment']
    },
    engineering: {
        promptKey: 'WORK_CONTEXT_ENGINEERING',
        defaultQuestions: [
            "Load specifications for the car frame",
            "Traffic calculation for office buildings",
            "Installation drawings for the traction machine"
        ],
        relevantNorms: ['Structural Calculations', 'Traffic Simulation'],
        suggestedChecklists: ['design_review', 'drawing_approval']
    },
    admin: {
        promptKey: 'WORK_CONTEXT_ADMIN',
        defaultQuestions: [
            "Status of document ingestion",
            "Users with most search activity",
            "RAG quality metrics"
        ],
        relevantNorms: ['Platform Configuration', 'Security'],
        suggestedChecklists: ['security_audit', 'user_management']
    }
};
