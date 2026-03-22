# Anleitung: Android App veröffentlichen (Google Play Store)

Diese Datei hilft dir dabei, dein **Open-Akquise** Dashboard als App für Android-Smartphones in den Google Play Store zu bringen.

Die App ist nun als **universelle Shell** konzipiert: Nach der Installation geben die Nutzer einfach ihre eigene Dashboard-URL (Vercel oder VPS) ein.

## Schritt 1: Google Play Developer Account erstellen

1. Gehe auf [play.google.com/console](https://play.google.com/console/)
2. Registriere dich für ein **Entwicklerkonto**. Das kostet einmalig 25 US-Dollar.
3. Du musst dabei deine Identität per Ausweisdokument nachweisen (Vorgabe von Google).

## Schritt 2: Android Studio installieren

1. Lade dir das Programm **Android Studio** kostenlos herunter: [developer.android.com/studio](https://developer.android.com/studio)
2. Installiere es (du kannst alle Standardeinstellungen übernehmen).

## Schritt 3: Das Projekt öffnen

1. Öffne Android Studio.
2. Klicke auf **Open** (oder File > Open).
3. Navigiere zu deinem Projektordner (`C:\Users\offic\Dropbox\open-akquise`) und wähle **nur den darin liegenden Ordner `android`** aus.
4. Warte einen Moment. Unten rechts siehst du einen Ladebalken ("Gradle Sync"). Android Studio lädt nun alle Werkzeuge herunter, die zum Bauen der App nötig sind (dies kann beim Lauf 1-5 Minuten dauern).

## Schritt 4: Die App Signieren & Erstellen

Google akzeptiert nur verschlüsselte (signierte) Apps (Format: `.aab`).

1. Klicke im oberen Menü von Android Studio auf **Build** > **Generate Signed Bundle / APK...**
2. Wähle **Android App Bundle** (nicht APK!) und klicke `Next`.
3. Im Feld "Key store path" klicke auf **Create new...**
   - **Key store path:** Klicke das Ordner-Symbol und speichere die Datei z.B. einfach unter `C:\Users\offic\Documents\Open-Akquise_keystore.jks` auf deinem PC. **WICHTIG: Verliere diese Datei nie! Hebe sie sicher auf (z.b. USB Stick)! Ohne sie kannst du später nie wieder Updates der App hochstellen.**
   - **Password:** Denke dir ein sicheres Passwort aus (und merke es dir).
   - **Alias:** Trag hier `Open-Akquise` ein.
   - **Certificate:** Trag bei "First and Last Name" deinen Namen ein. Der Rest darf leer bleiben. Klicke OK.
4. Klicke auf `Next`.
5. Wähle **release** und klicke auf `Create`.
6. Android Studio arbeitet nun („Build Running“ unten im Ladebalken). Sobald es fertig ist, erscheint ein kleines grünes Fenster. Klicke darin auf `locate` (oder öffne manuell den Ordner `open-akquise\android\app\release`).
7. Dort findest du die fertige **`app-release.aab`** Datei!

## Schritt 5: In den Play Store eintragen

1. Logge dich in der [Google Play Console](https://play.google.com/console/) ein.
2. Klicke auf **App erstellen**.
3. Gib den Namen (`Open-Akquise`) und die Standardsprache ein und wähle aus, dass es eine "App" (kein Spiel) ist und kostenlos ist.
4. Im Play Store-Menü links arbeitest du die Checkliste ("App einrichten") ab, bei der du z.B. Datenschutzrichtlinien verlinken, Screenshots hochladen und eine Beschreibung tippen musst.
5. Klicke auf **Produktion** > Neue Version erstellen.
6. Lade nun hier deine fertige **`app-release.aab`** Datei hoch.
7. Zur Überprüfung einreichen.

Google prüft deine App nun (das dauert meist 1 bis 5 Tage). Wenn alles in Ordnung ist, ist deine App danach live im Play Store zu finden!

## Wenn Google mit "familienfreundliche Inhalte / App-Stabilitaet" oder "irrefuehrende Behauptungen" ablehnt

Nutze vor dem naechsten Upload diese kurze Checkliste:

1. Target Audience in Play Console auf Erwachsene setzen:
   - Policy and programs > App content > Target audience and content
   - Keine Kinder-Altersgruppen auswaehlen.
   - App als interne Business-App beschreiben.

2. App Access korrekt hinterlegen:
   - Falls Login erforderlich ist, in App content > App access gueltige Test-Zugangsdaten fuer Reviewer angeben.
   - Ohne funktionierende Review-Zugaenge wird oft "Stabilitaet" gemeldet.

3. Irrefuehrende Aussagen in Store Listing vermeiden:
   - Keine absoluten Claims wie "garantiert", "offiziell", "Nr. 1", falls nicht nachweisbar.
   - Beschreibung muss exakt zur App passen (interne Immobilien-Verwaltung, kein oeffentliches Portal).

4. Stabilitaet vor Einreichung pruefen:
   - Frische Installation auf Android 13/14 testen.
   - Login, Navigation, Menue, API-Calls und Logout jeweils mehrfach pruefen.
   - Bei Fehlern darf kein White-Screen entstehen.

5. Release Notes fuer Review klar formulieren:
   - Erklaeren, welche Stabilitaetsfixes umgesetzt wurden.
   - Erklaeren, dass die App nicht fuer Kinder bestimmt ist und nur fuer registrierte Teammitglieder genutzt wird.

Offizielle Referenzen (Google):
- Familienrichtlinie / Zielgruppe und Inhalte: https://support.google.com/googleplay/android-developer/answer/9893335?hl=de
- Irrefuehrende Behauptungen: https://support.google.com/googleplay/android-developer/answer/9888077?hl=de
- App fuer Review vorbereiten (inkl. App Access): https://support.google.com/googleplay/android-developer/answer/9859455?hl=en

