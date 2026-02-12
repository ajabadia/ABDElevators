"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickQAPanel } from "@/components/spaces/QuickQAPanel";
import { Box, Zap, FileText, UserCircle } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * 🌌 Spaces Main Page (Phase 125.3)
 * Hub for Personal Spaces, Collections and Quick Q&A.
 */
export default function SpacesPage() {
    const t = useTranslations("common.spaces");

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>

            <Tabs defaultValue="quick-qa" className="space-y-4">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="quick-qa" className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-orange-500 fill-orange-500/20" />
                        {t("tabs.quick_qa")}
                    </TabsTrigger>
                    <TabsTrigger value="personal" className="flex items-center gap-2">
                        <UserCircle className="w-4 h-4" />
                        {t("tabs.personal")}
                    </TabsTrigger>
                    <TabsTrigger value="collections" className="flex items-center gap-2">
                        <Box className="w-4 h-4" />
                        {t("tabs.collections")}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="quick-qa" className="border-none p-0 outline-none">
                    <QuickQAPanel />
                </TabsContent>

                <TabsContent value="personal" className="h-[400px] flex items-center justify-center border-2 border-dashed rounded-xl opacity-50">
                    <div className="text-center">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium">{t("placeholders.personal_title")}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{t("placeholders.personal_desc")}</p>
                    </div>
                </TabsContent>

                <TabsContent value="collections" className="h-[400px] flex items-center justify-center border-2 border-dashed rounded-xl opacity-50">
                    <div className="text-center">
                        <Box className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium">{t("placeholders.collections_title")}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{t("placeholders.collections_desc")}</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
