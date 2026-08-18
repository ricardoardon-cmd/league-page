import { build, files, version } from '$service-worker';

const CACHE = `ggl-${version}`;

// Cache the built app shell and small static assets, but deliberately avoid
// archive media so installing GGL does not download the photo/video library.
const ASSETS = [...build, ...files].filter(
	(path) => !path.startsWith('/archive/') && !path.match(/\.(?:mp4|mov|webm|heic)$/i)
);

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then(async (keys) => {
			for (const key of keys) {
				if (key !== CACHE) await caches.delete(key);
			}
		})
	);
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);
	if (url.origin !== self.location.origin) return;

	// Never cache dynamic endpoints or archive media. League/Sleeper data should
	// continue to come from the network exactly as it does on the website today.
	if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/archive/')) return;

	if (ASSETS.includes(url.pathname)) {
		event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
		return;
	}

	// For pages, prefer the network so users always see current league data.
	// If the connection is unavailable, fall back to an already cached response
	// when one exists, without turning normal browsing into stale-first behavior.
	if (event.request.mode === 'navigate') {
		event.respondWith(
			fetch(event.request).catch(async () => {
				return (await caches.match(event.request)) || (await caches.match('/')) || Response.error();
			})
		);
	}
});
