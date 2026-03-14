import { NextResponse } from 'next/server';
import { DEFAULT_AGENT_OPTIONS } from '@/lib/agent-options';
import { getAgentOptions } from '@/lib/users';

export async function GET() {
    try {
        const agents = await getAgentOptions();
        const usingDefaultFallback =
            agents.length === DEFAULT_AGENT_OPTIONS.length &&
            agents.every((name, idx) => name === DEFAULT_AGENT_OPTIONS[idx]);

        return NextResponse.json({
            success: true,
            agents,
            source: usingDefaultFallback ? 'default' : 'database',
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
            success: true,
            agents: [...DEFAULT_AGENT_OPTIONS],
            source: 'fallback',
            warning: message,
        });
    }
}
