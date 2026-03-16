"use client";

import { useTranslations } from "next-intl";
import { FeatureShell } from "@/components/shared/FeatureShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Box, FolderOpen, Plus } from "lucide-react";

/**
 * 📦 Collections Module (Phase 125.3)
 * Thematic collections for grouping related documents.
 * UI Standardized with PageContainer/Header pattern and semantic color tokens.
 */
export default function CollectionsPage() {
    const t = useTranslations("spaces.collections");

    return (
        <FeatureShell
            animate
            title={t("title")}
            subtitle={t("subtitle")}
            icon={<Box className="w-6 h-6 text-primary" />}
            backHref="/spaces"
        >

            <div className="mt-6">
                <Card className="border-dashed border-2 bg-card/50">
                    <CardHeader className="text-center pb-2">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <FolderOpen className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-xl">{t("empty.title")}</CardTitle>
                        <CardDescription className="max-w-md mx-auto">
                            {t("empty.description")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center pb-8">
                        <Button disabled className="gap-2">
                            <Plus className="w-4 h-4" />
                            {t("create_collection")}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </FeatureShell>
    );
}
