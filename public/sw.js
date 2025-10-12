// Service Worker for FUZO Chat PWA
// Handles caching, offline functionality, and background sync

const CACHE_NAME = 'fuzo-chat-v1';
const STATIC_CACHE_NAME = 'fuzo-static-v1';
const DYNAMIC_CACHE_NAME = 'fuzo-dynamic-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other static assets
];

// API routes to cache
const API_ROUTES = [
  '/api/messages',
  '/api/conversations',
  '/api/users',
  '/api/friends'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleOtherRequest(request));
  }
});

// Handle static assets - cache first strategy
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('Error handling static asset:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Handle API requests - network first with offline fallback
async function handleAPIRequest(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    
    // Try network first
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        // Cache successful responses
        if (request.method === 'GET') {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      }
    } catch (networkError) {
      console.log('Network failed, trying cache');
    }
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If it's a POST/PUT request and we're offline, queue it
    if (request.method !== 'GET') {
      await queueOfflineRequest(request);
      return new Response(JSON.stringify({ 
        success: true, 
        queued: true,
        message: 'Request queued for when online' 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Return offline response for GET requests
    return new Response(JSON.stringify({ 
      error: 'Offline',
      message: 'No cached data available' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error handling API request:', error);
    return new Response(JSON.stringify({ error: 'Service worker error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle image requests - cache first with network fallback
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.error('Error handling image request:', error);
    // Return a placeholder image
    return new Response('', { status: 404 });
  }
}

// Handle other requests - network first
async function handleOtherRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Utility functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return STATIC_ASSETS.some(asset => url.pathname.endsWith(asset)) ||
         url.pathname.includes('/_next/static/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.woff2');
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

function isImageRequest(request) {
  const url = new URL(request.url);
  return request.destination === 'image' ||
         url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
}

// Background sync for offline requests
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'offline-messages') {
    event.waitUntil(processOfflineMessages());
  } else if (event.tag === 'offline-media') {
    event.waitUntil(processOfflineMedia());
  }
});

// Queue offline requests
async function queueOfflineRequest(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now()
    };
    
    // Store in IndexedDB or simple cache
    const cache = await caches.open('offline-queue');
    const queueRequest = new Request(`offline-${Date.now()}`, {
      method: 'GET'
    });
    
    await cache.put(queueRequest, new Response(JSON.stringify(requestData)));
    
    // Register for background sync
    if (self.registration.sync) {
      await self.registration.sync.register('offline-messages');
    }
    
  } catch (error) {
    console.error('Error queuing offline request:', error);
  }
}

// Process offline messages when back online
async function processOfflineMessages() {
  try {
    const cache = await caches.open('offline-queue');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await cache.match(request);
        const requestData = await response.json();
        
        // Retry the original request
        const originalRequest = new Request(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });
        
        const result = await fetch(originalRequest);
        
        if (result.ok) {
          await cache.delete(request);
          console.log('Successfully sent queued request:', requestData.url);
        }
        
      } catch (error) {
        console.error('Failed to process queued request:', error);
      }
    }
  } catch (error) {
    console.error('Error processing offline messages:', error);
  }
}

// Process offline media uploads
async function processOfflineMedia() {
  // Similar to processOfflineMessages but for media uploads
  console.log('Processing offline media uploads');
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  if (!event.data) {
    return;
  }
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New message received',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: data.tag || 'message',
      data: data.data,
      actions: [
        {
          action: 'open',
          title: 'Open',
          icon: '/icons/open-icon.png'
        },
        {
          action: 'reply',
          title: 'Quick Reply',
          icon: '/icons/reply-icon.png'
        }
      ],
      requireInteraction: true
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'FUZO Chat', options)
    );
    
  } catch (error) {
    console.error('Error handling push notification:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click');
  
  event.notification.close();
  
  if (event.action === 'reply') {
    // Handle quick reply
    event.waitUntil(handleQuickReply(event.notification.data));
  } else {
    // Open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/chat') && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow('/chat');
        }
      })
    );
  }
});

// Handle quick reply from notification
async function handleQuickReply(data) {
  // This would typically open a small window or handle the reply
  console.log('Handling quick reply:', data);
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('Service Worker: Loaded');