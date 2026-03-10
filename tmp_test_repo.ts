import { TranslationRepository } from './src/services/core/translation/TranslationRepository';

async function test() {
    try {
        const res = await TranslationRepository.findMessages('es', 'platform_master');
        console.log('Result type:', typeof res);
        console.log('Is array:', Array.isArray(res));
        console.log('Length:', (res as any).length);
        if (!(Array.isArray(res))) {
            console.log('Constructor:', (res as any).constructor.name);
        }
    } catch (e) {
        console.error('Test error:', e);
    }
}

test();
