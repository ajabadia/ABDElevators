import Handlebars from 'handlebars';
import { TenantService } from '@/services/tenant/tenant-service'; // We'll update this import later when tenant-service moves
import { logEvento } from '@/lib/logger';

export interface BrandingData {
    branding_logo: string;
    branding_primary_color: string;
    branding_accent_color: string;
    company_name: string;
}

export class NotificationTemplateService {
    /**
     * Resolves branding data for a specific tenant.
     */
    static async getBrandingData(tenantId: string): Promise<BrandingData> {
        try {
            const tenantConfig = await TenantService.getConfig(tenantId);
            const branding = tenantConfig?.branding;

            return {
                branding_logo: branding?.documentLogo?.url || branding?.logo?.url || '',
                branding_primary_color: branding?.colors?.primary || '#0f172a',
                branding_accent_color: branding?.colors?.accent || '#3b82f6',
                company_name: (tenantConfig as any)?.name || branding?.companyName || 'ABD RAG Platform'
            };
        } catch (err) {
            console.error(`[NotificationTemplateService] Error fetching tenant branding:`, err);
            return {
                branding_logo: '',
                branding_primary_color: '#0f172a',
                branding_accent_color: '#3b82f6',
                company_name: 'ABD RAG Platform'
            };
        }
    }

    /**
     * Compiles a template with data using Handlebars.
     */
    static compile(templateStr: string, data: any): string {
        try {
            const compiled = Handlebars.compile(templateStr);
            return compiled(data);
        } catch (error: any) {
            console.error('[NotificationTemplateService] Compilation error:', error);
            // Fallback: return the template or a safe subset if possible
            return templateStr;
        }
    }
}
