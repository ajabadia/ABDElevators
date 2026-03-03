import { ragService } from '../src/lib/rag-service'; // Testing relative
import { IngestPreparer } from '../src/services/ingest/IngestPreparer';
import { PrepareIngestionUseCase } from '../src/core/application/use-cases/PrepareIngestionUseCase';
import { ExecuteIngestionAnalysisUseCase } from '../src/core/application/use-cases/ExecuteIngestionAnalysisUseCase';

console.log('--- IMPORT TEST START ---');
try { console.log('✅ IngestPreparer:', !!IngestPreparer); } catch (e) { console.error('❌ IngestPreparer failed', e); }
try { console.log('✅ PrepareIngestionUseCase:', !!PrepareIngestionUseCase); } catch (e) { console.error('❌ PrepareIngestionUseCase failed', e); }
try { console.log('✅ ExecuteIngestionAnalysisUseCase:', !!ExecuteIngestionAnalysisUseCase); } catch (e) { console.error('❌ ExecuteIngestionAnalysisUseCase failed', e); }
console.log('--- IMPORT TEST END ---');
