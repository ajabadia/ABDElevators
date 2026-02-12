"use client";

import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { WorkflowProvider } from './WorkflowContext';
import { WorkflowToolbar } from './WorkflowToolbar';
import { CanvasArea } from './CanvasArea';

/**
 * WorkflowCanvas (Refactored)
 * 
 * Modular structure:
 * 1. WorkflowProvider: Central state, hooks, and context.
 * 2. WorkflowToolbar: Floating metadata and action bars.
 * 3. CanvasArea: Main ReactFlow editor and libraries.
 */
export const WorkflowCanvas = () => {
    return (
        <ReactFlowProvider>
            <WorkflowProvider>
                <div className="relative w-full h-full overflow-hidden">
                    <WorkflowToolbar />
                    <CanvasArea />
                </div>
            </WorkflowProvider>
        </ReactFlowProvider>
    );
};
