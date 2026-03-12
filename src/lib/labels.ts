import { IndustryType } from './types';

export interface IndustryLabels {
    singular: string;
    plural: string;
    action: string;
    description: string;
    placeholder: string;
    recent_title: string;
}

/**
 * Dictionary of terms per industry.
 * Allows the UI to adapt dynamically to the client's context.
 */
export const INDUSTRY_LABELS: Record<IndustryType, IndustryLabels> = {
    ELEVATORS: {
        singular: 'Entity',
        plural: 'Orders',
        action: 'Analyze Entity',
        description: 'Upload a PDF order to extract models and query the RAG knowledge base.',
        placeholder: 'Order number...',
        recent_title: 'Recent Analyses',
    },
    LEGAL: {
        singular: 'File',
        plural: 'Files',
        action: 'Analyze Contract',
        description: 'Upload a contract or legal document to verify clauses and precedents.',
        placeholder: 'File reference...',
        recent_title: 'Reviewed Files',
    },
    BANKING: {
        singular: 'Operation',
        plural: 'Operations',
        action: 'Analyze Risk',
        description: 'Upload a financial report or KYC for compliance and risk validation.',
        placeholder: 'Operation ID...',
        recent_title: 'Risk Analysis',
    },
    MEDICAL: {
        singular: 'Patient',
        plural: 'Patients',
        action: 'Analyze File',
        description: 'Management of medical records and legal compliance.',
        placeholder: 'e.g., EXP-2024-001',
        recent_title: 'Recent Files'
    },
    INSURANCE: {
        singular: 'Claim',
        plural: 'Claims',
        action: 'Analyze Coverage',
        description: 'Upload a policy or claim report to verify coverage and fraud.',
        placeholder: 'Claim number...',
        recent_title: 'Audited Claims',
    },
    REAL_ESTATE: {
        singular: 'Property',
        plural: 'Properties',
        action: 'Analyze Contract',
        description: 'Management of real estate assets and contracts.',
        placeholder: 'e.g., INV-MAD-001',
        recent_title: 'Recent Assets'
    },
    IT: {
        singular: 'Ticket',
        plural: 'Tickets',
        action: 'Analyze Incident',
        description: 'Upload a log or error description to locate the solution in runbooks.',
        placeholder: 'Ticket ID...',
        recent_title: 'Ticket History',
    },
    GENERIC: {
        singular: 'Case',
        plural: 'Cases',
        action: 'Analyze Document',
        description: 'Upload a document for semantic validation with RAG.',
        placeholder: 'Case identifier...',
        recent_title: 'Recent Activity',
    },
    FINANCE: {
        singular: 'Operation',
        plural: 'Operations',
        action: 'Analyze Risk',
        description: 'Upload a financial report for validation.',
        placeholder: 'Operation ID...',
        recent_title: 'Recent Analysis',
    },
    RETAIL: {
        singular: 'Order',
        plural: 'Orders',
        action: 'Analyze Ticket',
        description: 'Upload an order or ticket for analysis.',
        placeholder: 'Order ID...',
        recent_title: 'Recent Orders',
    },
    MANUFACTURING: {
        singular: 'Order',
        plural: 'Orders',
        action: 'Analyze Specification',
        description: 'Upload a technical specification for validation.',
        placeholder: 'Order number...',
        recent_title: 'Recent Orders',
    },
    ENERGY: {
        singular: 'Asset',
        plural: 'Assets',
        action: 'Analyze Maintenance',
        description: 'Upload an asset maintenance report.',
        placeholder: 'Asset ID...',
        recent_title: 'Recent Assets',
    },
    HEALTHCARE: {
        singular: 'Patient',
        plural: 'Patients',
        action: 'Analyze History',
        description: 'Upload a medical history for analysis.',
        placeholder: 'Patient ID...',
        recent_title: 'Recent Histories',
    },
    GOVERNMENT: {
        singular: 'Procedure',
        plural: 'Procedures',
        action: 'Analyze Request',
        description: 'Upload a legal request or procedure.',
        placeholder: 'Procedure number...',
        recent_title: 'Recent Procedures',
    },
    EDUCATION: {
        singular: 'Student',
        plural: 'Students',
        action: 'Analyze Record',
        description: 'Upload an academic record.',
        placeholder: 'Student ID...',
        recent_title: 'Recent Records',
    }
};

/**
 * Helper to retrieve labels based on the industry.
 */
export function getLabels(industry: IndustryType = 'ELEVATORS'): IndustryLabels {
    return INDUSTRY_LABELS[industry] || INDUSTRY_LABELS.GENERIC;
}
