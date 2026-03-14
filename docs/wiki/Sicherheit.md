# Sicherheit

## Grundregeln

- Keine Tokens, Passwoerter oder DB-URLs in Git.
- Nur `.env.local` (lokal) und Vercel Environment Variables verwenden.
- Geleakte Keys sofort rotieren (Supabase, Vercel, Webhooks, API Keys).

## Repository-Hygiene

- `test_db_diagnostic.js` bleibt lokal und darf nicht ins Remote.
- `.gitignore` muss solche lokalen Diagnose-Dateien ausschliessen.
- Vor jedem Push Secrets scannen:

```bash
rg -n "postgresql://|SUPABASE|API_KEY|TOKEN|PASSWORD|SECRET|vcp_" .
```

## Passwort-Sicherheit

- Passwoerter werden mit `scrypt` gehasht.
- Legacy-Klartextwerte werden beim erfolgreichen Login automatisch auf Hash migriert.

## Session und Cookies

- Session-Cookies sind `httpOnly`.
- `secure` ist in Produktion aktiv.
- Basis-Lizenz-Cookie (`basic_license_verified`) wird serverseitig gesetzt.

## Demo-Schutz

- Read-only Schutz serverseitig via `blockDemoWrites()`.
- Frontend-Hinweis via `NEXT_PUBLIC_DEMO_READ_ONLY`.
- Keine dauerhafte Freischaltung in Klartext speichern.

## Webhook und Monitoring

- Security Events koennen an `SECURITY_WEBHOOK_URL` gesendet werden.
- Test-Webhook separat ueber `SECURITY_WEBHOOK_TEST_URL`.

## Empfehlung fuer Open-Source Repo

- Keine echten Demo-Zugangsdaten in README, Wiki oder Code.
- Onboarding ueber Formular/Funnel und Versand per E-Mail.
- Commit-Historie regelmaessig auf Secrets pruefen.
