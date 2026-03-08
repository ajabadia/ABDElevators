"use client";

import { getLabels } from "@/lib/labels";
import { IndustryType } from "@/lib/types";
import { useIndustryStore } from "@/store/industry-store";

/**
 * Hook para obtener los labels reactivos al contexto del usuario.
 */
export function useLabels() {
    // Obtenemos la industria del store global (reactivo al selector de SystemNav)
    const { industry } = useIndustryStore();

    return getLabels(industry as IndustryType);
}
