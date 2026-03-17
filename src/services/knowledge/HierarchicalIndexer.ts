import { getErrorMessage } from '@/lib/errors-helpers';
import { z } from 'zod';
import { logEvento } from "@abd/platform-core/server";
import { DocumentProfileSchema, DocumentSectionSchema } from "@abd/rag-engine";
import { DocumentProfileRepository } from "@/lib/repositories/DocumentProfileRepository";
import { DocumentSectionRepository } from "@/lib/repositories/DocumentSectionRepository";
import { IngestTracer } from "@/services/ingest/observability/IngestTracer";
import { AppError } from '@/lib/errors';
import { PromptRunner } from '@/lib/llm-core/PromptRunner';

/**
 * 🌲 HierarchicalIndexer (Era 11)
 * Encargado de transformar un documento plano en una estructura jerárquica
 * de perfiles y secciones con resúmenes semánticos.
 */
export class HierarchicalIndexer {

    /**
     * Procesa un activo para generar su estructura jerárquica con trazabilidad completa.
     */
    static async processAsset(
        assetId: string,
        text: string,
        tenantId: string,
        correlationId: string,
        options: {
            spaceId?: string;
            collectionId?: string;
            llmClient?: unknown;
        }
    ): Promise<{ profileId: string; sectionsCount: number }> {
        const { spaceId, collectionId } = options;
        const tracerContext = { correlationId, tenantId, fileName: assetId };
        const span = IngestTracer.startHierarchicalIndexingSpan(tracerContext);

        try {
            // 1. Segmentación Estructural
            const sections = await this.segmentText(text, correlationId, tenantId);

            const profileRepo = new DocumentProfileRepository();
            const sectionRepo = new DocumentSectionRepository();

            // 2. Generar Perfil Global
            const globalSummary = await this.generateGlobalSummary(text, correlationId, tenantId);

            const profileData = DocumentProfileSchema.parse({
                tenantId,
                assetId,
                spaceId,
                collectionId,
                summaryGlobal: globalSummary,
                sectionsCount: sections.length,
                ingestionProfileVersion: '1.0.0'
            });

            const profileId = await profileRepo.create(profileData);

            // 3. Procesar Secciones
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                const sectionSummary = await this.generateSectionSummary(section.content, correlationId, tenantId);

                const sectionData = DocumentSectionSchema.parse({
                    tenantId,
                    assetId,
                    spaceId,
                    collectionId,
                    title: section.title,
                    level: section.level,
                    summary: sectionSummary,
                    order: i,
                    path: section.title
                });

                await sectionRepo.create(sectionData);
            }

            await IngestTracer.endSpanSuccess(span, tracerContext, { sectionsCount: sections.length });

            await logEvento({
                level: 'INFO',
                source: 'HIERARCHICAL_INDEXER',
                action: 'ASSET_PROCESSED',
                message: `Hierarchical indexing completed for asset ${assetId}`,
                correlationId,
                tenantId,
                details: { sectionsCount: sections.length }
            });

            return { profileId, sectionsCount: sections.length };
        } catch (error: unknown) {
            await IngestTracer.endSpanError(span, tracerContext, error as Error);
            if (error instanceof AppError) throw error;
            throw new AppError('INTERNAL_ERROR', 500, `Hierarchical indexing failed: ${getErrorMessage(error)}`);
        }
    }

    private static async segmentText(text: string, correlationId: string, tenantId: string): Promise<{ title: string, content: string, level: number }[]> {
        const SectionSchema = z.object({
            title: z.string(),
            level: z.number(),
            content: z.string()
        });

        // Heurística: Identificar posibles cabeceras mediante patrones comunes
        const headerPatterns = [
            /^(?:(?:CAPÍTULO|SECCIÓN|ANEXO)\s+\d+[:.]?\s+.*)$/mgi,
            /^(?:\d+(?:\.\d+)*\s+[A-ZÁÉÍÓÚ][a-záéíóú\s]+)$/mg,
            /^[A-ZÁÉÍÓÚ\s]{5,50}$/mg 
        ];

        let heuristicHeaders: string[] = [];
        for (const pattern of headerPatterns) {
            const matches = text.match(pattern);
            if (matches) heuristicHeaders = [...heuristicHeaders, ...matches.slice(0, 5)]; 
        }

        try {
            return await PromptRunner.runJson({
                key: 'HIERARCHICAL_SEGMENTER',
                variables: {
                    text: text.substring(0, 20000), 
                    hints: heuristicHeaders.join('\n')
                },
                schema: z.array(SectionSchema),
                tenantId,
                correlationId
            });
        } catch (error) {
            await logEvento({
                level: 'WARN',
                source: 'HIERARCHICAL_INDEXER',
                action: 'SEGMENTATION_FALLBACK',
                message: 'LLM Segmentation failed, using simple splits',
                correlationId,
                tenantId,
                details: { error: getErrorMessage(error) }
            });
            
            // Fallback: Split by common separators if LLM fails
            const simpleSplits = text.split(/\n(?=\d+\.\s+[A-Z])/);
            if (simpleSplits.length > 1) {
                return simpleSplits.map((s, i) => ({
                    title: `Section ${i + 1}`,
                    content: s.trim(),
                    level: 1
                }));
            }
            return [{ title: "Complete Document", content: text, level: 1 }];
        }
    }

    private static async generateGlobalSummary(text: string, correlationId: string, tenantId: string): Promise<string> {
        try {
            return await PromptRunner.runText({
                key: 'HIERARCHICAL_GLOBAL_SUMMARY',
                variables: { text: text.substring(0, 10000) },
                tenantId,
                correlationId
            });
        } catch (error) {
            await logEvento({
                level: 'WARN',
                source: 'HIERARCHICAL_INDEXER',
                action: 'SUMMARY_FAILED',
                message: 'Global summary failed',
                correlationId,
                tenantId,
                details: { error: getErrorMessage(error) }
            });
            return "Summary not available.";
        }
    }

    private static async generateSectionSummary(text: string, correlationId: string, tenantId: string): Promise<string> {
        try {
            return await PromptRunner.runText({
                key: 'HIERARCHICAL_SECTION_SUMMARY',
                variables: { text: text.substring(0, 5000) },
                tenantId,
                correlationId
            });
        } catch (error) {
            return "Section summary not available.";
        }
    }
}
