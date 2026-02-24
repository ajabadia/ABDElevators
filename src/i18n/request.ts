import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { TranslationService } from '@/services/core/translation-service';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n-config';

export default getRequestConfig(async () => {
    // Intentar leer el locale de las cookies o usar DEFAULT_LOCALE por defecto
    const cookieStore = await cookies();
    const requestedLocale = cookieStore.get('NEXT_LOCALE')?.value || DEFAULT_LOCALE;

    // Validar locales soportados (los que están en SUPPORTED_LOCALES)
    const locale = (SUPPORTED_LOCALES.includes(requestedLocale as any)
        ? requestedLocale
        : DEFAULT_LOCALE) as typeof SUPPORTED_LOCALES[number];

    // Carga dinámica desde TranslationService (Fase 62)
    const messages = await TranslationService.getMessages(locale);

    return {
        locale,
        messages
    };
});
