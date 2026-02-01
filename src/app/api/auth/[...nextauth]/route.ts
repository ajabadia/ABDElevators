import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";
export const runtime = 'nodejs';

export const GET = (req: NextRequest) => {
    console.log("🔥 [AUTH ROUTE] GET Request for:", req.nextUrl.pathname);
    return handlers.GET(req);
};

export const POST = (req: NextRequest) => {
    console.log("🔥 [AUTH ROUTE] POST Request for:", req.nextUrl.pathname);
    return handlers.POST(req);
};
