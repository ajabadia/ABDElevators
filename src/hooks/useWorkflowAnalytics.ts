"use client";

import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { Node } from "@xyflow/react";

interface UseWorkflowAnalyticsProps {
    activeWorkflowId: string | null;
    isAnalysisMode: boolean;
    setIsAnalysisMode: (mode: boolean) => void;
    setIsAnalyticsLoading: (loading: boolean) => void;
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}

export function useWorkflowAnalytics({
    activeWorkflowId,
    isAnalysisMode,
    setIsAnalysisMode,
    setIsAnalyticsLoading,
    setNodes
}: UseWorkflowAnalyticsProps) {
    const { toast } = useToast();
    const t = useTranslations('admin.workflows.canvas');

    const toggleAnalysisMode = useCallback(async () => {
        if (!isAnalysisMode && activeWorkflowId) {
            setIsAnalyticsLoading(true);
            try {
                const res = await fetch(`/api/admin/workflows/analytics/${activeWorkflowId}?days=7`);
                const stats = await res.json();

                if (stats.nodes) {
                    const analyticsMap = stats.nodes.reduce((acc: any, curr: any) => {
                        acc[curr.nodeId] = curr;
                        return acc;
                    }, {});

                    setNodes((nds) =>
                        nds.map((node) => ({
                            ...node,
                            data: {
                                ...node.data,
                                analytics: analyticsMap[node.id] || { count: 0, avgDuration: 0, errorRate: 0 }
                            }
                        }))
                    );
                }
                setIsAnalysisMode(true);
            } catch (err) {
                console.error("Error fetching analytics:", err);
                toast({ title: "Analytics Error", description: "Failed to fetch node metrics.", variant: "destructive" });
            } finally {
                setIsAnalyticsLoading(false);
            }
        } else {
            setNodes((nds) =>
                nds.map((node) => {
                    const { analytics, ...cleanData } = node.data as any;
                    return { ...node, data: cleanData };
                })
            );
            setIsAnalysisMode(false);
        }
    }, [activeWorkflowId, isAnalysisMode, setIsAnalysisMode, setIsAnalyticsLoading, setNodes, toast]);

    const exportReport = useCallback(async () => {
        if (!activeWorkflowId) return;

        setIsAnalyticsLoading(true);
        try {
            const response = await fetch(`/api/admin/workflows/analytics/${activeWorkflowId}/report?days=30`);
            if (!response.ok) throw new Error('Failed to generate report');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `workflow-report-${activeWorkflowId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({ title: t('report_export_title'), description: t('report_export_desc') });
        } catch (err) {
            console.error("Export error:", err);
            toast({ title: t('report_export_failed'), description: t('report_export_failed_desc'), variant: "destructive" });
        } finally {
            setIsAnalyticsLoading(false);
        }
    }, [activeWorkflowId, setIsAnalyticsLoading, toast, t]);

    return {
        toggleAnalysisMode,
        exportReport
    };
}
