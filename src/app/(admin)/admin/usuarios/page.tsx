"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCog, KeyRound } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CreateUserModal } from "@/components/admin/CreateUserModal";
import { useToast } from "@/hooks/use-toast";

interface Usuario {
    _id: string;
    email: string;
    nombre: string;
    apellidos: string;
    puesto?: string;
    rol: 'ADMIN' | 'TECNICO' | 'INGENIERIA';
    activo: boolean;
    creado: string;
}

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
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
            ADMIN: "bg-red-100 text-red-700 border-red-200",
            TECNICO: "bg-blue-100 text-blue-700 border-blue-200",
            INGENIERIA: "bg-green-100 text-green-700 border-green-200",
        };
        return colors[rol as keyof typeof colors] || "";
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-outfit">
                        Gestión de Usuarios
                    </h2>
                    <p className="text-slate-500 mt-1">
                        Administra usuarios y permisos del sistema
                    </p>
                </div>
                <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-teal-600 hover:bg-teal-700"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Usuario
                </Button>
            </div>

            <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                    <CardTitle>Usuarios Registrados</CardTitle>
                    <CardDescription>
                        {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} en el sistema
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Cargando...</div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="font-bold text-slate-900">Nombre</TableHead>
                                    <TableHead className="font-bold text-slate-900">Email</TableHead>
                                    <TableHead className="font-bold text-slate-900">Puesto</TableHead>
                                    <TableHead className="font-bold text-slate-900">Rol</TableHead>
                                    <TableHead className="font-bold text-slate-900">Estado</TableHead>
                                    <TableHead className="font-bold text-slate-900">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usuarios.map((usuario) => (
                                    <TableRow key={usuario._id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-medium">
                                            {usuario.nombre} {usuario.apellidos}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">{usuario.email}</TableCell>
                                        <TableCell>{usuario.puesto || '-'}</TableCell>
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
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleResetPassword(usuario._id, usuario.email)}
                                            >
                                                <KeyRound className="h-4 w-4" />
                                            </Button>
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
        </div>
    );
}
