# ⚡ Alone Management — Complete Setup Guide

## 🔴 TL;DR (Fastest Way)
> Open the app **once** while connected to internet → done, works offline forever.

---

## Method 1: PWA (Recommended)

The **Service Worker** automatically caches *everything* during installation:
- Vue.js 3, Chart.js 4, jsPDF, html2canvas
- Tailwind CSS, Font Awesome 6, Outfit font
- All app files

### Steps
1. Host files on any server (or open locally)
2. Open in Chrome / Edge / Safari
3. **Wait for the blue banner** → "Setting up offline mode…"
4. Banner turns green → **"App is now 100% offline ready!"**
5. Done! Works forever without internet.

> ✅ Android (Chrome) · iOS (Safari) · Windows · macOS · Linux

---

## Method 2: Single-File Bundle (Zero Dependencies)

Creates one HTML file with **everything embedded** — no server, no internet, ever.

### Requirements
- Python 3.6+ (pre-installed on Mac/Linux; download from python.org for Windows)
- Internet connection (one time only, ~5MB download)

### Steps
```bash
cd AloneManagement-MultiPlatform
python3 bundle_offline.py
```

Output: **`AloneManagement_OFFLINE.html`** (~4–6 MB)

```
✅ Open in browser   → double-click the HTML file
✅ Copy to phone     → send via AirDrop/WhatsApp, open in Chrome
✅ USB drive         → works on any computer
✅ Electron app      → use as BrowserWindow file URL
```

---

## Platform Builds

### 📱 Android APK
```bash
npm install
npx cap add android
npx cap sync
npx cap open android
# Build → Generate Signed Bundle in Android Studio
```

### 📱 iOS App
```bash
npm install
npx cap add ios
npx cap sync
npx cap open ios
# Product → Archive in Xcode
```

### 🖥️ Windows .exe
```bash
npm install
npm run dist
# Output: dist/AloneMgt Setup x.x.x.exe
```

### 🍎 macOS .dmg
```bash
npm install
npm run dist
# Output: dist/AloneMgt-x.x.x.dmg
```

### 🐧 Linux AppImage
```bash
npm install
npm run dist
# Output: dist/AloneMgt-x.x.x.AppImage
```

---

## Platform Icons

Pre-generated icons are in the `icons/` folder:

| Platform | Folder | Files |
|----------|--------|-------|
| Android  | `icons/android/` | mipmap-* folders, Play Store 512px |
| iOS      | `icons/ios/` | All @1x @2x @3x sizes (App Store 1024px) |
| Windows  | `icons/windows/` | `app.ico` + individual PNGs |
| Linux    | `icons/linux/` | hicolor theme structure |
| macOS    | `icons/macos/` | AppIcon.iconset (all sizes) |

---

## Default PIN
`1234`  — Change in Settings → Security

## Data Backup
Settings → Backup JSON → save the file
To restore: Settings → Restore Backup → select the JSON file
