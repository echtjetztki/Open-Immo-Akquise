# Open-Akquise Local Test (Option 1)

Diese Variante ist eine lokale App-Oberflaeche (Dateien direkt im APK/AAB) und nutzt Supabase weiterhin online.

## Ziel

- UI lokal eingebettet (nicht `server.url` auf Vercel)
- Daten weiterhin aus Supabase
- Separater Test in eigenem Ordner `mobile-local-test`

## Dateien

- `mobile-local-test/index.html`
- `mobile-local-test/styles.css`
- `mobile-local-test/app.js`
- `capacitor.config.localtest.ts`
- `scripts/build-android-localtest.ps1`

## Build (Android Test)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-android-localtest.ps1
```

Output:

- `release_bundles/app-user-localtest-release.aab`
- `release_bundles/app-user-localtest-release-unsigned.apk`

Hinweis:

- Fuer Play Store muss ein Keystore vorhanden sein, sonst bleibt das Bundle unsigniert.
- Diese Test-App nutzt aktuell die Supabase-Tabelle `immobilien` als Datenquelle.
