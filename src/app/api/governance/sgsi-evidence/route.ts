import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';
import { SGSIService } from '@/services/security/SGSIService';
import fs from 'fs';
import path from 'path';

const REPORTS_DIR = path.join(process.cwd(), 'security', 'records', 'evidence-reports');

/**
 * 🛡️ SGSI Evidence API
 * GET: List available reports or download a specific file.
 * POST: Trigger new report generation.
 */
export async function GET(req: NextRequest) {
    try {
        await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

        const { searchParams } = new URL(req.url);
        const download = searchParams.get('download');

        // Handle File Download
        if (download) {
            const filePath = path.join(REPORTS_DIR, download);
            if (!fs.existsSync(filePath)) {
                return NextResponse.json({ error: 'File not found' }, { status: 404 });
            }

            const fileBuffer = fs.readFileSync(filePath);
            const contentType = download.endsWith('.pdf') ? 'application/pdf' : 'text/markdown';
            
            return new Response(fileBuffer, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': `attachment; filename="${download}"`
                }
            });
        }

        // List Reports
        const reports = await SGSIService.listReports();
        return NextResponse.json(reports);
    } catch (error) {
        return NextResponse.json({ error: 'Unauthorized or Internal Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
        
        const { year, month } = await req.json();
        
        if (!year || !month) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const result = await SGSIService.generateMonthlyEvidence(year, month);
        
        return NextResponse.json({ 
            success: true, 
            message: 'Reporte certificado generado correctamente',
            mdFile: path.basename(result.mdPath),
            pdfFile: path.basename(result.pdfPath)
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
