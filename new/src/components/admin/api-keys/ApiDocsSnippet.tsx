import { ContentCard } from "@/components/ui/content-card";
import { Code } from "lucide-react";

export const ApiDocsSnippet = () => (
    <ContentCard title="Quick Integration Guide" icon={<Code size={20} />} className="border-teal-900/20 bg-teal-950/5">
        <div className="space-y-6">
            <div>
                <h4 className="text-sm font-semibold text-teal-400 mb-2">1. Ingest Document</h4>
                <code className="block p-4 bg-black/50 rounded-lg border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto shadow-inner">
                    curl -X POST https://rag.abd.com/api/v1/documents/ingest \<br />
                    &nbsp;&nbsp;-H "x-api-key: YOUR_KEY" \<br />
                    &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                    &nbsp;&nbsp;-d '&#123;"text": "Content...", "metadata": &#123;"title": "Manual 1"&#125;&#125;'
                </code>
            </div>

            <div>
                <h4 className="text-sm font-semibold text-teal-400 mb-2">2. RAG Query</h4>
                <code className="block p-4 bg-black/50 rounded-lg border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto shadow-inner">
                    curl -X POST https://rag.abd.com/api/v1/rag/query \<br />
                    &nbsp;&nbsp;-H "x-api-key: YOUR_KEY" \<br />
                    &nbsp;&nbsp;-d '&#123;"query": "Error 504 solution", "strategy": "hybrid"&#125;'
                </code>
            </div>
        </div>
    </ContentCard>
);
