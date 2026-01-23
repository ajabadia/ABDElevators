"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCog, KeyRound, Mail } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CreateUserModal } from "@/components/admin/CreateUserModal";
import { EditUserModal } from "@/components/admin/EditUserModal";
import { InviteUserModal } from "@/components/admin/InviteUserModal";
import { useToast } from "@/hooks/use-toast";
import { useSession, signOut } from "next-auth/react";

interface Usuario {
    _id: string;
    email: string;
    nombre: string;
    apellidos: string;
    puesto?: string;
    rol: 'SUPER_ADMIN' | 'ADMIN' | 'TECNICO' | 'INGENIERIA';
    tenantId?: string;
    activo: boolean;
    creado: string;
}

export default function UsuariosPage() {
    const { data: session } = useSession();
    const currentUserRole = session?.user?.role;
    const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';

    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchUsuarios = async () => {
        try {
            const res = await fetch('/api/admin/usuarios');
            const data = await res.json();
            setUsuarios(data.usuarios);
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron cargar los usuarios",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const handleResetPassword = async (userId: string, email: string) => {
        if (!confirm(`¿Resetear contraseña para ${email}?`)) return;

        try {
            const res = await fetch(`/api/admin/usuarios/${userId}/reset-password`, {
                method: 'POST',
            });
            const data = await res.json();

            if (data.success) {
                toast({
                    title: "Contraseña reseteada",
                    description: `Nueva contraseña temporal: ${data.temp_password}`,
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo resetear la contraseña",
                variant: "destructive",
            });
        }
    };

    const getRoleBadge = (rol: string) => {
        const colors = {
            SUPER_ADMIN: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
            ADMIN: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
            TECNICO: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
            INGENIERIA: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
        };
        return colors[rol as keyof typeof colors] || "";
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-outfit">
                        Gestión de Usuarios
                    </h2>
                    <p className="text-slate-500 mt-1">
                        Administra usuarios y permisos {isSuperAdmin ? 'globales' : 'de tu organización'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setShowInviteModal(true)}
                        className="border-teal-200 text-teal-700 hover:bg-teal-50"
                    >
                        <Mail className="mr-2 h-4 w-4" />
                        Invitar Usuario
                    </Button>
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-teal-600 hover:bg-teal-700"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Manualmente
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-lg dark:bg-slate-900">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                    <CardTitle>Usuarios Registrados</CardTitle>
                    <CardDescription>
                        {usuarios?.length || 0} usuario{(usuarios?.length || 0) !== 1 ? 's' : ''} {isSuperAdmin ? 'accesibles' : 'en tu entidad'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Cargando...</div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                                <TableRow>
                                    <TableHead className="font-bold text-slate-900 dark:text-slate-100">Nombre</TableHead>
                                    <TableHead className="font-bold text-slate-900 dark:text-slate-100">Email</TableHead>
                                    {isSuperAdmin && (
                                        <TableHead className="font-bold text-slate-900 dark:text-slate-100 text-teal-600">Tenant</TableHead>
                                    )}
                                    <TableHead className="font-bold text-slate-900 dark:text-slate-100">Puesto</TableHead>
                                    <TableHead className="font-bold text-slate-900 dark:text-slate-100">Rol</TableHead>
                                    <TableHead className="font-bold text-slate-900 dark:text-slate-100">Estado</TableHead>
                                    <TableHead className="font-bold text-slate-900 dark:text-slate-100">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usuarios.map((usuario) => (
                                    <TableRow key={usuario._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                        <TableCell className="font-medium dark:text-slate-100">
                                            {usuario.nombre} {usuario.apellidos}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm dark:text-slate-300">{usuario.email}</TableCell>
                                        {isSuperAdmin && (
                                            <TableCell className="font-bold text-xs text-teal-600 uppercase">
                                                {usuario.tenantId}
                                            </TableCell>
                                        )}
                                        <TableCell className="dark:text-slate-300">{usuario.puesto || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getRoleBadge(usuario.rol)}>
                                                {usuario.rol}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={usuario.activo ? "default" : "secondary"}>
                                                {usuario.activo ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setEditingUserId(usuario._id)}
                                                    className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                                                >
                                                    <UserCog className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleResetPassword(usuario._id, usuario.email)}
                                                    className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                >
                                                    <KeyRound className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <CreateUserModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    fetchUsuarios();
                    setShowCreateModal(false);
                }}
            />

            <InviteUserModal
                open={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                onSuccess={() => {
                    fetchUsuarios();
                    setShowInviteModal(false);
                }}
            />

            <EditUserModal
                userId={editingUserId}
                open={!!editingUserId}
                onClose={() => setEditingUserId(null)}
                onSuccess={() => {
                    fetchUsuarios();
                    setEditingUserId(null);
                }}
            />
        </div>
    );
}
