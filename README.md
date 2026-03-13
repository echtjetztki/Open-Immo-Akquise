<p align="center">
  <img src="public/logo.png" width="160" alt="Open-Akquise Logo">
</p>

# 🏠 Open-Akquise | Das Immobilien-Leitstand Dashboard

**Die professionelle All-in-One Lösung für moderne Immobilienmakler, Teams und Agenturen.**

Open-Akquise ist ein hochperformantes Dashboard zur Steuerung von Immobilien-Leads, Objektverwaltung und Team-Reporting. Es wurde speziell entwickelt, um den Akquise-Prozess zu digitalisieren und als skalierbare Dienstleistung für Kunden angeboten zu werden.

---

<p align="center">
  <a href="https://open-immo-akquise.vercel.app/" target="_blank">
    <strong>✨ JETZT LIVE-DEMO TESTEN</strong>
  </a>
  <br />
  <i>Benutzer: <code>admin</code> | Passwort: <code>admin-DEMO12345!</code></i>
  <br />
  <small>(Die Demo-Datenbank wird automatisch alle 5 Minuten vollständig bereinigt.)</small>
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

👉 **[Hier Full-Service-Setup buchen](https://buy.stripe.com/9B63cv5nZ8n73UZ6GfeQM04)** | Mail an: [support@echtjetztki.at](mailto:support@echtjetztki.at)

---

## 🛠 Technologie-Stack (State-of-the-Art)

Wir setzen auf modernste Technologien für maximale Geschwindigkeit und Sicherheit:

- **Frontend:** Next.js 16 (App Router) & React 19
- **Styling:** Tailwind CSS 4 & Framer Motion (Animationen)
- **Backend:** PostgreSQL & Supabase (Real-time DB)
- **Sicherheit:** Security-Webhooks & JWT-basierte Rollen-Authentifizierung
- **Mobile:** Mobile App Basis via Capacitor (Android/iOS bereit)

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

1. `SUPABASE_MASTER_SETUP.sql` (Enthält alle Tabellen, Schema-Definitionen und Demo-User)

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

---

## 🔒 Sicherheit & Wartung

- **Automatischer Reset:** Die Demo-Instanz wird alle **5 Minuten** zurückgesetzt (`/api/cron/cleanup`), um Datenmüll zu vermeiden.
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
