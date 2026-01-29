export interface AuditReport {
    timestamp: Date;
    totalEntitiesChecked: number;
    encryptedFieldsFound: number;
    governancePoliciesActive: number;
    securityScore: number;
    findings: string[];
}
