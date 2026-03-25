import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { resolveInstallContext, hasActiveLicenseForRequest } from '@/lib/license';

export async function GET(request: Request) {
    try {
        const context = resolveInstallContext(request);
        const active = await hasActiveLicenseForRequest(request);

        const installations = await query(
            `SELECT li.id, li.install_host, li.install_path, li.last_verified_at, lk.max_installations
             FROM license_installations li
             JOIN license_keys lk ON lk.id = li.license_key_id
             WHERE li.is_active = TRUE AND lk.is_active = TRUE
             ORDER BY li.last_verified_at DESC`
        );

        const currentInstall = installations.rows.find(
            (r: any) => r.install_host === context.host && (r.install_path === context.path || r.install_path === '/')
        );

        return NextResponse.json({
            active,
            host: context.host,
            path: context.path,
            installations: installations.rowCount,
            max_installations: installations.rows[0]?.max_installations ?? null,
            installations_list: installations.rows.map((r: any) => ({
                id: r.id,
                host: r.install_host,
                path: r.install_path,
                last_verified_at: r.last_verified_at
            }))
        });
    } catch (error) {
        console.error('License status API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
