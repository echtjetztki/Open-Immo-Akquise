# 🚨 WICHTIG: Datenbank-Update durchführen

## Das Kaufpreis-Feature wurde hinzugefügt!

Das Dashboard wurde aktualisiert und verwendet jetzt **Kaufpreis** statt Gesamtprovision als Eingabefeld. Alle Provisionen werden automatisch berechnet:

- **Gesamtprovision**: 6% des Kaufpreises
- **Provision Abgeber**: 3% des Kaufpreises
- **Provision Käufer**: 3% des Kaufpreises
- **Berechnung (Verdienst)**: 10% der Gesamtprovision

---

## ⚠️ Datenbank muss aktualisiert werden

Damit das Dashboard funktioniert, musst du die Datenbank-Tabelle in Supabase aktualisieren.

### Schritt-für-Schritt Anleitung:

1. **Öffne Supabase Dashboard**
   - Gehe zu: https://supabase.com/dashboard
   - Wähle dein Projekt aus

2. **Öffne den SQL Editor**
   - Klicke in der linken Sidebar auf **"SQL Editor"**
   - Klicke auf **"New query"**

3. **Kopiere das Update-Script**
   - Öffne die Datei: `database-update.sql` in diesem Verzeichnis
   - Kopiere den gesamten Inhalt

4. **Führe das Script aus**
   - Füge das Script in den SQL Editor ein
   - Klicke auf **"Run"** (oder drücke `Ctrl+Enter`)
   - Warte bis "Success" angezeigt wird

5. **Fertig!**
   - Die Datenbank ist jetzt aktualisiert
   - Das Dashboard funktioniert jetzt mit dem neuen Kaufpreis-Feld

---

## 📋 Was das Script macht:

1. Fügt die neue Spalte **kaufpreis** hinzu
2. Löscht die alte **gesamtprovision** Spalte
3. Fügt **gesamtprovision** als automatisch berechnete Spalte hinzu (6% von kaufpreis)
4. Fügt **provision_abgeber** als automatisch berechnete Spalte hinzu (3% von kaufpreis)
5. Fügt **provision_kaeufer** als automatisch berechnete Spalte hinzu (3% von kaufpreis)
6. Die **berechnung** Spalte bleibt und zeigt weiterhin 10% der Gesamtprovision

---

## 🔄 Nach dem Update:

1. Öffne das Dashboard: https://open-akquise.vercel.app
2. Gehe zur **Eingabe-Seite**
3. Erstelle eine neue Property mit dem **Kaufpreis**-Feld
4. Alle Provisionen werden automatisch berechnet und angezeigt! ✅

---

## ❓ Bei Problemen:

Wenn das Script einen Fehler anzeigt:
- Prüfe, ob du das richtige Projekt in Supabase ausgewählt hast
- Stelle sicher, dass die Tabelle **"property-leads"** existiert
- Kontaktiere mich bei weiteren Problemen

---

**Hinweis:** Bestehende Daten in der Tabelle werden NICHT gelöscht. Die neuen Felder werden hinzugefügt und alte Properties haben kaufpreis = NULL bis sie bearbeitet werden.

