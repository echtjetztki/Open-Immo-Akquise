# Troubleshooting

## Build Error: `Can't resolve '@/lib/public-demo-mode'`

Ursache:
- Import ist im Code vorhanden, Datei aber nicht im Git-Commit.

Loesung:
1. Pruefen, ob `lib/public-demo-mode.ts` existiert.
2. Datei committen und pushen.
3. Deployment neu starten.

## Fehler: `self-signed certificate in certificate chain`

Kontext:
- Tritt oft bei falscher Supabase-Verbindungs-URL oder TLS-Handling auf.

Checks:
1. `SUPABASE_DATABASE_URL` korrekt gesetzt?
2. Pooler-URL fuer App (`6543`) verwendet?
3. Username-Format korrekt (`postgres.<project-ref>`)?
4. `sslmode=require` aktiv?

Hinweis:
- Das Projekt ergaenzt `sslmode=require` automatisch, wenn es fehlt.

## Hydration Mismatch in Browser Console

Symptome:
- Meldungen zu Attributen wie `data-np-intersection-state` oder `fdprocessedid`.

Ursache:
- Haeufig Browser-Erweiterungen, die HTML vor React-Hydration manipulieren.

Loesung:
1. Seite im Inkognito-Fenster testen.
2. Erweiterungen deaktivieren (z. B. Passwortmanager/Form-Tools).
3. Danach erneut pruefen.

## Login blockiert mit `Bitte zuerst Basis-Lizenz-Code aktivieren`

Checks:
1. Wurde `/api/license/verify-basic` erfolgreich ausgefuehrt?
2. Ist Cookie `basic_license_verified` gesetzt?
3. Ist `BASIC_LICENSE_HASH` korrekt gesetzt?

Hinweis:
- Gueltige Demo-Credentials koennen den Lizenz-Block umgehen.

## Vercel Deployment blockiert wegen Author

Meldung:
- Commit Author hat keine Contributing-Rechte im Vercel Team.

Loesung:
1. Git Author auf erlaubtes Konto setzen:
   - `git config user.name "..."`
   - `git config user.email "..."`
2. Erneut committen/pushen.
3. Oder Vercel Team/Plan anpassen.

## Datenbank-Verbindung testet lokal, aber nicht auf Vercel

Checks:
1. ENV Variablen in Vercel fuer `production` gesetzt?
2. Richtiges Projekt/Team in Vercel aktiv?
3. Keine alten Variablen (`SUPABASE_DB_URL` vs `SUPABASE_DATABASE_URL`) gleichzeitig mit falschen Werten?
4. Test ueber `/api/health` und `/api/settings/test-db`.
