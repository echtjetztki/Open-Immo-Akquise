# Setup (Local + Vercel)

## Voraussetzungen

- Node.js 20+
- npm 10+
- Supabase Projekt mit PostgreSQL
- Vercel Projekt (fuer Cloud Deployment)

## Lokales Setup

1. Abhaengigkeiten installieren:

```bash
npm install
```

2. ENV Datei vorbereiten:

```bash
cp .env.example .env.local
```

3. Datenbank initialisieren:

- In Supabase SQL Editor den Inhalt von `SUPABASE_MASTER_SETUP.sql` ausfuehren.

4. Entwicklungsserver starten:

```bash
npm run dev
```

5. Produktions-Build lokal pruefen:

```bash
npm run build
npm run start
```

## Vercel Setup

1. Repository in Vercel importieren.
2. Alle benoetigten ENV Variablen in `Project Settings > Environment Variables` setzen.
3. Deploy starten.

## Datenbank-URL Hinweise

- Bevorzugt `SUPABASE_DATABASE_URL` nutzen.
- Alternativ wird `SUPABASE_DB_URL` als Alias akzeptiert.
- Die App erzwingt automatisch `sslmode=require`, falls im Connection String nicht gesetzt.

## Empfehlung fuer Supabase Pooler

- Fuer App-Traffic den Pooler-Port `6543` nutzen.
- Fuer Migrationen/SQL meist direkte Verbindung (`5432`) verwenden.
- Bei Pooler muss der Username dem Muster `postgres.<project-ref>` folgen.
