// ============================================================
// ALONE MANAGEMENT - Service Worker v7 (Fixed All Platform Icons)
// ============================================================
const V = 'alone-v7';
const APP  = V + '-app';
const LIBS = V + '-libs';

const APP_FILES = [
    './',
    './index.html',
    './icon.jpg',
    './manifest.json',

    // ── Android / PWA icons (used by manifest.json) ──────────
    './icons/android/mipmap-mdpi/ic_launcher.png',
    './icons/android/mipmap-hdpi/ic_launcher.png',
    './icons/android/mipmap-xhdpi/ic_launcher.png',
    './icons/android/mipmap-xxhdpi/ic_launcher.png',
    './icons/android/mipmap-xxxhdpi/ic_launcher.png',
    './icons/android/mipmap-xxxhdpi/ic_launcher_round.png',
    './icons/android/playstore-icon.png',

    // ── iOS / Safari (apple-touch-icon) ──────────────────────
    './icons/ios/Icon-60@3x.png',
    './icons/ios/Icon-83.5@2x.png',
    './icons/ios/Icon-76@2x.png',
    './icons/ios/Icon-60@2x.png',

    // ── Windows (ICO favicon + tile) ─────────────────────────
    './icons/windows/app.ico',
    './icons/windows/icon_256.png',

    // ── Linux / macOS / Generic browser favicon ───────────────
    './icons/linux/hicolor/16x16/apps/alone-management.png',
    './icons/linux/hicolor/32x32/apps/alone-management.png',
    './icons/linux/hicolor/48x48/apps/alone-management.png',
    './icons/linux/hicolor/64x64/apps/alone-management.png',
    './icons/linux/hicolor/128x128/apps/alone-management.png',
    './icons/linux/hicolor/256x256/apps/alone-management.png',
    './icons/linux/hicolor/512x512/apps/alone-management.png',
];

const LIB_FILES = [
    'https://unpkg.com/vue@3/dist/vue.global.prod.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.woff2',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap',
];

// ── Install: cache EVERYTHING ────────────────────────────────
self.addEventListener('install', e => {
    e.waitUntil(
        Promise.all([
            caches.open(APP).then(c =>
                Promise.allSettled(APP_FILES.map(url =>
                    fetch(url).then(r => { if(r.ok) c.put(url, r); }).catch(()=>{})
                ))
            ),
            caches.open(LIBS).then(c =>
                Promise.allSettled(LIB_FILES.map(url =>
                    fetch(url, {mode:'cors'}).then(r => {
                        if(r.ok) c.put(url, r);
                    }).catch(()=>{})
                ))
            )
        ]).then(() => self.skipWaiting())
    );
});

// ── Activate: clean old caches ───────────────────────────────
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k=>k!==APP&&k!==LIBS).map(k=>caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// ── Fetch: Cache-First ───────────────────────────────────────
self.addEventListener('fetch', e => {
    if(e.request.method !== 'GET') return;
    if(e.request.url.startsWith('chrome-extension://')) return;
    if(e.request.url.startsWith('data:')) return;

    e.respondWith(
        caches.match(e.request).then(hit => {
            if(hit) return hit;
            return fetch(e.request).then(res => {
                if(res && res.status===200 && res.type!=='opaque'){
                    const clone = res.clone();
                    const cn = /cdn\.|unpkg\.|fonts\.|cdnjs\./.test(e.request.url) ? LIBS : APP;
                    caches.open(cn).then(c => c.put(e.request, clone));
                }
                return res;
            }).catch(() => {
                if(e.request.destination==='document')
                    return caches.match('./index.html');
                if(e.request.destination==='image')
                    return caches.match('./icons/android/mipmap-xxxhdpi/ic_launcher.png');
                return new Response('',{status:503});
            });
        })
    );
});

self.addEventListener('message', e => {
    if(e.data?.type === 'CHECK_OFFLINE') {
        caches.has(LIBS).then(has => {
            e.source.postMessage({type:'OFFLINE_STATUS', ready: has});
        });
    }
    if(e.data?.type === 'SKIP_WAITING') self.skipWaiting();

    if(e.data?.type === 'LOCAL_NOTIFY') {
        const { title, body, tag, icon } = e.data;
        self.registration.showNotification(title || 'Alone Management', {
            body: body || '',
            icon: icon || './icons/android/mipmap-xxxhdpi/ic_launcher.png',
            badge: './icons/android/mipmap-xxhdpi/ic_launcher.png',
            tag: tag || 'alone-local',
            renotify: true,
            vibrate: [200, 100, 200]
        });
    }
});

self.addEventListener('push', e => {
    const data = e.data ? e.data.json() : {};
    e.waitUntil(
        self.registration.showNotification(data.title || 'Alone Management', {
            body: data.body || '',
            icon: './icons/android/mipmap-xxxhdpi/ic_launcher.png',
            badge: './icons/android/mipmap-xxhdpi/ic_launcher.png',
            tag: data.tag || 'alone-push',
            data: data
        })
    );
});

self.addEventListener('notificationclick', e => {
    e.notification.close();
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            for (const c of list) {
                if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus();
            }
            if (clients.openWindow) return clients.openWindow('./');
        })
    );
});
