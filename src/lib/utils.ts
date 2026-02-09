import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Escapes a string for use in a regular expression.
 * Used to prevent ReDoS and Regex Injection attacks.
 */
export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generates a standard UUID v4.
 */
export function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Formats a date to a readable string (es-ES).
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
}
