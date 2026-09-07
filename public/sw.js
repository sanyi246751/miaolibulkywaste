const CACHE_NAME = 'miaoli-removal-v5'
const BASE_PATH = new URL(self.registration.scope).pathname
const fromBase = (path = '') => `${BASE_PATH}${path}`
const APP_SHELL = [fromBase(),fromBase('index.html'),fromBase('admin.html'),fromBase('work.html'),fromBase('offline.html'),fromBase('manifest.webmanifest'),fromBase('pwa-icon.svg')]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const requestUrl = new URL(event.request.url)
  // Google Apps Script and other APIs must always return current data.
  if (requestUrl.origin !== self.location.origin) return
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone()
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
      return response
    }).catch(async () => (await caches.match(event.request)) || caches.match(fromBase('offline.html'))))
    return
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (!response || (response.status !== 200 && response.type !== 'opaque')) return response
    const copy = response.clone()
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
    return response
  })))
})
