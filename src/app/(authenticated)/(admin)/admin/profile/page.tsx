'use client';

import { ProfileForm } from '@/components/profile/ProfileForm';
import { PasswordForm } from '@/components/profile/PasswordForm';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';
import { useState, useEffect } from 'react';
import { User, ShieldCheck, Mail, MapPin } from 'lucide-react';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        fetch('/api/auth/perfil')
            .then(res => res.json())
            .then(data => setUser(data));
    }, []);

    const handlePhotoSuccess = (url: string, publicId: string) => {
        setUser((prev: any) => ({ ...prev, foto_url: url }));
        // La API de actualización de perfil se llama internamente o podemos llamarla aquí
        fetch('/api/auth/perfil', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ foto_url: url, foto_cloudinary_id: publicId }),
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/3">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center">
                        <ProfilePhotoUpload
                            currentPhotoUrl={user?.foto_url}
                            onUploadSuccess={handlePhotoSuccess}
                        />
                        <div className="mt-6 w-full space-y-3">
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <Mail size={16} className="text-teal-600" />
                                <span>{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <ShieldCheck size={16} className="text-teal-600" />
                                <span className="font-semibold text-teal-700 dark:text-teal-400">{user?.rol}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <User className="text-teal-600" size={24} />
                            Información Personal
                        </h2>
                        <ProfileForm />
                    </section>

                    <section>
                        <PasswordForm />
                    </section>
                </div>
            </div>
        </div>
    );
}
