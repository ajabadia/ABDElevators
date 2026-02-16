import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

/**
 * Divide un texto largo en fragmentos procesables para RAG.
 * Estrategia: Header-Aware Smart Chunking.
 * Prioriza cortes en Secciones y Capítulos para mantener la coherencia técnica.
 */
export async function chunkText(text: string): Promise<string[]> {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 3500,     // Reducimos ligeramente para dejar espacio a metadatos
        chunkOverlap: 500,   // Overlap moderado
        separators: [
            "\nSECTION ",    // Headers estándar
            "\nSECCIÓN ",
            "\nCHAPTER ",
            "\nCAPÍTULO ",
            "\n\n### ",      // Markdown headers
            "\n\n## ",
            "\n\n# ",
            "\n\n",          // Párrafos
            ".\n",           // Final de oración con salto
            "\n",
            " ",
            ""
        ],
    });

    const docs = await splitter.createDocuments([text]);
    return docs.map((d: { pageContent: string }) => d.pageContent);
}
