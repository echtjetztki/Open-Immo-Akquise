# 🚨 WICHTIGER PROJEKT-HINWEIS: NICHT VERWECHSELN 🚨

**Dieses Projekt (`C:\Users\offic\Dropbox\Aquise-app`) ist strikt von dem Projekt `C:\Users\offic\Dropbox\open-crm` zu trennen!** 

Es handelt sich um zwei **völlig unterschiedliche** und **voneinander unabhängige** Projekte:

## 1. Open-Immo-Akquise (dieses Verzeichnis)
* **Pfad:** `C:\Users\offic\Dropbox\Aquise-app`
* **Zielgruppe / Zweck:** Spezialisierte Immobilien-Akquise-Dashboard.
* **Fokus:** Automatisierte Leads, Immobilienmakler-Funktionen, N8N/Unipile Integration für LinkedIn, Akquise-Management.
* **Repository:** `github.com:echtjetztki/Open-Immo-Akquise.git`

## 2. Open CRM (das andere Projekt)
* **Pfad:** `C:\Users\offic\Dropbox\open-crm`
* **Zielgruppe / Zweck:** Klassisches, allgemeines CRM für Agenturen und Geschäftskunden.
* **Fokus:** Kundenverwaltung (`/customers`), Artikelverwaltung (`/articles`), Rechnungen (`/invoices`), Finanzen und allgemeine Geschäftsprozesse.
* **Gefahr:** API-Routen wie `/api/crm/...` oder UI-Elemente wie `Open CRM Logo` gehören **ausschließlich** in Ordner `open-crm` und haben in der Immobilien-Akquise nichts zu suchen.

---

### 🔥 Handlungsanweisung an Entwickler & KI-Assistenten 🔥
* **NIEMALS** Code, Seiten (wie Rechnungen, Artikel) oder API-Routen zwischen diesen beiden Projekten per Copy-Paste oder git push vermischen.
* **IMMER** sicherstellen, dass im richtigen Ordner und mit dem richtigen GitHub-Remote-Branch gearbeitet wird. Ein "gesamt" Push oder Commit darf niemals Code aus dem `open-crm` Verzeichnis in das `Aquise-app` Verzeichnis bringen.

*Zuletzt vermischt und behoben am: 22. März 2026. Bitte diese Erfahrung als Mahnung im Projekt belassen.*
*Vercel-Trigger-Update gesendet und Github Re-Connected.*
