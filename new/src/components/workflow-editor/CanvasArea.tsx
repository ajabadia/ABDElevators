"use client";

import React from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NodeLibrary } from './NodeLibrary';
import { NodePropertiesEditor } from './NodePropertiesEditor';
import { ExecutionLogsPanel } from './ExecutionLogsPanel';
import { useWorkflow } from './WorkflowContext';
import { TriggerNode } from './CustomNodes/TriggerNode';
import { ActionNode } from './CustomNodes/ActionNode';
import { ConditionNode } from './CustomNodes/ConditionNode';
import { SwitchNode } from './CustomNodes/SwitchNode';
import { WaitNode } from './CustomNodes/WaitNode';
import { LoopNode } from './CustomNodes/LoopNode';

const nodeTypes = {
    trigger: TriggerNode,
    action: ActionNode,
    condition: ConditionNode,
    switch: SwitchNode,
    wait: WaitNode,
    loop: LoopNode,
};

export function CanvasArea() {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        setReactFlowInstance,
        onDrop,
        onDragOver,
        onNodeClick,
        reactFlowWrapper,
        selectedNode,
        updateNodeData,
        setSelectedNode,
        showLogs,
        activeWorkflowId,
        setShowLogs,
        snapToGrid
    } = useWorkflow();

    return (
        <div className="flex h-[calc(100vh-64px)] w-full text-slate-900">
            <NodeLibrary />
            <div className="flex-grow h-full relative" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    nodeTypes={nodeTypes}
                    onNodeClick={onNodeClick}
                    snapToGrid={snapToGrid}
                    snapGrid={[15, 15]}
                    fitView
                >
                    <Controls />
                    <MiniMap />
                    <Background gap={12} size={1} />
                </ReactFlow>

                {selectedNode && (
                    <NodePropertiesEditor
                        node={selectedNode}
                        onUpdate={updateNodeData}
                        onClose={() => setSelectedNode(null)}
                    />
                )}

                {showLogs && activeWorkflowId && (
                    <ExecutionLogsPanel
                        workflowId={activeWorkflowId}
                        onClose={() => setShowLogs(false)}
                    />
                )}
            </div>
        </div>
    );
}
