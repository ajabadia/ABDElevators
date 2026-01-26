import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

/**
 * Divide un texto largo en fragmentos procesables para RAG.
 * Estrategia: 1000 caracteres con overlap de 200.
 */
export async function chunkText(text: string): Promise<string[]> {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 2000,
        chunkOverlap: 200,
    });

    const docs = await splitter.createDocuments([text]);
    return docs.map((d: { pageContent: string }) => d.pageContent);
}
