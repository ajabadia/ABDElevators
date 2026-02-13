import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChunkResult } from './ChunkingOrchestrator';

export interface SimpleChunkerOptions {
    industry?: string;
    filename?: string;
}

/**
 * SimpleChunker: Chunking por párrafos/reglas fijas (nivel bajo)
 * Sin uso de IA - método determinista
 */
export class SimpleChunker {
    private static readonly CHUNK_SIZE = 3500;
    private static readonly CHUNK_OVERLAP = 500;

    static async chunk(text: string, metadata?: SimpleChunkerOptions): Promise<ChunkResult[]> {
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: this.CHUNK_SIZE,
            chunkOverlap: this.CHUNK_OVERLAP,
            separators: [
                "\nSECTION ",
                "\nSECCIÓN ",
                "\nCHAPTER ",
                "\nCAPÍTULO ",
                "\n\n### ",
                "\n\n## ",
                "\n\n# ",
                "\n\n",
                ".\n",
                "\n",
                " ",
                ""
            ],
        });

        const docs = await splitter.createDocuments([text]);
        
        return docs.map((doc: { pageContent: string }) => ({
            text: doc.pageContent,
            type: 'tema' as const
        }));
    }
}
