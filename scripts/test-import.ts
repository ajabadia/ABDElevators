try {
    require('@/lib/rag-service');
    console.log('Successfully imported rag-service');
    require('@/services/ingest/IngestPreparer');
    console.log('Successfully imported IngestPreparer');
    require('@/core/application/use-cases/PrepareIngestionUseCase');
    console.log('Successfully imported PrepareIngestionUseCase');
    require('@/core/application/use-cases/ExecuteIngestionAnalysisUseCase');
    console.log('Successfully imported ExecuteIngestionAnalysisUseCase');
} catch (error) {
    console.error('Failed to import:', error);
}
