import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DEMO_DOCUMENTS } from '@/lib/demo-data';
import { PromptService } from '@/services/llm/prompt-service';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        // 1. Rate Limiting (Strict by IP)
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success, reset } = await checkRateLimit(ip, LIMITS.SANDBOX);

        if (!success) {
            return NextResponse.json(
                { error: "Too many requests. This is a public demo with strict limits." },
                {
                    status: 429,
                    headers: { "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString() }
                }
            );
        }

        const body = await req.json();
        const { message, previousMessages = [] } = body;

        if (!message) {
            return NextResponse.json({ error: "Message required" }, { status: 400 });
        }

        const contextText = DEMO_DOCUMENTS.map(doc =>
            `--- DOCUMENT: ${doc.title} (${doc.type}) ---\n${doc.content}\n`
        ).join('\n');

        const { text: systemPrompt, model: modelId } = await PromptService.getRenderedPrompt(
            'SANDBOX_CHAT_GENERATOR',
            { context: contextText, question: message },
            'abd_global' // Sandbox is global
        );

        // 3. Call LLM
        const model = genAI.getGenerativeModel({ model: modelId });

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am ready to answer questions based strictly on the provided demo documents." }],
                },
                // Map previous simple messages if any (limit to last 4 for context)
                ...previousMessages.slice(-4).map((m: any) => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }]
                }))
            ],
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.3,
            },
        });

        const result = await chat.sendMessage(message);
        const response = result.response.text();

        return NextResponse.json({
            response,
            sources: DEMO_DOCUMENTS.map(d => ({ title: d.title, type: d.type }))
        });

    } catch (error: any) {
        console.error("[SANDBOX_ERROR]", error);
        return NextResponse.json(
            { error: "Demo service unavailable. Please try again later." },
            { status: 500 }
        );
    }
}
