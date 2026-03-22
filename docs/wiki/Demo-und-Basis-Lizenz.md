# Demo und Basis-Lizenz

## Ziel

- Public Demo anbieten, ohne Klartext-Credentials im Repository.
- Erstzugriff ueber Funnel steuern.
- Optional read-only Demo aktivieren.

## Login-Flow im Projekt

1. Login-Seite zeigt ein "Kostenlos starten" Modal.
2. Zwei CTA-Links:
   - Basis Lizenz anfordern (kostenlos)
   - Demo Daten anfordern (kostenlos)
3. Optionaler Code-Check ueber `/api/license/verify-basic`.
4. Bei Erfolg setzt der Server Cookie `basic_license_verified=1`.
5. Ohne gueltige Basis-Freischaltung blockt `/api/login` den Login.

## Wichtige Regeln

- Basis-Code niemals als Klartext in Git.
- Basis-Code serverseitig nur ueber Supabase pruefen (`license_keys` / `license_installations`).
- Demo-Passwoerter nur in Environment Variables oder in der Datenbank.
- Keine Demo-Credentials im README oeffentlich posten.

## Typische Demo-Setups

### Setup A: Oeffentliche Read-Only Demo

- `DEMO_READ_ONLY=true`
- `NEXT_PUBLIC_DEMO_READ_ONLY=true`
- Optional: `DEMO_CREDENTIALS_ONLY=true`

Effekt:
- Schreibende API-Endpunkte geben `403` mit `DEMO_READ_ONLY` zurueck.
- UI blendet Schreibaktionen aus.

### Setup B: Funnel + Code + Normale Datenbank-Logins

- `DEMO_READ_ONLY=false`
- `DEMO_CREDENTIALS_ONLY=false`
- Lizenzcodes in Supabase gepflegt (`license_keys`)
- `NEXT_PUBLIC_DEMO_SIGNUP_URL` gesetzt
- `NEXT_PUBLIC_LICENSE_SIGNUP_URL` gesetzt

Effekt:
- Benutzer sieht zuerst Funnel/Code-Flow.
- Nach Freischaltung sind normale Team/Admin Logins moeglich.

## Optionaler Demo-Bypass

Standard ist `LICENSE_ALLOW_DEMO_BYPASS=false`.
Nur wenn explizit gesetzt, koennen Demo-Credentials den Lizenz-Block umgehen.
