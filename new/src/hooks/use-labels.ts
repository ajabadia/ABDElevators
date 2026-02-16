"use client";

import { useSession } from "next-auth/react";
import { getLabels } from "@/lib/labels";
import { IndustryType } from "@/lib/types";

/**
 * Hook para obtener los labels reactivos al contexto del usuario.
 */
export function useLabels() {
    const { data: session } = useSession();

    // Obtenemos la industria de la sesión (o fallback a ELEVATORS)
    // Nota: Por ahora asumimos ELEVATORS hasta que implementemos el selector de industria en el perfil/tenant
    const industry = (session?.user as any)?.industry || 'ELEVATORS';

    return getLabels(industry as IndustryType);
}
