"use client";

import { ProfileForm } from '@/components/profile/ProfileForm';
import { PasswordForm } from '@/components/profile/PasswordForm';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';
import { useState, useEffect } from 'react';
import { User, ShieldCheck, Mail, Lock, Camera } from 'lucide-react';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";

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
        <PageContainer className="max-w-6xl">
            <PageHeader
                title="Mi"
                highlight="Perfil"
                subtitle="Gestiona tu información personal y seguridad."
            />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-4">
                    <ContentCard title="Avatar" icon={<Camera size={20} />} className="flex flex-col items-center">
                        <ProfilePhotoUpload
                            currentPhotoUrl={user?.foto_url}
                            onUploadSuccess={handlePhotoSuccess}
                        />
                        <div className="mt-6 w-full space-y-4">
                            <div className="flex items-center gap-3 text-sm text-slate-400 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                <Mail size={16} className="text-teal-500" />
                                <span className="truncate">{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-400 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                <ShieldCheck size={16} className="text-teal-500" />
                                <span className="font-semibold text-teal-400">{user?.rol}</span>
                            </div>
                        </div>
                    </ContentCard>
                </div>

                <div className="md:col-span-8 space-y-6">
                    <ContentCard title="Información Personal" icon={<User size={20} />}>
                        <ProfileForm />
                    </ContentCard>

                    <ContentCard title="Seguridad" icon={<Lock size={20} />}>
                        <PasswordForm />
                    </ContentCard>
                </div>
            </div>
        </PageContainer>
    );
}
