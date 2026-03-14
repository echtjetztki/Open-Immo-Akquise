# iOS Variants (Xcode)

Dieses Projekt nutzt ein gemeinsames iOS-Target und kann per Script auf die gewuenschte Variante umgestellt werden.

## Varianten

- `user` -> Bundle ID `at.Open-Akquise.immo.user`, Display Name `Open-Akquise`
- `agent` -> Bundle ID `at.Open-Akquise.immo.agent`, Display Name `Open-Akquise Agent`
- `admin` -> Bundle ID `at.Open-Akquise.immo.admin`, Display Name `Open-Akquise Admin`

## Vorbereitung

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\prepare-ios-variant.ps1 -Variant agent
```

Danach in Xcode auf dem Mac:

1. `ios/App/App.xcodeproj` oeffnen
2. Signing Team waehlen
3. `Product > Archive`

