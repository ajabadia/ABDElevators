import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

/**
 * Divide un texto largo en fragmentos procesables para RAG.
 * Estrategia: 1000 caracteres con overlap de 200.
 */
export async function chunkText(text: string): Promise<string[]> {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 4000,     // ~1000 tokens (High-level context)
        chunkOverlap: 800,   // 20% overlap to preserve boundary context
        separators: ["\n\n", "\n", ".", "!", "?", " ", ""], // Semantic splitting
    });

    const docs = await splitter.createDocuments([text]);
    return docs.map((d: { pageContent: string }) => d.pageContent);
}
