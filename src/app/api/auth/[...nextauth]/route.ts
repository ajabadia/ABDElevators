import { handlers } from "@/lib/auth";

console.log("🚀 [API_AUTH_ROUTE] LOADING catch-all handler");
console.log("🚀 [API_AUTH_ROUTE] ENV Check:", {
    runtime: process.env.NEXT_RUNTIME || 'unknown',
    vercel: !!process.env.VERCEL,
    hasHandlers: !!handlers
});

export const { GET, POST } = handlers;
export const runtime = 'nodejs';
