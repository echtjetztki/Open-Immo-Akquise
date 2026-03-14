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
5. Ohne gueltige Basis-Freischaltung blockt `/api/login` den Login, ausser es werden gueltige Demo-Credentials verwendet.

## Wichtige Regeln

- Basis-Code niemals als Klartext in Git.
- Nur SHA-256 Hash in `BASIC_LICENSE_HASH`.
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
- `BASIC_LICENSE_HASH` gesetzt
- `NEXT_PUBLIC_DEMO_SIGNUP_URL` gesetzt
- `NEXT_PUBLIC_LICENSE_SIGNUP_URL` gesetzt

Effekt:
- Benutzer sieht zuerst Funnel/Code-Flow.
- Nach Freischaltung sind normale Team/Admin Logins moeglich.

## Verhalten "Demo Login soll immer funktionieren"

Das ist bereits beruecksichtigt:
- Wenn ein Login mit gueltigen Demo-Credentials erkannt wird, kann dieser den Lizenz-Block umgehen.
- Damit koennen Demo-Daten auch vor Basis-Code-Freischaltung funktionieren.
