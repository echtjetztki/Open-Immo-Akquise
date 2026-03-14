# Umgebungsvariablen

Diese Variablen werden im Projekt verwendet. Keine echten Werte in Git committen.

## Pflichtvariablen

| Variable | Zweck |
| --- | --- |
| `SUPABASE_DATABASE_URL` | Haupt-PostgreSQL Verbindung zur App-DB |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Projekt-URL fuer REST/Client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key |
| `ADMIN_PASSWORD` | Legacy Admin Login (Fallback) |
| `USER_PASSWORD` | Legacy User/Agent Login (Fallback) |

Hinweis: `SUPABASE_DB_URL` wird als Alias fuer `SUPABASE_DATABASE_URL` akzeptiert.

## Login und Demo

| Variable | Zweck |
| --- | --- |
| `DEMO_READ_ONLY` | API-Schreibzugriffe fuer Demo sperren |
| `NEXT_PUBLIC_DEMO_READ_ONLY` | Schreibaktionen im UI ausblenden |
| `DEMO_CREDENTIALS_ONLY` | Nur Demo-Credentials erlauben |
| `DEMO_ADMIN_PASSWORD` | Demo Admin Passwort |
| `DEMO_USER_PASSWORD` | Demo User/Agent Passwort |
| `BASIC_LICENSE_HASH` | SHA-256 Hash fuer Basis-Code-Pruefung |
| `NEXT_PUBLIC_DEMO_SIGNUP_URL` | URL fuer "Demo kostenlos anfordern" |
| `NEXT_PUBLIC_LICENSE_SIGNUP_URL` | URL fuer "Basis Lizenz anfordern" |

## Security und Monitoring

| Variable | Zweck |
| --- | --- |
| `SECURITY_WEBHOOK_URL` | Live Security Events (serverseitig) |
| `SECURITY_WEBHOOK_TEST_URL` | Test Webhook fuer Einstellungen |
| `NEXT_PUBLIC_SECURITY_WEBHOOK_URL` | Optional sichtbare URL im Admin UI |
| `NEXT_PUBLIC_SECURITY_WEBHOOK_TEST_URL` | Optional sichtbare Test-URL im Admin UI |
| `CRON_SECRET` | Schutz fuer Cron-Endpunkte |
| `N8N_ACTIVATION_HASH` | SHA-256 Hash fuer n8n Aktivierung |

## AI und Integrationen

| Variable | Zweck |
| --- | --- |
| `GEMINI_API_KEY` | Gemini Chat Integration |
| `MISTRAL_API_KEY` | Mistral Chat Integration |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API |
| `TELEGRAM_CHAT_ID` | Ziel-Chat fuer Telegram Meldungen |

## Sonstige Variablen

| Variable | Zweck |
| --- | --- |
| `DEFAULT_ADMIN_USERNAME` | Optionaler Default Admin Name |
| `DEFAULT_ADMIN_PASSWORD` | Optionales Alias/Fallback fuer Admin Login |
| `NEXT_PUBLIC_SITE_URL` | Basis-URL fuer Sitemap |
| `NEXT_PUBLIC_GA_ID` | Optional Google Analytics ID |

## Hash fuer Basis-Lizenz erzeugen (PowerShell)

```powershell
$code = "DEIN_BASIS_CODE"
$sha = [System.Security.Cryptography.SHA256]::Create()
$bytes = [System.Text.Encoding]::UTF8.GetBytes($code)
($sha.ComputeHash($bytes) | ForEach-Object { $_.ToString("x2") }) -join ""
```

Den erzeugten Hash in `BASIC_LICENSE_HASH` eintragen, nicht den Klartext-Code.
