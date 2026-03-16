import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DEFAULT_AGENT_OPTIONS } from '@/lib/agent-options';
import { getAgentOptions } from '@/lib/users';
import { checkActiveLicenseForRequest } from '@/lib/license';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const hasLicenseCookie = cookieStore.get('basic_license_verified')?.value === '1';
        let basicLicenseVerified = hasLicenseCookie;

        if (!basicLicenseVerified) {
            try {
                const state = await checkActiveLicenseForRequest(request);
                basicLicenseVerified = state.active;
            } catch {
                basicLicenseVerified = false;
            }
        }

        if (!basicLicenseVerified) {
            return NextResponse.json({
                success: true,
                agents: [...DEFAULT_AGENT_OPTIONS],
                source: 'locked',
            });
        }

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
