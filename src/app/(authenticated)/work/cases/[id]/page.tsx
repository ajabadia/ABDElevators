"use client";

import { useApiItem } from "@/hooks/useApiItem";
import { useApiList } from "@/hooks/useApiList";
import { CaseDetailLayout } from "@/components/cases/CaseDetailLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageSquare, ListChecks } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function CaseDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const t = useTranslations('cases');

    // 1. Fetch Case Details
    const { data: caseData, isLoading: isLoadingCase } = useApiItem<any>({
        endpoint: `/api/admin/cases/${id}`
    });

    // 2. Fetch Timeline (optional, can also be fetched inside layout or separate component)
    // We fetch it here to pass to layout
    const { data: timelineData, isLoading: isLoadingTimeline } = useApiList<any>({
        endpoint: `/api/admin/cases/${id}/timeline`,
        dataKey: 'data' // Timeline API returns { success: true, data: [...] }
    });

    return (
        <CaseDetailLayout
            caseData={caseData}
            timelineData={timelineData}
            isLoading={isLoadingCase}
        >
            <Tabs defaultValue="details" className="w-full">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6 inline-flex">
                    <TabsTrigger value="details" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm">
                        <FileText className="w-4 h-4" /> Detalles
                    </TabsTrigger>
                    <TabsTrigger value="checklist" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm">
                        <ListChecks className="w-4 h-4" /> Checklist
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm">
                        <MessageSquare className="w-4 h-4" /> Chat & IA
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                        <h3 className="font-bold text-lg">Información del Caso</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium text-slate-500">Cliente</label>
                                <p className="text-base font-semibold">{caseData?.clientName || "N/A"}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-500">Ubicación</label>
                                <p className="text-base font-semibold">{caseData?.location || "N/A"}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-500">Tipo de Elevador</label>
                                <p className="text-base font-semibold">{caseData?.elevatorType || "N/A"}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-500">Estado Técnico</label>
                                <p className="text-base font-semibold">{caseData?.technicalStatus || "Pendiente"}</p>
                            </div>
                            <div className="col-span-2">
                                <label className="text-sm font-medium text-slate-500">Descripción / Notas</label>
                                <p className="text-sm mt-1 text-slate-700 dark:text-slate-300">
                                    {caseData?.originalText ? `${caseData.originalText.substring(0, 300)}...` : "Sin descripción disponible."}
                                </p>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="checklist" className="animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm text-center py-12">
                        <ListChecks className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold">Checklist Técnico</h3>
                        <p className="text-slate-500">La validación técnica se mostrará aquí.</p>
                    </div>
                </TabsContent>

                <TabsContent value="chat" className="animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm text-center py-12">
                        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold">Asistente IA</h3>
                        <p className="text-slate-500">Conversación con el agente sobre este caso.</p>
                    </div>
                </TabsContent>
            </Tabs>
        </CaseDetailLayout>
    );
}
