/**
 * Centralized i18n configuration.
 * Safe to import from 'use client' components (no Node.js APIs).
 */
export const SUPPORTED_LOCALES = ['es', 'en'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];
export const DEFAULT_LOCALE: SupportedLocale = 'es';
