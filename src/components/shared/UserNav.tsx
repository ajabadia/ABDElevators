"use client";

import React, { useState, useEffect } from "react";
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
    const [mounted, setMounted] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !user) return (
        <div className="flex items-center gap-3 pl-2 opacity-50">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
        </div>
    );

    const initials = user.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : '??';

    const handleSwitchContext = async (tenantId: string, role: string, industry: string) => {
        if (isUpdating) return;
        setIsUpdating(true);
        try {
            await update({
                user: {
                    ...user,
                    tenantId,
                    role,
                    industry
                }
            });

            // 🕒 Wait for cookie propagation
            await new Promise(resolve => setTimeout(resolve, 500));

            // Force hard reload to ensure all providers (Ability, Navigation, etc) reset completely
            window.location.href = '/';
        } catch (error) {
            console.error("Context switch failed", error);
            setIsUpdating(false);
        }
    };

    const handleSignOut = () => {
        // Redirigir explícitamente a /login para evitar 404s en Vercel
        signOut({ callbackUrl: '/login', redirect: true });
    };

    // Determinar si hay múltiples opciones
    const hasMultipleTenants = (user.tenantAccess?.length || 0) > 1;
    // const isSuperAdmin = user.role === 'SUPER_ADMIN'; // Unused
    // const industries = ['ELEVATORS', 'LEGAL', 'IT', 'GENERIC']; // Unused

    // Encontrar el nombre del tenant actual desde tenantAccess si existe
    const currentTenantName = user.tenantAccess?.find(t => t.tenantId === user.tenantId)?.name || user.tenantId;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div suppressHydrationWarning className="flex items-center gap-3 pl-2 cursor-pointer group transition-all duration-300 outline-none">
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
            <DropdownMenuContent className="w-80 mt-2 p-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl" align="end" forceMount>
                <div className="flex items-center gap-4 p-4 mb-2 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-900/20 rounded-xl border border-slate-100 dark:border-slate-800/50">
                    <Avatar className="h-14 w-14 border-2 border-white dark:border-slate-700 shadow-md">
                        <AvatarImage src={user.image || ""} alt={user.name || ""} />
                        <AvatarFallback className="bg-teal-500 text-white font-bold text-lg">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                        <p className="text-base font-black text-slate-900 dark:text-white truncate tracking-tight">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">{user.email}</p>
                    </div>
                </div>

                <DropdownMenuGroup className="p-1 space-y-1">
                    <Link href="/admin/profile" className="w-full">
                        <DropdownMenuItem className="cursor-pointer rounded-lg py-3 px-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                            <User className="mr-3 h-4 w-4 text-slate-400 group-hover:text-teal-500 transition-colors" />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold">Mi Perfil</span>
                                <span className="text-[10px] text-slate-500">Ajustes de cuenta y seguridad</span>
                            </div>
                        </DropdownMenuItem>
                    </Link>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="my-2 bg-slate-100 dark:bg-slate-800" />

                <div className="px-4 py-2 mb-1">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Contexto de Trabajo</h3>
                </div>

                <DropdownMenuGroup className="space-y-1 p-1">
                    {/* Switcher de Tenant */}
                    {hasMultipleTenants ? (
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="rounded-lg py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800">
                                <Building2 className="mr-3 h-4 w-4 text-teal-500" />
                                <div className="flex flex-col items-start leading-none gap-0.5">
                                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Empresa Actual</span>
                                    <span className="text-sm font-bold truncate max-w-[180px]">{currentTenantName}</span>
                                </div>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-64 p-2 shadow-2xl ml-1 rounded-xl">
                                <DropdownMenuLabel className="text-[10px] uppercase text-slate-400 font-bold mb-2 px-2">Organizaciones Disponibles</DropdownMenuLabel>
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
                        <div className="flex items-center px-4 py-2 select-none opacity-80">
                            <Building2 className="mr-3 h-4 w-4 text-slate-400" />
                            <div className="flex flex-col leading-none gap-0.5">
                                <span className="text-[10px] uppercase font-black text-slate-400">Empresa</span>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{currentTenantName}</span>
                            </div>
                        </div>
                    )}

                    {/* Switcher de Perfil/Rol */}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="rounded-lg py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800">
                            <Shield className="mr-3 h-4 w-4 text-blue-500" />
                            <div className="flex flex-col items-start leading-none gap-0.5">
                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Nivel de Acceso</span>
                                <span className="text-sm font-bold">{user.role}</span>
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-56 p-2 ml-1 rounded-xl">
                            <DropdownMenuLabel className="text-[10px] uppercase text-slate-400 font-bold mb-2 px-2">Permisos Activos</DropdownMenuLabel>
                            {['SUPER_ADMIN', 'ADMIN', 'TECNICO', 'INGENIERIA'].map((role) => {
                                const isRealSuperAdmin = user.baseRole === 'SUPER_ADMIN';
                                const isRealAdmin = user.baseRole === 'ADMIN';
                                const canSwitch = isRealSuperAdmin || (isRealAdmin && role !== 'SUPER_ADMIN') || (user.role === role);

                                return (
                                    <DropdownMenuItem
                                        key={role}
                                        disabled={!canSwitch || isUpdating}
                                        onClick={() => handleSwitchContext(user.tenantId, role, user.industry)}
                                        className={cn(
                                            "flex justify-between items-center rounded-md px-2 py-2 cursor-pointer mb-1 last:mb-0",
                                            user.role === role && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
                                            (!canSwitch || isUpdating) && "opacity-50 cursor-not-allowed"
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
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="my-2 bg-slate-100 dark:bg-slate-800" />

                <DropdownMenuGroup className="p-1">
                    <Link href="/admin/support" className="w-full">
                        <DropdownMenuItem className="cursor-pointer rounded-lg py-2 px-4 hover:bg-slate-100 dark:hover:bg-slate-800 group transition-colors">
                            <HelpCircle className="mr-3 h-4 w-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                            <span className="text-sm font-medium">Ayuda y Soporte</span>
                        </DropdownMenuItem>
                    </Link>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="my-2 bg-slate-100 dark:bg-slate-800" />

                <div className="p-1">
                    <DropdownMenuItem
                        className="cursor-pointer rounded-lg text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/10 focus:text-red-600 dark:focus:text-red-400 transition-colors font-black py-3 px-4"
                        onClick={handleSignOut}
                    >
                        <LogOut className="mr-3 h-4 w-4" />
                        <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
