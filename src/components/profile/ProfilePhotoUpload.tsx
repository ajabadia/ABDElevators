"use client";

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

interface ProfilePhotoUploadProps {
    currentPhotoUrl?: string;
    onUploadSuccess?: (url: string, publicId: string) => void;
    uploadUrl?: string; // Nuevo: permite al Admin subir fotos a otros usuarios
}

export function ProfilePhotoUpload({ currentPhotoUrl, onUploadSuccess, uploadUrl = '/api/auth/perfil/upload-photo' }: ProfilePhotoUploadProps) {
    const t = useTranslations('profile.photo');
    const tCommon = useTranslations('common');
    const [uploading, setUploading] = useState(false);
    const [fotoUrl, setFotoUrl] = useState<string | undefined>(currentPhotoUrl);
    const { toast } = useToast();
    const { data: session, update } = useSession();

    // Sincronizar estado si cambia la prop externamente
    useState(() => {
        if (currentPhotoUrl !== fotoUrl) setFotoUrl(currentPhotoUrl);
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo
        if (!file.type.startsWith('image/')) {
            toast({
                title: tCommon('error'),
                description: t('typeError'),
                variant: 'destructive',
            });
            return;
        }

        // Validar tamaño (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: tCommon('error'),
                description: t('sizeError'),
                variant: 'destructive',
            });
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Reutilizamos el endpoint que puede ser el del perfil propio o el de Admin
            const res = await fetch(uploadUrl, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setFotoUrl(data.url); // Actualización local inmediata

                // Sincronizar con el Header (Session)
                await update({
                    ...session,
                    user: {
                        ...session?.user,
                        image: data.url
                    }
                });

                onUploadSuccess?.(data.url, data.public_id);
                toast({
                    title: t('successTitle'),
                    description: t('successDesc'),
                });
            } else {
                const errorData = await res.json();
                throw new Error(errorData.message || t('uploadError'));
            }
        } catch (error: any) {
            toast({
                title: tCommon('error'),
                description: error.message || t('uploadError'),
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg bg-teal-50 dark:bg-slate-800 flex items-center justify-center relative">
                    {fotoUrl ? (
                        <Image
                            src={fotoUrl}
                            alt={t('title')}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <UserIcon size={48} className="text-teal-200 dark:text-slate-700" />
                    )}

                    {uploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                            <Loader2 className="animate-spin text-white" size={24} />
                        </div>
                    )}
                </div>

                <label className="absolute bottom-1 right-1 bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-full shadow-md transition-all cursor-pointer">
                    <Camera size={16} />
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                </label>
            </div>
            <div className="text-center">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('title')}</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t('subtitle')}</p>
            </div>
        </div>
    );
}
