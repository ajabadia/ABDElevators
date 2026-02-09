
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        success: true,
        message: "GET works! This route is reachable."
    });
}

export async function POST() {
    return NextResponse.json({
        success: true,
        message: "POST works! middleware allowed body."
    });
}
