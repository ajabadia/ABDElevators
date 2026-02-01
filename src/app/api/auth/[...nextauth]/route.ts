import { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";

export const runtime = 'nodejs'; // Force Node.js runtime for Bcrypt/Mongo compatibility

const { GET: AuthGET, POST: AuthPOST } = handlers;

export async function GET(request: NextRequest) {
    // console.log("🔥 [API/AUTH] GET Request:", request.url);
    return AuthGET(request);
}

export async function POST(request: NextRequest) {
    // console.log("🔥 [API/AUTH] POST Request:", request.url);
    return AuthPOST(request);
}
