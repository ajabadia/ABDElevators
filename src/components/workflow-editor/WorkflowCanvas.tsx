"use client";

import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { WorkflowProvider } from './WorkflowContext';
import { WorkflowToolbar } from './WorkflowToolbar';
import { CanvasArea } from './CanvasArea';

/**
 * WorkflowCanvas (Refactored Phase 412)
 */
export const WorkflowCanvas = ({ workflowsPromise, environment }: { workflowsPromise: Promise<any>, environment: string }) => {
    return (
        <ReactFlowProvider>
            <WorkflowProvider initialWorkflowsPromise={workflowsPromise} initialEnvironment={environment}>
                <div className="relative w-full h-full overflow-hidden">
                    <WorkflowToolbar />
                    <CanvasArea />
                </div>
            </WorkflowProvider>
        </ReactFlowProvider>
    );
};
