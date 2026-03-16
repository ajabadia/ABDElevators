export * from './stub-services-2';

export const technicalEntityRepository = {
    find: () => { throw new Error('Not implemented'); },
    findOne: () => { throw new Error('Not implemented'); },
    create: () => { throw new Error('Not implemented'); },
    update: () => { throw new Error('Not implemented'); },
    delete: () => { throw new Error('Not implemented'); },
};

export class NotificationTemplateService {
    static async getAll() { throw new Error('Not implemented'); }
    static async getById() { throw new Error('Not implemented'); }
    static async create() { throw new Error('Not implemented'); }
    static async update() { throw new Error('Not implemented'); }
    static async delete() { throw new Error('Not implemented'); }
}

export class AdminExportService {
    static async export() { throw new Error('Not implemented'); }
}

export class CaseWorkflowService {
    static async getWorkflow() { throw new Error('Not implemented'); }
    static async updateWorkflow() { throw new Error('Not implemented'); }
}

export class ChecklistConfigService {
    static async getConfigs() { throw new Error('Not implemented'); }
    static async getById() { throw new Error('Not implemented'); }
    static async create() { throw new Error('Not implemented'); }
    static async update() { throw new Error('Not implemented'); }
    static async delete() { throw new Error('Not implemented'); }
}

export class EnvironmentService {
    static async getAll() { throw new Error('Not implemented'); }
    static async getById() { throw new Error('Not implemented'); }
    static async promote() { throw new Error('Not implemented'); }
}

export class GoldenSetService {
    static async getAll() { throw new Error('Not implemented'); }
    static async getById() { throw new Error('Not implemented'); }
    static async create() { throw new Error('Not implemented'); }
    static async run() { throw new Error('Not implemented'); }
}

export class IngestEnrichmentService {
    static async enrich() { throw new Error('Not implemented'); }
}

export class IngestPredictionService {
    static async predict() { throw new Error('Not implemented'); }
}

export class IntelligencePatternService {
    static async getPatterns() { throw new Error('Not implemented'); }
    static async createPattern() { throw new Error('Not implemented'); }
}

export class KnowledgeAssetDownloadService {
    static async download() { throw new Error('Not implemented'); }
}

export class KnowledgeAssetManagementService {
    static async getAsset() { throw new Error('Not implemented'); }
    static async updateAsset() { throw new Error('Not implemented'); }
    static async deleteAsset() { throw new Error('Not implemented'); }
    static async retry() { throw new Error('Not implemented'); }
}

export class KnowledgeAssetPreviewService {
    static async getPreview() { throw new Error('Not implemented'); }
}

export class KnowledgeAssetSpaceService {
    static async getSpaces() { throw new Error('Not implemented'); }
    static async addToSpace() { throw new Error('Not implemented'); }
    static async removeFromSpace() { throw new Error('Not implemented'); }
    static async setPrimary() { throw new Error('Not implemented'); }
}

export class KnowledgeAssetTraceService {
    static async getTrace() { throw new Error('Not implemented'); }
}

export class Neo4jNodeService {
    static async getNodes() { throw new Error('Not implemented'); }
    static async createNode() { throw new Error('Not implemented'); }
    static async updateNode() { throw new Error('Not implemented'); }
    static async deleteNode() { throw new Error('Not implemented'); }
    static async bulkOperation() { throw new Error('Not implemented'); }
    static async mergeNodes() { throw new Error('Not implemented'); }
}

export class i18nService {
    static async getTranslations() { throw new Error('Not implemented'); }
    static async updateTranslation() { throw new Error('Not implemented'); }
}

export class i18nDebugService {
    static async debug() { throw new Error('Not implemented'); }
}

export class ReportScheduleService {
    static async getAll() { throw new Error('Not implemented'); }
    static async getById() { throw new Error('Not implemented'); }
    static async create() { throw new Error('Not implemented'); }
    static async update() { throw new Error('Not implemented'); }
    static async delete() { throw new Error('Not implemented'); }
    static async generate() { throw new Error('Not implemented'); }
}
