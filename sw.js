const CACHE_NAME = 'roomrover-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/contact.html',
  '/properties.html',
  '/login.html',
  '/register.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/components/navbar.js',
  '/components/footer.js',
  '/components/owner-sidebar.js',
  '/components/tenant-sidebar.js',
  '/components/admin-sidebar.js',
  '/components/payment-methods.js',
  '/components/payment-form.js',
  '/components/property-card.js',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js',
  'https://unpkg.com/feather-icons',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'http://static.photos/house/320x240/1',
  'http://static.photos/house/200x200/1',
  'http://static.photos/house/200x200/2',
  'http://static.photos/people/200x200/1',
  'http://static.photos/people/200x200/2',
  'http://static.photos/people/200x200/3',
  'http://static.photos/people/200x200/4',
  'http://static.photos/people/200x200/5',
  'http://static.photos/people/200x200/6',
  'http://static.photos/people/200x200/7',
  'http://static.photos/office/640x360/1'
];
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});