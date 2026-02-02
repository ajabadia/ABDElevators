
import { WorkflowCanvas } from '@/components/workflow-editor/WorkflowCanvas';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Visual Workflow Editor | Automation Studio',
    description: 'Design and customize RAG workflows visually.',
};

export default function WorkflowEditorPage() {
    return (
        <div className="h-full flex flex-col">
            <div className="border-b border-slate-200 px-6 py-4 bg-white flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Visual Workflow Editor (Phase 48)</h1>
                    <p className="text-sm text-slate-500">Drag and drop nodes to configure elevator incident automation.</p>
                </div>
            </div>
            <div className="flex-grow bg-slate-50">
                <WorkflowCanvas />
            </div>
        </div>
    );
}
