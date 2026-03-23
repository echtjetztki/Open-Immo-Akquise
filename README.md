<p align="center">
  <img src="public/logo.png" width="200" alt="Open-Akquise Logo">
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
  <small>🔒 Demo-Zugangsdaten werden nach Anfrage per E-Mail versendet.</small>
  <br />
  <br />
  <a href="https://echtjetztki.at/open-immo/" target="_blank">
    <strong>🆓 BASIS-LIZENZ KOSTENLOS ANFORDERN</strong>
  </a>
  <span> | </span>
  <a href="https://echtjetztki.at/open-immo/" target="_blank">
    <strong>🆓 DEMO ZUGANG ANFORDERN</strong>
  </a>
  <br />
  <br />
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fechtjetztki%2FOpen-Immo-Akquise&env=SUPABASE_DATABASE_URL,ADMIN_PASSWORD,USER_PASSWORD,CRON_SECRET,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY&project-name=open-immo-akquise&repository-name=open-immo-akquise">
    <img src="https://vercel.com/button" alt="Deploy with Vercel">
  </a>
</p>

---

## 🚀 Warum Open-Akquise?

Dieses System ist nicht bloß Code – es ist ein **fertiges Geschäftsmodell**. Makler und Agenturen benötigen strukturierte Daten, keine Excel-Listen. Open-Akquise liefert genau das:

- 📈 **Echtzeit-Statistiken:** Volle Kontrolle über Provisionen, Objekttypen und Status-Verteilungen.
- 📱 **Mobile First:** Perfekt optimiert für Smartphones (PWA) und Tablets.
- 🤖 **KI-Integration:** Automatisierte Analyse von Objektbeschreibungen und automatische Kategorisierung.
- 🔐 **Rollenbasiertes System:** Trennung zwischen Admins, Teamleitern und Agenten.
- 💼 **CRM & Rechnungen:** Integrierte Verwaltung von Artikeln, Rechnungen und Kundenkontakten.

---

## 🛡️ DSGVO & Infrastruktur-Empfehlungen

Für den rechtssicheren und performanten Betrieb in Deutschland/Österreich empfehlen wir folgende Partner:

### 🖥️ Hosting & VPS (DSGVO-konform)
Für maximale Geschwindigkeit und die volle Kontrolle über deine Daten empfehlen wir einen eigenen VPS. 
**Unsere Empfehlung:** **Hostinger (KVM Tier 2)** – Hervorragendes Preis-Leistungs-Verhältnis und Serverstandorte in der EU.
👉 **[Hier Hostinger VPS mit Rabatt sichern](https://www.hostinger.com/de/cart?product=vps%3Avps_kvm_2&period=12&referral_type=cart_link&REFERRALCODE=echtjetztki&referral_id=019cf358-4d36-71a0-b7b9-e8ab7ac18314)**

### ⚖️ Rechtssicherheit (AGB & Datenschutz)
Immobilien-Portale unterliegen strengen rechtlichen Auflagen. Wir empfehlen das Starterpaket der **IT-Recht Kanzlei**, um rechtssichere AGB, Impressum und Datenschutzerklärungen zu erhalten.
👉 **[IT-Recht Kanzlei AGB-Starterpaket](https://www.it-recht-kanzlei.de/agb-starterpaket.php?partner_id=1686)**

---

## 💎 Unser Service: Full-Service-Setup für 250 €

Du möchtest das System nicht selbst hosten? Wir übernehmen das komplette technische Setup für dich oder deine Kunden!

**Unser Dienstleistungs-Paket umfasst:**
- ✅ **Infrastruktur:** Einrichtung von Hosting (Vercel/DSGVO-VPS) und Supabase-Datenbank.
- ✅ **Branding:** Anpassung an dein Corporate Design (Logo, Farben).
- ✅ **Domain-Anbindung:** Aufschaltung deiner Wunsch-Domain (z.B. `dashboard.deine-agentur.de`).
👉 **[Hier Full-Service-Setup buchen](https://buy.stripe.com/9B63cv5nZ8n73UZ6GfeQM04)** | Mail: [support@echtjetztki.at](mailto:support@echtjetztki.at)

---

## 🛠 Technologie-Stack

Wir setzen auf modernste Technologien für maximale Geschwindigkeit und Sicherheit:

- **Frontend:** Next.js 15+ (App Router) & React 19
- **Styling:** Tailwind CSS 4 & Framer Motion (Flüssige UI/UX)
- **Backend:** PostgreSQL & Supabase (Vektorsuche & Real-time)
- **Sicherheit:** JWT-Rollen & automatisierte Security-Logs
- **Mobile:** Capacitor Integration für native iOS/Android Apps

---

## 📱 App Version
Diese Version im Repository ist die **Standard-Version** zum Testen und sofortigen Einsatz im Web.

Eine installierbare **Premium App-Version** (iOS & Android) mit Offline-Funktionen und erweiterten nativen Features ist verfügbar.
*(Platzhalter: Hier warten wir noch auf die Freigabe der App-Stores)*

---

## ⚙️ Installation & Deployment

Ausführliche Details findest du in unserem [Handbuch (Wiki)](docs/wiki/Home.md).

### Schnell-Checkliste:
1. **Datenbank:** SQL-Skript `SUPABASE_MASTER_SETUP.sql` im Supabase SQL Editor ausführen.
2. **Environment:** `.env.example` kopieren nach `.env.local` und Keys eintragen.
3. **Build:** `npm install` und `npm run dev`.

| Wichtige Keys | Funktion |
| :--- | :--- |
| `SUPABASE_DATABASE_URL` | Postgres Connection (Port 6543) |
| `ADMIN_PASSWORD` | Master-Passwort Admin |
| `USER_PASSWORD` | Master-Passwort Teammitglieder |
| `CRON_SECRET` | Schutz für `/api/cron/*` Endpunkte |

---

## 🔒 Sicherheit
- **Security-Logging:** Jeder Login-Versuch kann per Webhook gemeldet werden.
- **Demo-Modus:** Über `DEMO_READ_ONLY=true` lässt sich eine schreibgeschützte Public-Demo sofort aktivieren.
- **Backups:** Tägliche automatische Snapshots über Supabase möglich.

---

## 📞 Kontakt & Support

- **Setup-Service:** [Jetzt direkt buchen](https://buy.stripe.com/9B63cv5nZ8n73UZ6GfeQM04)
- **Web:** [echtjetztki.at](https://echtjetztki.at/)
- **E-Mail:** [support@echtjetztki.at](mailto:support@echtjetztki.at)
- **GitHub:** [Open-Immo-Akquise Repo](https://github.com/echtjetztki/Open-Immo-Akquise)

---
<p align="center">
  <small>© 2026 Open-Akquise | Ein Open-Source Produkt für Immobilien-Profis.</small>
</p>
