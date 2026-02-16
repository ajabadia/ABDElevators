
import { NextResponse } from 'next/server';
import { TranslationService } from '@/lib/translation-service';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const key = 'admin.knowledge.actions.upload';
        const locale = 'es';

        // 1. Get Detailed Messages (Admin Table view)
        const detailed = await TranslationService.getDetailedMessages(locale, 'platform_master');
        const detailedEntry = detailed[key];

        // 2. Get App Messages (User view - via Redis/Merge)
        const appMessages = await TranslationService.getMessages(locale, 'platform_master');
        const flatApp = TranslationService.nestToFlat(appMessages);
        const appEntry = flatApp[key];

        // 3. Raw Local Load
        // We can't easily access the private method, but we can infer from detailedEntry.source

        return NextResponse.json({
            key,
            locale,
            detailedView: detailedEntry,
            appView: appEntry,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
