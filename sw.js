// ============================================================
// ALONE MANAGEMENT - Service Worker v6 (100% Offline-First)
// ============================================================
const V = 'alone-v6';
const APP  = V + '-app';
const LIBS = V + '-libs';

const APP_FILES = ['./', './index.html', './icon.jpg', './manifest.json'];

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
            caches.open(APP).then(c => c.addAll(APP_FILES)),
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

// ── Activate: clean old ──────────────────────────────────────
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

    // ── Local Notification: triggered by the Vue app ─────────
    if(e.data?.type === 'LOCAL_NOTIFY') {
        const { title, body, tag, icon } = e.data;
        self.registration.showNotification(title || 'Alone Management', {
            body: body || '',
            icon: icon || './icon.jpg',
            badge: './icon.jpg',
            tag: tag || 'alone-local',
            renotify: true,
            vibrate: [200, 100, 200]
        });
    }
});

// ── Push: handles future server-side push messages ───────────
self.addEventListener('push', e => {
    const data = e.data ? e.data.json() : {};
    e.waitUntil(
        self.registration.showNotification(data.title || 'Alone Management', {
            body: data.body || '',
            icon: './icon.jpg',
            badge: './icon.jpg',
            tag: data.tag || 'alone-push',
            data: data
        })
    );
});

// ── Notification click: bring app to foreground ──────────────
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
