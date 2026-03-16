# API Uebersicht

## Authentifizierung

- `POST /api/login`  
  Team/Admin/Agent Login, setzt Session-Cookies.

- `POST /api/login/logout`  
  Session beenden.

- `GET /api/user/me`  
  Aktuellen Session-User lesen.

- `POST /api/user/change-password`  
  Passwort fuer eingeloggten User aendern.

## Lizenz und Sicherheit

- `POST /api/license/verify-basic`  
  Basis-Code pruefen, setzt `basic_license_verified` Cookie.

- `POST /api/settings/test-security-webhook`  
  Testet Security Webhook (Admin only).

- `GET /api/settings/verify-n8n-key`  
  Prueft, ob die aktuelle Installation bereits fuer n8n aktiviert ist.

- `POST /api/settings/verify-n8n-key`  
  Prueft n8n Aktivierungscode serverseitig gegen Supabase und registriert die Installation einmalig.

## Properties

- `GET /api/properties`  
  Liste laden.

- `POST /api/properties`  
  Property anlegen (in read-only Demo blockiert).

- `GET /api/properties/[id]`  
  Detail laden.

- `PATCH /api/properties/[id]`  
  Property aktualisieren.

- `DELETE /api/properties/[id]`  
  Property loeschen.

- `PATCH /api/properties/[id]/status`  
  Nur Status updaten.

- `GET|POST /api/properties/[id]/notes`  
  Notizen lesen/schreiben.

## Dashboard und Reporting

- `GET /api/stats`  
  Kennzahlen fuer Dashboard.

- `GET /api/report`  
  Report-Daten.

- `POST /api/chat`  
  KI Assistent (Gemini/Mistral).

## CRM

- `GET|POST /api/crm/articles`  
  CRM Artikel.

- `GET|POST /api/crm/invoices`  
  CRM Rechnungen.

- `POST /api/settings/init-crm-db`  
  CRM Tabellen initialisieren.

## Admin und Betrieb

- `GET|POST /api/admin/users`  
  User-Management (Admin).

- `GET /api/agents`  
  Agent-Liste.

- `GET /api/settings/test-db`  
  Datenbank-Diagnose.

- `GET /api/settings/test-supabase`  
  Supabase API-Test.

- `GET /api/health`  
  Healthcheck.

- `GET /api/diagnostic`  
  Erweiterte Diagnose (inkl. ENV Indikatoren).

## Cron

- `POST /api/cron/cleanup`  
  Optionales Reset/Cleanup fuer Demo.

- `POST /api/cron/sync-locations`  
  Standort-Sync.

## Hinweis zu Rollen

Viele Endpunkte pruefen Session und Rollen (`admin`, `user`, `agent`) serverseitig.
In read-only Demo werden schreibende Endpunkte zusaetzlich blockiert.
