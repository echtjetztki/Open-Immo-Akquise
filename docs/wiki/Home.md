# Open-Akquise Wiki

Diese Wiki ist die technische Referenz fuer Self-Hosting, Demo-Betrieb, Security und Support.

## Inhalt

- [Setup (Local + Vercel)](Setup.md)
- [Umgebungsvariablen](Umgebungsvariablen.md)
- [Demo und Basis-Lizenz](Demo-und-Basis-Lizenz.md)
- [Sicherheit](Sicherheit.md)
- [API Uebersicht](API-Uebersicht.md)
- [Troubleshooting](Troubleshooting.md)

## Schnellstart

1. Repository klonen und `npm install` ausfuehren.
2. `.env.example` nach `.env.local` kopieren und Werte setzen.
3. `SUPABASE_MASTER_SETUP.sql` in Supabase SQL Editor ausfuehren.
4. `npm run dev` starten.
5. Erstlogin mit `ADMIN_PASSWORD` oder `USER_PASSWORD`.

## Zielbild

- Open Source, self-hostbar ohne proprietaere Abhaengigkeit.
- Keine Secrets im Git-Repository.
- Oeffentliche Demo optional als read-only und lizenzgesteuert.

## Bestehende Guides im Repo

- `MEIN_SETUP_GUIDE.md`
- `DATABASE-UPDATE-ANLEITUNG.md`
- `USER-DASHBOARD-ANLEITUNG.md`
- `GOOGLE-PLAY-ANLEITUNG.md`
