import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { blockDemoWrites, requireSessionUser } from '@/lib/access';

export async function GET() {
    try {
        const access = await requireSessionUser();
        if (!access.ok) {
            return access.response;
        }

        const result = await query(
            'SELECT id, question, answer, created_at FROM agent_chats ORDER BY created_at DESC LIMIT 50'
        );
        return NextResponse.json(result.rows);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error fetching chats:', message);
        return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const access = await requireSessionUser();
        if (!access.ok) {
            return access.response;
        }

        const demoWriteBlock = blockDemoWrites();
        if (demoWriteBlock) {
            return demoWriteBlock;
        }

        const { question, provider = 'mistral' } = await req.json();

        if (!question) {
            return NextResponse.json({ error: 'Question is required' }, { status: 400 });
        }

        const systemPrompt = "Du bist Isabella Morgenstern, eine professionelle und höfliche Immobilien-Expertin. Beantworte Kundenanfragen direkt in ihrem Namen. WICHTIG: Erwähne niemals eine Firma, das Impressum oder rechtliche Hinweise. Der Tonfall sollte persönlich, kompetent und serviceorientiert sein.";
        let answer = "";

        if (provider === 'gemini') {
            const geminiApiKey = process.env.GEMINI_API_KEY;
            if (!geminiApiKey) {
                return NextResponse.json({ error: 'Gemini API Key is not configured in Vercel settings.' }, { status: 500 });
            }

            const genAI = new GoogleGenerativeAI(geminiApiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

            const result = await model.generateContent(`${systemPrompt}\n\nFrage: ${question}`);
            const response = await result.response;
            answer = response.text();
        } else {
            // Default Mistral
            const mistralApiKey = process.env.MISTRAL_API_KEY;
            if (!mistralApiKey) {
                return NextResponse.json({ error: 'Mistral API Key is not configured in Vercel settings.' }, { status: 500 });
            }

            const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mistralApiKey}`
                },
                body: JSON.stringify({
                    model: 'mistral-small-latest',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: question }
                    ]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Mistral API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            answer = data.choices[0].message.content;
        }

        // Save to DB
        const insertResult = await query(
            'INSERT INTO agent_chats (question, answer) VALUES ($1, $2) RETURNING id, created_at',
            [question, answer]
        );

        return NextResponse.json({
            id: insertResult.rows[0].id,
            question,
            answer,
            created_at: insertResult.rows[0].created_at
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const stack = error instanceof Error ? error.stack : undefined;
        const cause = error instanceof Error ? error.cause : undefined;
        console.error('Chat AI Error Detail:', {
            message,
            stack,
            cause
        });
        return NextResponse.json({
            error: 'Fehler bei der Kommunikation mit der KI',
            details: message
        }, { status: 500 });
    }
}
