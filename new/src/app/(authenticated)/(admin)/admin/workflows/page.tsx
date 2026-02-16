import { WorkflowCanvas } from '@/components/workflow-editor/WorkflowCanvas';
import { Metadata } from 'next';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
    title: 'Visual Workflow Editor | Automation Studio',
    description: 'Design and customize RAG workflows visually.',
};

export default function WorkflowEditorPage() {
    return (
        <PageContainer spacing="none" className="h-[calc(100vh-theme(spacing.16))] flex flex-col overflow-hidden">
            <div className="px-6 py-2 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
                <PageHeader
                    title="Visual"
                    highlight="Workflow Editor"
                    subtitle="Diseña y personaliza flujos de automatización RAG mediante drag & drop."
                />
            </div>
            <div className="flex-grow relative bg-slate-50/50">
                <WorkflowCanvas />
            </div>
        </PageContainer>
    );
}
