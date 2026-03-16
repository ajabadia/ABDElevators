/**
 * Stub Services - Segunda parte
 * Servicios no implementados aún
 */

export class TechnicalEntityRepository {
    static async find() { throw new Error('Not implemented'); }
    static async findOne() { throw new Error('Not implemented'); }
    static async create() { throw new Error('Not implemented'); }
    static async update() { throw new Error('Not implemented'); }
    static async delete() { throw new Error('Not implemented'); }
}

export class AuditExportService {
    static async export() { throw new Error('Not implemented'); }
    static async generate() { throw new Error('Not implemented'); }
}

export class CaseService {
    static async getCase() { throw new Error('Not implemented'); }
    static async listCases() { throw new Error('Not implemented'); }
    static async createCase() { throw new Error('Not implemented'); }
    static async updateCase() { throw new Error('Not implemented'); }
}

export class CaseTimelineService {
    static async getTimeline() { throw new Error('Not implemented'); }
    static async addEvent() { throw new Error('Not implemented'); }
}

export class OperationKpiService {
    static async getKpis() { throw new Error('Not implemented'); }
    static async calculateKpi() { throw new Error('Not implemented'); }
}

export class WorkflowTaskService {
    static async getTasks() { throw new Error('Not implemented'); }
    static async getTaskById() { throw new Error('Not implemented'); }
    static async createTask() { throw new Error('Not implemented'); }
    static async updateTask() { throw new Error('Not implemented'); }
}
