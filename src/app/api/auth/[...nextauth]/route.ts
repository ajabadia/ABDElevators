import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    console.log("🚀 [API_AUTH] GET Request:", req.nextUrl.pathname);
    return handlers.GET(req);
}

export async function POST(req: NextRequest) {
    console.log("🚀 [API_AUTH] POST Request:", req.nextUrl.pathname);
    return handlers.POST(req);
}
