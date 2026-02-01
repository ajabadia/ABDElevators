import { handlers } from "@/lib/auth";

console.log("🚀🚀🚀 [AUTH_API] CATCH-ALL ROUTE LOADED 🚀🚀🚀");
console.log("📍 [AUTH_API] URL:", {
    runtime: process.env.NEXT_RUNTIME,
    env: process.env.NODE_ENV
});

export const { GET, POST } = handlers;
// Let's stick to nodejs first but with extreme logs
export const runtime = 'nodejs';
