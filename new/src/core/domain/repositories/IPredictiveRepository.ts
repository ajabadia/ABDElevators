export interface IPredictiveRepository {
    extractFailureSignals(tenantId: string): Promise<any[]>;
}
