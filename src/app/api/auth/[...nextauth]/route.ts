import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
export const runtime = 'nodejs';

console.log("🚀 [API_AUTH_ROUTE] Initialized in Vercel Nodejs Runtime");
