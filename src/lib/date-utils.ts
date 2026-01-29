import { format as fnsFormat, formatDistanceToNow as fnsFormatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formato estándar de fecha corta: 28/01/2026
 */
export function formatDate(date: Date | string | number): string {
    return fnsFormat(new Date(date), 'dd/MM/yyyy', { locale: es });
}

/**
 * Formato estándar de fecha y hora: 28 ene, 21:00
 */
export function formatDateTime(date: Date | string | number): string {
    return fnsFormat(new Date(date), "d MMM, HH:mm", { locale: es });
}

/**
 * Formato largo para cabeceras o detalles: miércoles, 28 de enero de 2026
 */
export function formatDateLong(date: Date | string | number): string {
    return fnsFormat(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
}

/**
 * Formato relativo (hace x minutos, hace 2 días)
 */
export function formatRelative(date: Date | string | number): string {
    return fnsFormatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

/**
 * Formato para logs o tablas compactas: 28/01 21:00:45
 */
export function formatLogDate(date: Date | string | number): string {
    return fnsFormat(new Date(date), 'dd/MM HH:mm:ss', { locale: es });
}
