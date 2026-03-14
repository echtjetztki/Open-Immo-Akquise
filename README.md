<p align="center">
  <img src="public/logo.png" width="160" alt="Open-Akquise Logo">
</p>

# 🏠 Open-Akquise | Das Immobilien-Leitstand Dashboard

**Die professionelle All-in-One Lösung für moderne Immobilienmakler, Teams und Agenturen.**

Open-Akquise ist ein hochperformantes Dashboard zur Steuerung von Immobilien-Leads, Objektverwaltung und Team-Reporting. Es wurde speziell entwickelt, um den Akquise-Prozess zu digitalisieren und als skalierbare Dienstleistung für Kunden angeboten zu werden.

---

## Wiki

Die technische Dokumentation findest du hier:

- [Wiki Startseite](docs/wiki/Home.md)

<p align="center">
  <a href="https://open-immo-akquise.vercel.app/" target="_blank">
    <strong>✨ JETZT LIVE-DEMO TESTEN</strong>
  </a>
  <br />
  <small>🔒 Demo-Zugangsdaten werden nicht öffentlich angezeigt.</small>
  <br />
  <small>📧 Demo-Login und Zugangsdaten erhältst du per E-Mail nach Anfrage.</small>
  <br />
  <a href="https://echtjetztki.at/open-immo/" target="_blank">
    <strong>🆓 BASIS-LIZENZ KOSTENLOS ANFORDERN</strong>
  </a>
  <br />
  <a href="https://echtjetztki.at/open-immo/" target="_blank">
    <strong>🆓 DEMO KOSTENLOS ANFORDERN</strong>
  </a>
</p>

---

## 🚀 Warum Open-Akquise?

Dieses System ist nicht bloß Code – es ist ein **fertiges Geschäftsmodell**. Makler und Agenturen benötigen strukturierte Daten, keine Excel-Listen. Open-Akquise liefert genau das:

- 📈 **Echtzeit-Statistiken:** Volle Kontrolle über Provisionen, Objekttypen und Status-Verteilungen.
- 📱 **Mobile First:** Perfekt optimiert für Smartphones (PWA) und Tablets.
- 🤖 **KI-Integration:** Integrierte Schnittstellen für Mistral und Gemini zur automatisierten Textanalyse.
- 🔐 **Rollenbasiertes System:** Trennung zwischen Admins (Vollzugriff), Teamleitern (User) und Agenten.
- 💼 **CRM & Rechnungen:** Integrierte Verwaltung von Artikeln, Rechnungen und Kunden.

---

## 💎 Unser Service: Full-Service-Setup für 250 €

Du möchtest das System nicht selbst hosten oder konfigurieren? Wir übernehmen das komplette technische Setup für dich oder deine Kunden!

**Unser Dienstleistungs-Paket umfasst:**

- ✅ **Infrastruktur:** Einrichtung von Hosting und Supabase-Datenbank.
- ✅ **Branding:** Anpassung an dein Corporate Design (Logo, Farben).
- ✅ **Domain-Anbindung:** Aufschaltung deiner Wunsch-Domain (z.B. `dashboard.makler-kunde.de`).
- ✅ **Security:** Konfiguration von Sicherheits-Webhooks und SSL.
- ✅ **Support:** Übergabe inklusive technischer Anleitung und Schulung.
- ➕ **Optional zubuchbar:** Mobile App Paket (Android/iOS) als separates Add-on.

👉 **[Hier Full-Service-Setup buchen](https://buy.stripe.com/9B63cv5nZ8n73UZ6GfeQM04)** | Mail an: [support@echtjetztki.at](mailto:support@echtjetztki.at)

---

## 🛠 Technologie-Stack (State-of-the-Art)

Wir setzen auf modernste Technologien für maximale Geschwindigkeit und Sicherheit:

- **Frontend:** Next.js 16 (App Router) & React 19
- **Styling:** Tailwind CSS 4 & Framer Motion (Animationen)
- **Backend:** PostgreSQL & Supabase (Real-time DB)
- **Sicherheit:** Security-Webhooks & JWT-basierte Rollen-Authentifizierung
- **Mobile (optional zubuchbar):** Android/iOS App-Setup auf Anfrage (separates Angebot)

---

## 📦 Rollen & Berechtigungen

| Rolle | Dashboard | User-Management | CRM | Daten-Eingabe |
| :--- | :---: | :---: | :---: | :---: |
| **Admin** | ✅ | ✅ | ✅ | ✅ |
| **Teamleiter** (User) | ✅ | ❌ | ✅ | ✅ |
| **Agent** | ⚠️ (Eigene) | ❌ | ❌ | ✅ |

---

## ⚙️ Installation & Deployment

### 1. Cloud-Hosting & Deployment

Das System ist für den Betrieb auf modernen Node.js-Plattformen optimiert. Sie können es bei jedem gängigen Provider hosten.

**Wichtig:** Stellen Sie sicher, dass Ihre Umgebungsvariablen (siehe unten) vor dem ersten Start korrekt gesetzt sind.

### 2. Datenbank-Setup (Supabase)

Das Dashboard benötigt eine PostgreSQL-Datenbank (optimiert für Supabase). Führen Sie folgende SQL-Dateien in Ihrem SQL Editor aus:

1. `SUPABASE_MASTER_SETUP.sql` (Enthält alle Tabellen und Schema-Definitionen ohne feste Demo-Logins)

### 3. Umgebungsvariablen

Folgende Variablen müssen in Ihrer Hosting-Umgebung oder der `.env.local` Datei gesetzt sein:

| Key | Beschreibung |
| :--- | :--- |
| `SUPABASE_DATABASE_URL` | Ihr Postgres Connection String (Supabase Port 6543 empfohlen) |
| `NEXT_PUBLIC_SUPABASE_URL` | Ihre Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ihr Supabase Anon Public Key |
| `ADMIN_PASSWORD` | Master-Passwort für den Admin-Bereich |
| `USER_PASSWORD` | Master-Passwort für das Team / Agenten |
| `CRON_SECRET` | Schutz-Token für automatisierte Cronjobs (Cleanup/Sync) |
| `DEMO_READ_ONLY` | Optional: sperrt Schreibzugriffe serverseitig fuer eine oeffentliche Demo |
| `NEXT_PUBLIC_DEMO_READ_ONLY` | Optional: blendet Schreibaktionen im Frontend fuer die Demo aus |
| `DEMO_CREDENTIALS_ONLY` | Optional: erzwingt Demo-Logins (Admin/User) statt DB-Logins |
| `DEMO_ADMIN_PASSWORD` | Optional: Demo-Admin-Passwort fuer Demo-Only Login |
| `DEMO_USER_PASSWORD` | Optional: Demo-User/Agent-Passwort fuer Demo-Only Login |
| `NEXT_PUBLIC_DEMO_SIGNUP_URL` | Optional: Link fuer "Basis-Lizenz freischalten" Popup auf der Login-Seite |
| `NEXT_PUBLIC_LICENSE_SIGNUP_URL` | Optional: separater Link fuer "Freischalten" im Login-Popup |
| `BASIC_LICENSE_HASH` | Optional: SHA-256 Hash fuer Basis-Code-Pruefung im Login-Popup |

Der erste Login erfolgt ueber `ADMIN_PASSWORD` und `USER_PASSWORD`. Zusaetzliche Benutzer koennen danach im Admin-Bereich angelegt werden.
Fuer eine oeffentliche Read-only-Demo setzen Sie `DEMO_READ_ONLY=true` und `NEXT_PUBLIC_DEMO_READ_ONLY=true`. Ohne diese Flags funktioniert Self-Hosting unveraendert mit vollem Schreibzugriff.
Fuer oeffentliche Zugangssteuerung kann `NEXT_PUBLIC_DEMO_SIGNUP_URL` gesetzt werden, damit Interessenten sich zuerst eintragen und Demo-Admin/User-Daten per E-Mail erhalten.
Optional kann `NEXT_PUBLIC_LICENSE_SIGNUP_URL` fuer den separaten Freischalten-Button gesetzt werden.
Nach erfolgreicher Basis-Code-Pruefung im Popup wird der Freischaltungs-Button im jeweiligen Browser ausgeblendet.
In Demo-Installationen akzeptiert der Login nur Demo-Credentials aus ENV (`DEMO_ADMIN_PASSWORD` / `DEMO_USER_PASSWORD`), sofern `DEMO_READ_ONLY=true` oder `DEMO_CREDENTIALS_ONLY=true` aktiv ist.

---

## 🔒 Sicherheit & Wartung

- **Read-only Demo statt Cleanup-Cron:** Fuer eine öffentliche Demo koennen `DEMO_READ_ONLY=true` und `NEXT_PUBLIC_DEMO_READ_ONLY=true` gesetzt werden. Dann bleiben Demo-Daten unverändert und ein Reset-Cron ist nicht nötig.
- **Automatischer Reset (optional):** `/api/cron/cleanup` bleibt fuer Deployments verfuegbar, die bewusst regelmässig auf definierte Demo-Daten zurücksetzen wollen.
- **Sicherheits-Logs:** Jeder Login-Versuch kann an einen Discord- oder Slack-Webhook gesendet werden.
- **Backups:** Durch Supabase sind deine Daten redundant und sicher gespeichert.

---

## Lizenz

Open-Akquise wird in einem Dual-Licensing-Modell angeboten:

- **Community-Nutzung:** GNU AGPL v3 oder spaeter
- **Kommerzielle Nutzung, White-Label und Kundenprojekte:** nur ueber separate Vereinbarung

Details findest du in diesen Dateien:

- `LICENSE`
- `COMMERCIAL-LICENSE.md`
- `TRADEMARKS.md`

---

## 📞 Kontakt & Impressum

Wir unterstützen dich gerne bei der Umsetzung deines Immobilien-Digitialisierungs-Projekts.

- **Setup-Service:** [Jetzt direkt buchen](https://buy.stripe.com/9B63cv5nZ8n73UZ6GfeQM04)
- **Web:** [echtjetztki.at](https://echtjetztki.at/)
- **E-Mail:** [support@echtjetztki.at](mailto:support@echtjetztki.at)
- **Repository:** [GitHub / Open-Immo-Akquise](https://github.com/echtjetztki/Open-Immo-Akquise)

---
<p align="center">
  <small>© 2026 Open-Akquise | Ein Open-Source Produkt für Profis.</small>
</p>
