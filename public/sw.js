const CACHE_NAME = 'virtual-wardrobe-v1'

const APP_SHELL = ['/', '/closet', '/outfits', '/analytics', '/log']

// Install: precache app shell pages
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

// Activate: delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  )
  self.clients.claim()
})

// Fetch: route to correct strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignore non-HTTP schemes (chrome-extension://, etc.) — Cache API rejects them
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return

  // Network First for API routes
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Cache First for garment thumbnail images from PUBLIC Supabase Storage only.
  // Signed / authenticated URLs (/object/sign/ or /object/authenticated/) are
  // network-only — they contain time-limited tokens that must not be cached.
  if (
    url.hostname.endsWith('.supabase.co') &&
    url.pathname.includes('/storage/v1/') &&
    url.pathname.includes('/object/public/')
  ) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Network First for everything else (app shell pages)
  event.respondWith(networkFirst(request))
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response('Offline', { status: 503 })
  }
}
