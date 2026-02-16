"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditLogTable } from "./AuditLogTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, UserCog, History, DatabaseZap } from "lucide-react";

/**
 * SecurityView Component
 * Centralizing professional security governance and audit trails.
 * @version 1.1 - Added i18n support and Lifecycle tab.
 */
export function SecurityView() {
    const t = useTranslations("security_hub");

    return (
        <Tabs defaultValue="audit" className="w-full space-y-4">
            <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <TabsTrigger value="permissions" className="gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    {t("tabs.permissions")}
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-2">
                    <History className="w-4 h-4" />
                    {t("tabs.audit")}
                </TabsTrigger>
                <TabsTrigger value="sessions" className="gap-2">
                    <UserCog className="w-4 h-4" />
                    {t("tabs.sessions")}
                </TabsTrigger>
                <TabsTrigger value="lifecycle" className="gap-2">
                    <DatabaseZap className="w-4 h-4" />
                    {t("tabs.lifecycle")}
                </TabsTrigger>
            </TabsList>

            <TabsContent value="permissions" className="animate-in fade-in slide-in-from-bottom-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("permissions.title")}</CardTitle>
                        <CardDescription>
                            {t("permissions.description")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground border-dashed border-2 m-6 rounded-lg">
                        {t("permissions.placeholder")}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="audit" className="animate-in fade-in slide-in-from-bottom-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("audit.title")}</CardTitle>
                        <CardDescription>
                            {t("audit.description")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AuditLogTable />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="sessions" className="animate-in fade-in slide-in-from-bottom-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("sessions.title")}</CardTitle>
                        <CardDescription>
                            {t("sessions.description")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground border-dashed border-2 m-6 rounded-lg">
                        {t("sessions.placeholder")}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="lifecycle" className="animate-in fade-in slide-in-from-bottom-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("lifecycle.title")}</CardTitle>
                        <CardDescription>
                            {t("lifecycle.description")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground border-dashed border-2 m-6 rounded-lg">
                        {t("lifecycle.placeholder")}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
