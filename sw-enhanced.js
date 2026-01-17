// Enhanced Service Worker for Offline Capability and Real-time Sync
const CACHE_NAME = 'arogyabandhu-v2';
const STATIC_CACHE = 'arogyabandhu-static-v2';
const DYNAMIC_CACHE = 'arogyabandhu-dynamic-v2';

// Critical files for offline functionality
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/index-3d.html',
    '/auth.html',
    '/patient-dashboard.html',
    '/pregnant-dashboard.html',
    '/doctor-dashboard.html',
    '/asha-dashboard.html',
    '/admin-dashboard.html',
    '/blood-donor.html',
    '/auth-enhanced.js',
    '/asha-enhanced.js',
    '/blood-donor-enhanced.js',
    '/script.js',
    '/styles.css',
    '/manifest.json',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// API endpoints to cache
const API_ENDPOINTS = [
    'https://disease.sh/v3/covid-19/all',
    'https://api.fda.gov/drug/label.json',
    'https://overpass-api.de/api/interpreter'
];

// Install event - cache critical assets
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Failed to cache static assets:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => 
                            cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName !== CACHE_NAME
                        )
                        .map(cacheName => {
                            console.log('Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('Service Worker: Old caches cleaned up');
                return self.clients.claim();
            })
    );
});

// Fetch event - handle requests with offline support
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle different request types
    if (request.method === 'GET') {
        // Handle static assets
        if (STATIC_ASSETS.some(asset => request.url.includes(asset)) || 
            url.pathname === '/' || 
            url.pathname.endsWith('.html') || 
            url.pathname.endsWith('.js') || 
            url.pathname.endsWith('.css')) {
            
            event.respondWith(
                caches.match(request)
                    .then(response => {
                        if (response) {
                            console.log('Service Worker: Serving from cache:', request.url);
                            return response;
                        }
                        
                        // Network first for static assets
                        return fetch(request)
                            .then(response => {
                                // Cache successful responses
                                if (response.ok) {
                                    const responseClone = response.clone();
                                    caches.open(STATIC_CACHE)
                                        .then(cache => cache.put(request, responseClone));
                                }
                                return response;
                            })
                            .catch(() => {
                                // Return offline page for HTML requests
                                if (request.url.endsWith('.html')) {
                                    return caches.match('/index.html');
                                }
                                return new Response('Offline', { 
                                    status: 503, 
                                    statusText: 'Service Unavailable' 
                                });
                            });
                    })
            );
            return;
        }
        
        // Handle API requests with network first strategy
        if (API_ENDPOINTS.some(endpoint => request.url.includes(endpoint))) {
            event.respondWith(
                fetch(request)
                    .then(response => {
                        // Cache API responses for 5 minutes
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(DYNAMIC_CACHE)
                                .then(cache => {
                                    cache.put(request, responseClone);
                                    console.log('Service Worker: API response cached:', request.url);
                                });
                        }
                        return response;
                    })
                    .catch(() => {
                        // Try to get cached API response
                        return caches.match(request)
                            .then(cachedResponse => {
                                if (cachedResponse) {
                                    console.log('Service Worker: Serving cached API response:', request.url);
                                    return cachedResponse;
                                }
                                
                                // Return mock data for critical APIs
                                return getMockApiResponse(request.url);
                            });
                    })
            );
            return;
        }
        
        // Handle other requests with cache first strategy
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) {
                        // Update cache in background
                        fetch(request)
                            .then(fetchResponse => {
                                if (fetchResponse.ok) {
                                    caches.open(DYNAMIC_CACHE)
                                        .then(cache => cache.put(request, fetchResponse));
                                }
                            });
                        
                        console.log('Service Worker: Serving from cache:', request.url);
                        return response;
                    }
                    
                    // Network request for uncached content
                    return fetch(request)
                        .then(response => {
                            // Cache successful responses
                            if (response.ok) {
                                const responseClone = response.clone();
                                caches.open(DYNAMIC_CACHE)
                                    .then(cache => cache.put(request, responseClone));
                            }
                            return response;
                        })
                        .catch(() => {
                            // Return appropriate offline response
                            return getOfflineResponse(request.url);
                        });
                })
        );
    }
    
    // Handle POST requests (form submissions, data sync)
    if (request.method === 'POST') {
        event.respondWith(
            handlePostRequest(request)
        );
    }
});

// Handle POST requests for offline functionality
async function handlePostRequest(request) {
    try {
        const clonedRequest = request.clone();
        const requestData = await clonedRequest.json();
        
        // Store POST data for sync when online
        const offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
        offlineQueue.push({
            url: request.url,
            method: request.method,
            data: requestData,
            timestamp: new Date().toISOString(),
            id: Date.now()
        });
        
        // Store in IndexedDB for better persistence
        storeOfflineRequest({
            url: request.url,
            method: request.method,
            data: requestData,
            timestamp: new Date().toISOString(),
            id: Date.now()
        });
        
        console.log('Service Worker: POST request queued for sync:', request.url);
        
        return new Response(JSON.stringify({
            success: true,
            message: 'Request queued for sync when online',
            queued: true
        }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Service Worker: Error handling POST request:', error);
        return new Response(JSON.stringify({
            success: false,
            message: 'Failed to process request'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Store offline requests in IndexedDB
function storeOfflineRequest(requestData) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ArogyaBandhuOfflineDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            
            if (!db.objectStoreNames.contains('offlineQueue')) {
                db.createObjectStore('offlineQueue', { keyPath: 'id' });
            }
            
            const transaction = db.transaction(['offlineQueue'], 'readwrite');
            const store = transaction.objectStore('offlineQueue');
            
            store.add(requestData);
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        };
    });
}

// Get mock API responses for offline mode
function getMockApiResponse(url) {
    const mockResponses = {
        'disease.sh': {
            cases: 1000000,
            deaths: 25000,
            recovered: 950000,
            updated: new Date().toISOString()
        },
        'fda.gov': {
            results: [{
                generic_name: 'Paracetamol',
                purpose: ['Fever', 'Headache', 'Body pain'],
                warnings: ['Consult doctor before use']
            }]
        },
        'overpass-api': {
            elements: [
                {
                    tags: { name: 'District Hospital', amenity: 'hospital' },
                    lat: 28.6139,
                    lon: 77.2090
                }
            ]
        }
    };
    
    for (const [key, response] of Object.entries(mockResponses)) {
        if (url.includes(key)) {
            console.log('Service Worker: Serving mock API response for:', key);
            return new Response(JSON.stringify(response), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    
    return new Response('Offline', { 
        status: 503, 
        statusText: 'Service Unavailable' 
    });
}

// Get appropriate offline responses
function getOfflineResponse(url) {
    if (url.includes('.html')) {
        return caches.match('/index.html');
    }
    
    if (url.includes('dashboard')) {
        return new Response(`
            <html>
                <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                    <h2>📴 Offline Mode</h2>
                    <p>You are currently offline. Some features may be limited.</p>
                    <p>Your data will sync automatically when you're back online.</p>
                    <button onclick="window.location.reload()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Retry
                    </button>
                </body>
            </html>
        `, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });
    }
    
    return new Response('Offline - No cached data available', { 
        status: 503, 
        statusText: 'Service Unavailable' 
    });
}

// Sync offline requests when online
self.addEventListener('sync', event => {
    console.log('Service Worker: Sync event triggered');
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            syncOfflineRequests()
        );
    }
});

// Sync queued offline requests
async function syncOfflineRequests() {
    try {
        const dbRequest = indexedDB.open('ArogyaBandhuOfflineDB', 1);
        
        dbRequest.onsuccess = () => {
            const db = dbRequest.result;
            const transaction = db.transaction(['offlineQueue'], 'readwrite');
            const store = transaction.objectStore('offlineQueue');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
                const offlineRequests = getAllRequest.result;
                
                // Sync each request
                const syncPromises = offlineRequests.map(async (requestData) => {
                    try {
                        const response = await fetch(requestData.url, {
                            method: requestData.method,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(requestData.data)
                        });
                        
                        if (response.ok) {
                            // Remove synced request from queue
                            store.delete(requestData.id);
                            console.log('Service Worker: Request synced successfully:', requestData.url);
                            return true;
                        }
                        return false;
                    } catch (error) {
                        console.error('Service Worker: Failed to sync request:', requestData.url, error);
                        return false;
                    }
                });
                
                Promise.all(syncPromises).then(results => {
                    const syncedCount = results.filter(r => r).length;
                    console.log(`Service Worker: Synced ${syncedCount}/${offlineRequests.length} requests`);
                    
                    // Notify all clients about sync completion
                    self.clients.matchAll().then(clients => {
                        clients.forEach(client => {
                            client.postMessage({
                                type: 'SYNC_COMPLETE',
                                syncedCount,
                                totalCount: offlineRequests.length
                            });
                        });
                    });
                });
            };
        };
    } catch (error) {
        console.error('Service Worker: Error during sync:', error);
    }
}

// Handle push notifications
self.addEventListener('push', event => {
    console.log('Service Worker: Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New notification from ArogyaBandhu',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Open App'
            },
            {
                action: 'close',
                title: 'Close'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('ArogyaBandhu', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // Just close the notification
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Handle message events from clients
self.addEventListener('message', event => {
    console.log('Service Worker: Message received from client:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'FORCE_SYNC') {
        event.waitUntil(
            syncOfflineRequests()
        );
    }
});

// Background sync registration
self.addEventListener('periodicsync', event => {
    console.log('Service Worker: Periodic sync triggered');
    
    if (event.tag === 'periodic-sync') {
        event.waitUntil(
            syncOfflineRequests()
        );
    }
});

// Cleanup old cache entries
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CLEANUP_CACHE') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE)
                .then(cache => {
                    return cache.keys()
                        .then(keys => {
                            const now = Date.now();
                            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                            
                            return Promise.all(
                                keys.map(key => {
                                    cache.match(key).then(response => {
                                        if (response && (now - response.headers.get('date')) > maxAge) {
                                            return cache.delete(key);
                                        }
                                    });
                                })
                            );
                        });
                })
        );
    }
});

console.log('Service Worker: Enhanced offline service worker loaded successfully');
