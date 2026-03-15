# Security Policy

## Supported Versions

Security fixes are provided for the latest state of the `main` branch.
Older commits, forks, and heavily modified self-hosted deployments are not guaranteed to receive backported fixes.

## Reporting a Vulnerability

Please do not open public GitHub issues for security vulnerabilities.

Use one of these private channels:

- Email: `support@echtjetztki.at`
- Subject prefix: `[SECURITY]`

Please include:

- A short description of the issue and impact
- Reproduction steps (with minimal data)
- Affected endpoint, file, or component
- Suggested fix (optional)

## Response Targets

- Initial response: within 72 hours
- Triage and severity assessment: within 7 days
- Fix timeline: depends on severity and complexity

## Disclosure Process

1. We confirm receipt and severity.
2. We work on a fix and validate it.
3. We coordinate disclosure timing with the reporter.
4. We publish the fix and credit the reporter (if desired).

## Security Baseline for Deployments

- Never commit secrets (DB URLs, API keys, webhook secrets, tokens).
- Use environment variables only (`.env.local` for local, platform secrets in production).
- Rotate exposed credentials immediately.
- Keep demo mode read-only where possible.
- Keep Supabase RLS enabled and maintain explicit policies.
- Restrict cron endpoints with `CRON_SECRET`.

## Out of Scope

- Vulnerabilities in third-party providers outside this repository (unless caused by this project's misuse)
- Denial-of-service traffic without a reproducible application-level flaw
- Reports that require physical access to unmanaged infrastructure
