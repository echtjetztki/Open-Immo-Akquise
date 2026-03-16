# 📖 Open-Akquise Wiki: Dokumentation & Guide

Willkommen in der offiziellen Dokumentation von **Open-Akquise**. Dieses Wiki dient als technischer Leitfaden für die Installation, Konfiguration und den Betrieb des Dashboards.

---

## 🇩🇪 Deutsch: Dokumentation

### 1. Einleitung & Philosophie
Open-Akquise ist ein hochperformantes Immobilien-Dashboard, das speziell für Makler und Teams entwickelt wurde. Das Ziel ist maximale Datensouveränität durch Self-Hosting und eine intuitive Benutzeroberfläche.

### 2. Erstinstallation & Setup
1. **Repository klonen:**
   ```bash
   git clone https://github.com/echtjetztki/Open-Immo-Akquise.git
   cd Open-Immo-Akquise
   npm install
   ```
2. **Datenbank vorbereiten:**
   - Erstellen Sie ein Projekt in **Supabase**.
   - Führen Sie das Skript `SUPABASE_MASTER_SETUP.sql` im SQL-Editor von Supabase aus, um die Tabellenstruktur anzulegen.
3. **Konfiguration:**
   - Kopieren Sie die Datei `.env.example` zu `.env.local`.
   - Hinterlegen Sie Ihre Supabase-Zugangsdaten sowie die Passwörter für `ADMIN_PASSWORD` und `USER_PASSWORD`.

### 3. n8n Automatisierung (Premium-Feature)
Die vollständige n8n-Integration zur Automatisierung von Lead-Importen und Daten-Synchronisation ist ein **Premium-Feature**. 
- **Freischaltung:** Die API-Endpunkte (z. B. `/api/n8n/properties`) werden erst nach Erwerb und Eingabe eines gültigen Aktivierungscodes in den Systemeinstellungen sichtbar und funktionsfähig.
- **Sicherheit:** Der Zugriff erfolgt über einen geschützten Header (`x-api-key`), der serverseitig konfiguriert werden muss.

### 4. Deployment
Wir empfehlen das Deployment über **Vercel**. Nutzen Sie den "Deploy"-Button im Hauptverzeichnis (README), um alle Umgebungsvariablen automatisch zu verknüpfen. Achten Sie darauf, für die Datenbank-URL den Connection-String mit Port **6543** zu verwenden.

---

## 🇺🇸 English: Documentation

### 1. Introduction & Philosophy
Open-Akquise is a high-performance real estate dashboard designed for brokers and teams. It focuses on data sovereignty through self-hosting and provides a modern, intuitive user interface.

### 2. Initial Installation & Setup
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/echtjetztki/Open-Immo-Akquise.git
   cd Open-Immo-Akquise
   npm install
   ```
2. **Prepare the Database:**
   - Create a project on **Supabase**.
   - Run the `SUPABASE_MASTER_SETUP.sql` script in the Supabase SQL Editor to initialize the table structure.
3. **Configuration:**
   - Copy `.env.example` to `.env.local`.
   - Enter your Supabase credentials and define your `ADMIN_PASSWORD` and `USER_PASSWORD`.

### 3. n8n Automation (Premium Feature)
Full n8n integration for automated lead imports and data synchronization is a **Premium Feature**.
- **Activation:** The API endpoints (e.g., `/api/n8n/properties`) are only visible and operational after purchasing and entering a valid activation code in the system settings.
- **Security:** Access is secured via a protected header (`x-api-key`), which must be configured on the server side.

### 4. Deployment
We recommend deploying via **Vercel**. Use the "Deploy" button in the main directory (README) to automatically link all environment variables. Ensure you use the connection string with port **6543** for the database URL.

---

## 🛡️ Empfohlene Partner / Recommended Partners
- **Hosting:** [Hostinger VPS (KVM Tier 2)](https://www.hostinger.com/de/cart?product=vps%3Avps_kvm_2&period=12&referral_type=cart_link&REFERRALCODE=echtjetztki&referral_id=019cf358-4d36-71a0-b7b9-e8ab7ac18314)
- **Legal (AGB/DSGVO):** [IT-Recht Kanzlei](https://www.it-recht-kanzlei.de/agb-starterpaket.php?partner_id=1686)

---
<p align="center">
  <small>© 2026 Open-Akquise | Powered by EchtJetztKI</small>
</p>
