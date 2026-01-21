'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, User as UserIcon } from 'lucide-react';
import Image from 'next/image';

interface ProfilePhotoUploadProps {
    currentPhotoUrl?: string;
    onUploadSuccess: (url: string, publicId: string) => void;
}

export function ProfilePhotoUpload({ currentPhotoUrl, onUploadSuccess }: ProfilePhotoUploadProps) {
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo
        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Error',
                description: 'Por favor selecciona un archivo de imagen.',
                variant: 'destructive',
            });
            return;
        }

        // Validar tamaño (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: 'Error',
                description: 'La imagen es demasiado grande (máximo 5MB).',
                variant: 'destructive',
            });
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Reutilizamos el endpoint que crearemos para uploads
            const res = await fetch('/api/auth/perfil/upload-photo', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                onUploadSuccess(data.url, data.public_id);
                toast({
                    title: 'Foto actualizada',
                    description: 'Tu foto de perfil se ha actualizado correctamente.',
                });
            } else {
                throw new Error('Error al subir imagen');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo subir la imagen.',
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
                    {currentPhotoUrl ? (
                        <Image
                            src={currentPhotoUrl}
                            alt="Foto de perfil"
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
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Foto de Perfil</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">PNG, JPG o GIF hasta 5MB</p>
            </div>
        </div>
    );
}
