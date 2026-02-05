import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { TranslationService } from '../lib/translation-service';

export default getRequestConfig(async () => {
    // Intentar leer el locale de las cookies o usar 'es' por defecto
    const cookieStore = await cookies();
    const requestedLocale = cookieStore.get('NEXT_LOCALE')?.value || 'es';

    // Validar locales soportados (los que tienen archivo .json en /messages)
    const supportedLocales = ['es', 'en'];
    const locale = (supportedLocales.includes(requestedLocale) ? requestedLocale : 'es') as 'es' | 'en';

    // Carga dinámica desde TranslationService (Fase 62)
    const messages = await TranslationService.getMessages(locale);

    return {
        locale,
        messages
    };
});
