import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/perfil/ProfileForm';
import { PasswordForm } from '@/components/perfil/PasswordForm';
import { ProfilePhotoUpload } from '@/components/perfil/ProfilePhotoUpload';
import { connectDB } from '@/lib/db';
import { User as UserIcon, Shield, Key } from 'lucide-react';

/**
 * Página de Perfil de Usuario
 * Permite gestionar datos personales, foto y seguridad.
 */
export default async function PerfilPage() {
    const session = await auth();
    if (!session?.user?.email) {
        redirect('/login');
    }

    const db = await connectDB();
    const user = await db.collection('usuarios').findOne({ email: session.user.email });

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-4xl font-extrabold tracking-tighter text-slate-900 dark:text-white font-outfit">
                    Mi <span className="text-teal-600">Perfil</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Gestiona tu información personal y configuración de seguridad.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Columna Izquierda: Foto y Resumen */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center">
                        <ProfilePhotoUpload
                            currentPhotoUrl={user.foto_url}
                        // Note: ProfilePhotoUpload internally updates the DB via API
                        />

                        <div className="mt-6 w-full pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 mb-2">
                                <Shield size={16} className="text-teal-600" />
                                <span className="font-medium">Rol:</span>
                                <span className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                    {user.rol}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <UserIcon size={16} className="text-teal-600" />
                                <span className="font-medium">Miembro desde:</span>
                                <span>{new Date(user.creado).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Formularios */}
                <div className="md:col-span-2 space-y-8">
                    <section>
                        <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300">
                            <UserIcon size={20} className="text-teal-600" />
                            <h2 className="text-xl font-bold">Información Personal</h2>
                        </div>
                        <ProfileForm />
                    </section>

                    <section>
                        <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300">
                            <Key size={20} className="text-teal-600" />
                            <h2 className="text-xl font-bold">Seguridad</h2>
                        </div>
                        <PasswordForm />
                    </section>
                </div>
            </div>
        </div>
    );
}
