"use client";

import {
    LogOut,
    User,
    Settings,
    Building2,
    Shield,
    Briefcase,
    Check,
    ChevronRight,
    HelpCircle
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function UserNav() {
    const { data: session, update } = useSession();
    const user = session?.user;

    if (!user) return null;

    const initials = user.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : '??';

    const handleSwitchContext = async (tenantId: string, role: string, industry: string) => {
        await update({
            user: {
                ...user,
                tenantId,
                role,
                industry
            }
        });
        // Recargar para asegurar que todos los componentes y datos usen el nuevo contexto
        window.location.reload();
    };

    // Determinar si hay múltiples opciones
    const hasMultipleTenants = (user.tenantAccess?.length || 0) > 1;
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const industries = ['ELEVATORS', 'LEGAL', 'IT', 'GENERIC'];

    // Encontrar el nombre del tenant actual desde tenantAccess si existe
    const currentTenantName = user.tenantAccess?.find(t => t.tenantId === user.tenantId)?.name || user.tenantId;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 pl-2 cursor-pointer group transition-all duration-300 outline-none">
                    <div className="text-right hidden sm:block group-hover:opacity-80 transition-opacity">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">{user.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-tighter flex items-center justify-end gap-1">
                            {currentTenantName} <span className="text-slate-300 dark:text-slate-700">|</span> {user.role}
                        </p>
                    </div>
                    <div className="w-10 h-10 border-2 border-transparent group-hover:border-teal-500/20 rounded-full p-0.5 transition-all">
                        <Avatar className="h-full w-full shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                            <AvatarImage src={user.image || ""} alt={user.name || ""} />
                            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold text-xs">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 mt-2 p-2 border-slate-200 dark:border-slate-800 shadow-xl" align="end" forceMount>
                <div className="flex items-center gap-3 p-2 mb-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <Avatar className="h-12 w-12 border border-white dark:border-slate-700 shadow-sm">
                        <AvatarImage src={user.image || ""} alt={user.name || ""} />
                        <AvatarFallback className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-bold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate tracking-tight">{user.email}</p>
                    </div>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuGroup className="space-y-1 p-1">
                    {/* Switcher de Tenant */}
                    {hasMultipleTenants ? (
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800">
                                <Building2 className="mr-2 h-4 w-4 text-teal-500" />
                                <div className="flex flex-col items-start leading-none">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Empresa Activa</span>
                                    <span className="text-sm font-semibold truncate max-w-[180px]">{currentTenantName}</span>
                                </div>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-64 p-2 shadow-2xl ml-1">
                                <DropdownMenuLabel className="text-[10px] uppercase text-slate-400 font-bold mb-2 px-2">Seleccionar Organización</DropdownMenuLabel>
                                {user.tenantAccess?.map((access) => (
                                    <DropdownMenuItem
                                        key={access.tenantId}
                                        onClick={() => handleSwitchContext(access.tenantId, access.role, access.industry)}
                                        className={cn(
                                            "flex items-center justify-between rounded-md px-2 py-2 cursor-pointer transition-colors mb-1 last:mb-0",
                                            user.tenantId === access.tenantId ? "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{access.name}</span>
                                            <span className="text-[10px] opacity-70 uppercase tracking-widest">{access.industry}</span>
                                        </div>
                                        {user.tenantId === access.tenantId && <Check className="h-4 w-4" />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                    ) : (
                        <div className="flex items-center px-2 py-2 select-none opacity-80">
                            <Building2 className="mr-3 h-4 w-4 text-slate-400" />
                            <div className="flex flex-col leading-none">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Empresa</span>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{currentTenantName}</span>
                            </div>
                        </div>
                    )}

                    {/* Switcher de Perfil/Rol */}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800">
                            <Shield className="mr-2 h-4 w-4 text-blue-500" />
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Perfil de Acceso</span>
                                <span className="text-sm font-semibold">{user.role}</span>
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-56 p-2 ml-1">
                            <DropdownMenuLabel className="text-[10px] uppercase text-slate-400 font-bold mb-2 px-2">Cambiar Nivel de Permisos</DropdownMenuLabel>
                            {['SUPER_ADMIN', 'ADMIN', 'TECNICO', 'INGENIERIA'].map((role) => {
                                // Determinamos si puede cambiar basándonos en su rol REAL (baseRole)
                                const isRealSuperAdmin = user.baseRole === 'SUPER_ADMIN';
                                const isRealAdmin = user.baseRole === 'ADMIN';

                                const canSwitch = isRealSuperAdmin ||
                                    (isRealAdmin && role !== 'SUPER_ADMIN') ||
                                    (user.role === role);

                                return (
                                    <DropdownMenuItem
                                        key={role}
                                        disabled={!canSwitch}
                                        onClick={() => handleSwitchContext(user.tenantId, role, user.industry)}
                                        className={cn(
                                            "flex justify-between items-center rounded-md px-2 py-2 cursor-pointer mb-1 last:mb-0",
                                            user.role === role && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{role}</span>
                                            {user.baseRole === role && (
                                                <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1 rounded uppercase font-bold">Base</span>
                                            )}
                                        </div>
                                        {user.role === role && <Check className="h-4 w-4" />}
                                    </DropdownMenuItem>
                                );
                            })}
                            {user.baseRole !== user.role && (
                                <p className="text-[9px] text-teal-600 dark:text-teal-400 px-2 mt-2 leading-tight font-medium">
                                    Estás en modo simulación. Puedes volver a tu rol original en cualquier momento.
                                </p>
                            )}
                            {user.baseRole !== 'SUPER_ADMIN' && user.baseRole !== 'ADMIN' && (
                                <p className="text-[9px] text-slate-400 px-2 mt-2 leading-tight">
                                    Sólo los administradores pueden alternar perfiles.
                                </p>
                            )}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    {/* Switcher de Materia / Industria */}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800">
                            <Briefcase className="mr-2 h-4 w-4 text-amber-500" />
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Materia de Trabajo</span>
                                <span className="text-sm font-semibold">{user.industry}</span>
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-56 p-2 ml-1">
                            <DropdownMenuLabel className="text-[10px] uppercase text-slate-400 font-bold mb-2 px-2">Cambiar Vertical</DropdownMenuLabel>
                            {industries.map((ind) => (
                                <DropdownMenuItem
                                    key={ind}
                                    onClick={() => handleSwitchContext(user.tenantId, user.role, ind)}
                                    className={cn(
                                        "flex justify-between items-center rounded-md px-2 py-2 cursor-pointer mb-1 last:mb-0",
                                        user.industry === ind && "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                                    )}
                                >
                                    <span className="text-sm">{ind}</span>
                                    {user.industry === ind && <Check className="h-4 w-4" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup className="p-1">
                    <Link href="/perfil" className="w-full">
                        <DropdownMenuItem className="cursor-pointer rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                            <User className="mr-2 h-4 w-4 text-slate-400" />
                            <span className="text-sm">Editar mi Perfil</span>
                        </DropdownMenuItem>
                    </Link>
                    <Link href="/contacto" className="w-full">
                        <DropdownMenuItem className="cursor-pointer rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                            <HelpCircle className="mr-2 h-4 w-4 text-slate-400" />
                            <span className="text-sm">Centro de Ayuda</span>
                        </DropdownMenuItem>
                    </Link>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <div className="p-1">
                    <DropdownMenuItem
                        className="cursor-pointer rounded-md text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-600 dark:focus:text-red-400 transition-colors font-semibold py-2"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar sesión</span>
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
