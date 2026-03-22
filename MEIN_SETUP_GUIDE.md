# Anleitung: Account-Erstellung (Vercel & Supabase)

Hier ist die detaillierte Anleitung fuer dich, wie du die Konten fuer deine Kunden oder dich selbst anlegst.

---

## 1. Supabase (Datenbank)

1. **Registrierung:** Gehe auf [Supabase.com](https://supabase.com). Waehle "Start your project" und melde dich am besten direkt mit deinem **GitHub-Account** an.
2. **Neues Projekt:**
   - Klicke auf "New Project".
   - Waehle deine Organisation aus.
   - **Name:** Gib dem Projekt einen Namen (z. B. `Agentur-Dashboard-KundeXY`).
   - **Database Password:** Generiere ein sicheres Passwort und speichere es dir gut ab.
   - **Region:** Waehle `Central Europe (Frankfurt)` fuer die beste Performance in Europa.
   - **Pricing Plan:** Der "Free Plan" reicht fuer den Anfang voellig aus.
3. **Datenbank-Tabellen (SQL Editor):**
   - Klicke links im Menue auf das SQL-Symbol (**SQL Editor**).
   - Waehle "New Query".
   - Kopiere den Inhalt deiner Schema- oder Migrations-Dateien hinein und klicke auf **Run**.
4. **API- und DB-Daten finden:**
   - Gehe unten links auf das Zahnrad (**Project Settings**).
   - Unter **API** findest du die `Project URL` und den `anon public` Key.
   - Unter **Database** findest du die serverseitige Postgres-Connection-String fuer `SUPABASE_DATABASE_URL`.

---

## 2. Vercel (Web-Hosting)

1. **Registrierung:** Gehe auf [Vercel.com](https://vercel.com) und waehle "Sign Up". Nutze auch hier am besten GitHub.
2. **Projekt importieren:**
   - Klicke im Dashboard auf "Add New" -> "Project".
   - Verbinde dein GitHub-Konto, falls noch nicht geschehen.
   - Suche das Repository `Open-Immo-Akquise` und klicke auf **Import**.
3. **Umgebungsvariablen (VITAL):**
   - Bevor du auf "Deploy" klickst, oeffne **Environment Variables**.
   - Fuge folgende Variablen hinzu:
     - `SUPABASE_DATABASE_URL`: Deine Postgres Connection String aus Supabase
     - `NEXT_PUBLIC_SUPABASE_URL`: Deine Supabase Project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Dein Supabase Anon Key
     - `ADMIN_PASSWORD`: Initiales Admin-Passwort
     - `USER_PASSWORD`: Optionales Fallback-Passwort fuer Team-/Agent-Logins
4. **Deployment:**
   - Klicke auf **Deploy**.
   - Warte ca. 1-2 Minuten. Sobald die Seite fertig gebaut ist, ist sie unter der angezeigten `.vercel.app`-Domain erreichbar.

---

## Profi-Tipp fuer den 250-EUR-Service

Wenn du das fuer Kunden machst, kannst du in Vercel unter "Settings" -> "Domains" auch die eigene Domain des Kunden (z. B. `dashboard.kunde.de`) aufschalten.
