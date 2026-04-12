#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════╗
║   Alone Management - Offline Bundler v2                      ║
║   Run ONCE while online → creates AloneManagement_OFFLINE.html ║
║   After that: works 100% offline, any device, no server     ║
╚══════════════════════════════════════════════════════════════╝
Usage:
    python3 bundle_offline.py

Requirements:
    Python 3.6+  (no extra packages needed)
"""

import urllib.request, base64, os, re, sys, json, time

HERE = os.path.dirname(os.path.abspath(__file__))

LIBS = [
    # (key, url, type)
    ("vue",         "https://unpkg.com/vue@3/dist/vue.global.prod.js",                                          "js"),
    ("chartjs",     "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js",                       "js"),
    ("jspdf",       "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",                     "js"),
    ("html2canvas", "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",              "js"),
    ("tailwind",    "https://cdn.tailwindcss.com/3.4.1",                                                        "js"),
    ("fa_css",      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",                "css"),
    ("fa_solid",    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2",    "font"),
    ("fa_regular",  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2",  "font"),
    ("fa_brands",   "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.woff2",   "font"),
    ("outfit",      "https://fonts.gstatic.com/s/outfit/v11/QGYyz_MVcBeNP4NjuGObqx1XmO1I4TC1C4G-EiAou6Y.woff2","font"),
]

def get(url, label):
    for attempt in range(3):
        try:
            print(f"  ↓  {label:<35}", end="", flush=True)
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 (compatible; AloneMgt-Bundler/2.0)",
                "Accept": "*/*"
            })
            with urllib.request.urlopen(req, timeout=45) as r:
                data = r.read()
            print(f"✓ {len(data)//1024}KB")
            return data
        except Exception as e:
            if attempt < 2:
                print(f"⟳ retry {attempt+2}…", end="\r")
                time.sleep(2)
            else:
                print(f"✗ FAILED ({e})")
                return None

def b64(data):
    return base64.b64encode(data).decode()

def main():
    index = os.path.join(HERE, "index.html")
    if not os.path.exists(index):
        print("❌  index.html not found! Run from the project folder."); sys.exit(1)

    print("\n╔══ Alone Management — Offline Bundler v2 ══╗")
    print(f"  Project : {HERE}")

    # ── Download everything ───────────────────────────────────
    assets = {}
    print("\n  Downloading libraries…\n")
    for key, url, kind in LIBS:
        data = get(url, key)
        assets[key] = (data, kind)

    # ── Check if anything critical is missing ─────────────────
    critical = ["vue", "chartjs", "tailwind"]
    missing = [k for k in critical if assets.get(k, (None,))[0] is None]
    if missing:
        print(f"\n⚠️  Critical assets missing: {missing}")
        print("   Check internet connection and try again.\n")
        sys.exit(1)

    # ── Build Font Awesome inline CSS ─────────────────────────
    print("\n  Building inline CSS…")
    fa_css_data, _ = assets["fa_css"]
    fa_css = fa_css_data.decode("utf-8", "replace") if fa_css_data else "/* FA unavailable */"

    for key, fname in [("fa_solid","fa-solid-900.woff2"),
                       ("fa_regular","fa-regular-400.woff2"),
                       ("fa_brands","fa-brands-400.woff2")]:
        fdata, _ = assets[key]
        if fdata:
            fa_css = fa_css.replace(
                f"../webfonts/{fname}",
                f"data:font/woff2;base64,{b64(fdata)}"
            )

    # ── Build Outfit font CSS ─────────────────────────────────
    outfit_data, _ = assets["outfit"]
    if outfit_data:
        outfit_css = (
            "@font-face{font-family:'Outfit';font-style:normal;font-weight:100 900;"
            f"src:url(data:font/woff2;base64,{b64(outfit_data)}) format('woff2');}}"
        )
    else:
        outfit_css = "/* Outfit font unavailable — using system fonts */"

    # ── Patch HTML ────────────────────────────────────────────
    print("  Patching HTML…")
    with open(index, "r", encoding="utf-8") as f:
        html = f.read()

    # Remove all CDN <script> and <link> tags
    cdn_patterns = [
        r'<script src="https://cdn\.tailwindcss\.com[^"]*"[^>]*></script>\s*',
        r'<script src="https://cdn\.jsdelivr\.net/npm/chart\.js[^"]*"[^>]*></script>\s*',
        r'<link [^>]*href="https://cdnjs\.cloudflare\.com[^"]*font-awesome[^"]*"[^>]*>\s*',
        r'<link [^>]*href="https://fonts\.googleapis\.com[^"]*"[^>]*>\s*',
        r'<script src="https://cdnjs\.cloudflare\.com/ajax/libs/jspdf[^"]*"[^>]*></script>\s*',
        r'<script src="https://cdnjs\.cloudflare\.com/ajax/libs/html2canvas[^"]*"[^>]*></script>\s*',
        r'<script src="https://unpkg\.com/vue@3[^"]*"[^>]*></script>\s*',
    ]
    for pat in cdn_patterns:
        html = re.sub(pat, "", html, flags=re.IGNORECASE)

    # Disable service worker in single-file mode (not needed)
    html = html.replace(
        "navigator.serviceWorker.register('./sw.js')",
        "Promise.resolve(console.log('[Offline Bundle] SW disabled — single-file mode'))"
    )

    # Remove SW setup banner script (not needed)
    html = re.sub(
        r'<div id="sw-setup-banner"[^>]*>.*?</div>\s*',
        '', html, flags=re.DOTALL
    )

    # Remove manifest link (standalone file)
    html = re.sub(r'<link rel="manifest"[^>]*>\s*', '', html)

    # Embed icon.jpg as base64
    icon_path = os.path.join(HERE, "icon.jpg")
    if os.path.exists(icon_path):
        with open(icon_path, "rb") as f:
            icon_b64 = b64(f.read())
        icon_uri = f"data:image/jpeg;base64,{icon_b64}"
        html = html.replace('src="icon.jpg"', f'src="{icon_uri}"')

    # Build inline scripts/styles to inject
    inline_parts = [
        f"<style>\n{outfit_css}\n\n{fa_css}\n</style>",
    ]
    for key, url, kind in LIBS:
        if kind not in ("js",): continue
        data, _ = assets[key]
        if data:
            try:
                js_text = data.decode("utf-8", "replace")
                # Fix Tailwind config check
                if key == "tailwind":
                    inline_parts.append(f"<!-- Tailwind CSS -->\n<script>{js_text}</script>")
                else:
                    inline_parts.append(f"<!-- {key} -->\n<script>{js_text}</script>")
            except Exception as e:
                inline_parts.append(f"<!-- ⚠️ {key} encode error: {e} -->")
        else:
            inline_parts.append(f"<!-- ⚠️ {key} not downloaded — app may not work correctly -->")

    inject = "\n".join(inline_parts)
    html = html.replace("<head>", f"<head>\n{inject}", 1)

    # ── Write output ──────────────────────────────────────────
    out = os.path.join(HERE, "AloneManagement_OFFLINE.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)

    size_mb = os.path.getsize(out) / (1024*1024)
    print(f"\n  ✅ Done! → AloneManagement_OFFLINE.html ({size_mb:.1f} MB)")
    print("""
╔══════════════════════════════════════════════════════════════╗
║  ✅ 100% OFFLINE BUNDLE READY                                ║
║                                                              ║
║  • Open directly in any browser (double-click)               ║
║  • Works with NO internet connection                         ║
║  • Copy to phone → open with Chrome/Safari                   ║
║  • Use as Electron main window file                          ║
║  • Backup to USB drive — works anywhere                      ║
╚══════════════════════════════════════════════════════════════╝
""")

if __name__ == "__main__":
    main()
