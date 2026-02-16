"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditLogTable } from "./AuditLogTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, UserCog, History } from "lucide-react";

export function SecurityView() {
    return (
        <Tabs defaultValue="audit" className="w-full space-y-4">
            <TabsList>
                <TabsTrigger value="permissions">
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Permisos y Roles
                </TabsTrigger>
                <TabsTrigger value="audit">
                    <History className="w-4 h-4 mr-2" />
                    Auditoría
                </TabsTrigger>
                <TabsTrigger value="sessions">
                    <UserCog className="w-4 h-4 mr-2" />
                    Sesiones
                </TabsTrigger>
            </TabsList>

            <TabsContent value="permissions">
                <Card>
                    <CardHeader>
                        <CardTitle>Gestión de Roles (Guardian)</CardTitle>
                        <CardDescription>
                            Configure los roles y permisos de acceso para su organización.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground border-dashed border-2 m-6 rounded-lg">
                        Próximamente: Editor visual de políticas Guardian.
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="audit">
                <Card>
                    <CardHeader>
                        <CardTitle>Registro de Auditoría</CardTitle>
                        <CardDescription>
                            Historial inmutable de acciones realizadas en el sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AuditLogTable />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="sessions">
                <Card>
                    <CardHeader>
                        <CardTitle>Sesiones Activas</CardTitle>
                        <CardDescription>
                            Supervise y gestione las sesiones de usuario activas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground border-dashed border-2 m-6 rounded-lg">
                        Próximamente: Gestor de sesiones.
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
