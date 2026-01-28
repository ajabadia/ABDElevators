import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/perfil/ProfileForm';
import { PasswordForm } from '@/components/perfil/PasswordForm';
import { ProfilePhotoUpload } from '@/components/perfil/ProfilePhotoUpload';
import { connectAuthDB } from '@/lib/db';
import { User as UserIcon, Shield, Key, Bell } from 'lucide-react';
import { UserNotificationPreferencesForm } from '@/components/perfil/UserNotificationPreferencesForm';
import { ActiveSessionsForm } from '@/components/perfil/ActiveSessionsForm';
import { MfaSettingsForm } from '@/components/perfil/MfaSettingsForm';
import { UserEfficiencyStats } from '@/components/perfil/UserEfficiencyStats';

/**
 * Página de Perfil de Usuario
 * Permite gestionar datos personales, foto y seguridad.
 */
export default async function PerfilPage() {
    const session = await auth();
    if (!session?.user?.email) {
        redirect('/login');
    }

    const db = await connectAuthDB();
    const user = await db.collection('users').findOne({ email: session.user.email });

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span className="bg-teal-600 w-1.5 h-8 rounded-full" />
                        Configuración <span className="text-teal-600">de Cuenta</span>
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Gestiona tu identidad digital, preferencias y seguridad de acceso.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Columna Izquierda: Identidad y Seguridad Rápida */}
                <div className="md:col-span-4 space-y-6">
                    {/* Tarjeta de Perfil */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-teal-500/10 to-blue-500/10 z-0"></div>
                        <div className="relative z-10">
                            <ProfilePhotoUpload
                                currentPhotoUrl={user.foto_url}
                            />
                        </div>

                        <div className="mt-4 relative z-10">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.nombre || 'Usuario'}</h2>
                            <p className="text-sm text-slate-500">{user.email}</p>
                        </div>

                        <div className="mt-8 w-full space-y-3">
                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <Shield size={16} className="text-teal-600" />
                                    <span className="text-xs font-bold uppercase text-slate-500">Rol</span>
                                </div>
                                <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm">
                                    {user.rol}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <UserIcon size={16} className="text-teal-600" />
                                    <span className="text-xs font-bold uppercase text-slate-500">Miembro desde</span>
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                                    {new Date(user.creado || Date.now()).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Estadísticas de Eficiencia (Fase 24.2 - User View) */}
                    <UserEfficiencyStats />

                    {/* Sesiones Activas (Movido aquí por petición de UX) */}
                    <div className="mt-6">
                        <ActiveSessionsForm />
                    </div>
                </div>

                {/* Columna Derecha: Formularios Detallados */}
                <div className="md:col-span-8 space-y-8">
                    {/* Datos Personales */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <UserIcon size={20} className="text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Información Personal</h2>
                                <p className="text-xs text-slate-500">Actualiza tus datos de contacto básicos</p>
                            </div>
                        </div>
                        <div className="p-6">
                            <ProfileForm />
                        </div>
                    </section>

                    {/* Notificaciones */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <Bell size={20} className="text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Preferencias de Notificación</h2>
                                <p className="text-xs text-slate-500">Define qué alertas quieres recibir y por qué canal</p>
                            </div>
                        </div>
                        <div className="p-6">
                            <UserNotificationPreferencesForm />
                        </div>
                    </section>

                    {/* Seguridad */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <Key size={20} className="text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Centro de Seguridad</h2>
                                <p className="text-xs text-slate-500">Contraseña, MFA y Sesiones Activas</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-slate-100 pb-2">Contraseña</h3>
                                    <PasswordForm />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-slate-100 pb-2">Autenticación Multifactor</h3>
                                    <MfaSettingsForm />
                                </div>
                            </div>


                        </div>
                    </section>
                </div>
            </div>
        </div>
    );

}
