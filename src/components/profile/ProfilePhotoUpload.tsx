"use client";

import { useState, useEffect } from 'react';
import { Camera, Loader2, User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useProfileStore } from '@/store/profile-store';
import { toast } from 'sonner';

interface ProfilePhotoUploadProps {
    currentPhotoUrl?: string;
    onUploadSuccess?: (url: string, publicId: string) => void;
    uploadUrl?: string;
}

export function ProfilePhotoUpload({
    currentPhotoUrl,
    onUploadSuccess,
    uploadUrl = '/api/auth/profile' // El endpoint PATCH ahora acepta foto_url
}: ProfilePhotoUploadProps) {
    const t = useTranslations('profile.photo');
    const [uploading, setUploading] = useState(false);
    const [fotoUrl, setFotoUrl] = useState<string | undefined>(currentPhotoUrl);
    const { data: session, update: updateSession } = useSession();
    const { setUser, user: currentUser } = useProfileStore();

    // Sincronizar estado si cambia la prop externamente
    useEffect(() => {
        setFotoUrl(currentPhotoUrl);
    }, [currentPhotoUrl]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo
        if (!file.type.startsWith('image/')) {
            toast.error(t('typeError'));
            return;
        }

        // Validar tamaño (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error(t('sizeError'));
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Nota: En este proyecto, la subida a Cloudinary suele ser un paso previo 
            // o se hace en un endpoint dedicado que devuelve la URL.
            // Para mantener consistencia con el resto de la app, usamos el endpoint de upload.
            const res = await fetch('/api/auth/profile/upload-photo', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                const newUrl = data.url;
                const publicId = data.public_id;

                setFotoUrl(newUrl);

                // 1. Actualizar NextAuth Session
                await updateSession({
                    ...session,
                    user: {
                        ...session?.user,
                        image: newUrl
                    }
                });

                // 2. Actualizar Zustand Store (ya que fetchingProfile lo traerá después, pero esto es inmediato)
                setUser(currentUser ? { ...currentUser, foto_url: newUrl, foto_cloudinary_id: publicId } : null);

                // 3. Callback
                onUploadSuccess?.(newUrl, publicId);

                toast.success(t('successTitle'), {
                    description: t('successDesc'),
                });
            } else {
                const errorData = await res.json();
                throw new Error(errorData.message || t('uploadError'));
            }
        } catch (error: any) {
            toast.error(error.message || t('uploadError'));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg bg-teal-50 dark:bg-slate-800 flex items-center justify-center relative transition-transform hover:scale-[1.02]">
                    {fotoUrl ? (
                        <Image
                            src={fotoUrl}
                            alt={t('title')}
                            fill
                            className="object-cover"
                            sizes="128px"
                        />
                    ) : (
                        <div className="bg-teal-100 dark:bg-teal-900/30 w-full h-full flex items-center justify-center">
                            <UserIcon size={48} className="text-teal-600 dark:text-teal-400 opacity-40" />
                        </div>
                    )}

                    {uploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 backdrop-blur-sm">
                            <Loader2 className="animate-spin text-white" size={24} />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                        <Camera className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                    </div>
                </div>

                <label className="absolute bottom-1 right-1 bg-teal-600 hover:bg-teal-700 text-white p-2.5 rounded-full shadow-md transition-all cursor-pointer hover:shadow-lg active:scale-95">
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
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('title')}</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{t('subtitle')}</p>
            </div>
        </div>
    );
}
