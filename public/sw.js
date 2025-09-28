// public/sw.js - Service Worker para cache inteligente

const CACHE_NAME = 'discoteca-qr-v1'
const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'

// Recursos críticos que deben cachearse inmediatamente
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // CSS crítico
  '/assets/main.css',
  // JS crítico del vendor
  '/assets/vendor-vue.js',
  '/assets/vendor-ionic.js'
]

// Recursos que se cachean bajo demanda
const CACHE_STRATEGIES = {
  // Páginas principales - Cache First
  pages: {
    pattern: /\/(admin|employee|download-ticket)/,
    strategy: 'cacheFirst'
  },
  
  // APIs - Network First
  api: {
    pattern: /\/api\//,
    strategy: 'networkFirst'
  },
  
  // Assets estáticos - Cache First
  assets: {
    pattern: /\.(js|css|png|jpg|jpeg|svg|woff2)$/,
    strategy: 'cacheFirst'
  },
  
  // Librerías pesadas - Cache First con TTL largo
  libraries: {
    pattern: /(jspdf|html5-qrcode|html2canvas)/,
    strategy: 'cacheFirst',
    ttl: 7 * 24 * 60 * 60 * 1000 // 7 días
  }
}

// Instalar SW
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Cacheando recursos estáticos')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker instalado')
        return self.skipWaiting()
      })
  )
})

// Activar SW
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Eliminando cache obsoleto:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker activado')
        return self.clients.claim()
      })
  )
})

// Interceptar requests
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  
  // Solo cachear requests GET
  if (request.method !== 'GET') return
  
  // Determinar estrategia de cache
  const strategy = determineStrategy(url.pathname, request.url)
  
  event.respondWith(
    handleRequest(request, strategy)
  )
})

// Determinar estrategia según el tipo de recurso
function determineStrategy(pathname, url) {
  for (const [key, config] of Object.entries(CACHE_STRATEGIES)) {
    if (config.pattern.test(pathname) || config.pattern.test(url)) {
      return { ...config, type: key }
    }
  }
  
  // Default: Network First para todo lo demás
  return { strategy: 'networkFirst', type: 'default' }
}

// Manejar request según estrategia
async function handleRequest(request, strategy) {
  const cacheName = strategy.type === 'assets' ? STATIC_CACHE : DYNAMIC_CACHE
  
  switch (strategy.strategy) {
    case 'cacheFirst':
      return cacheFirst(request, cacheName, strategy.ttl)
    
    case 'networkFirst':
      return networkFirst(request, cacheName)
    
    default:
      return fetch(request)
  }
}

// Estrategia Cache First
async function cacheFirst(request, cacheName, ttl = null) {
  try {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      // Verificar TTL si está configurado
      if (ttl) {
        const cachedTime = cachedResponse.headers.get('sw-cache-time')
        if (cachedTime && Date.now() - parseInt(cachedTime) > ttl) {
          // Cache expirado, intentar actualizar en background
          updateCacheInBackground(request, cache)
        }
      }
      
      return cachedResponse
    }
    
    // No está en cache, buscar en red
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone()
      
      // Agregar timestamp para TTL
      const headers = new Headers(responseToCache.headers)
      headers.set('sw-cache-time', Date.now().toString())
      
      const responseWithTime = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers
      })
      
      cache.put(request, responseWithTime)
    }
    
    return networkResponse
    
  } catch (error) {
    console.error('Error en cacheFirst:', error)
    // Si todo falla, intentar desde cache sin verificar TTL
    const cache = await caches.open(cacheName)
    return cache.match(request) || new Response('Offline', { status: 503 })
  }
}

// Estrategia Network First
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
    
  } catch (error) {
    console.error('Error en networkFirst:', error)
    // Si la red falla, intentar desde cache
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    return cachedResponse || new Response('Offline', { status: 503 })
  }
}

// Actualizar cache en background
function updateCacheInBackground(request, cache) {
  fetch(request)
    .then(response => {
      if (response.ok) {
        const headers = new Headers(response.headers)
        headers.set('sw-cache-time', Date.now().toString())
        
        const responseWithTime = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers
        })
        
        cache.put(request, responseWithTime)
      }
    })
    .catch(error => console.error('Error actualizando cache:', error))
}

// Limpiar caches viejos
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        const oldCaches = cacheNames.filter(name => 
          name !== STATIC_CACHE && name !== DYNAMIC_CACHE
        )
        
        return Promise.all(
          oldCaches.map(name => caches.delete(name))
        )
      })
    )
  }
})