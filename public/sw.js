/**
 * Created by Renzie on 21/04/2017.
 */
'use strict';

var cacheName = 'v2';

var cacheFiles = [
    '/themes/jquery.mobile.icons.min.css',
    '/assets/css/reset.css',
    '/assets/css/screen.css',
    '/themes/',
    '/Offline.html',
    '/assets/jquery/jquery-2.1.4.min.js',
    '/assets/jquery/jquery.mobile.1.4.5.min.js',

];


self.addEventListener('install', function (e) {
    console.log('[ServiceWorker] Installed at :' + new Date().toLocaleTimeString());
    // e.waitUntil Delays the event until the Promise is resolved
    e.waitUntil(
        //Open the cache
        caches.open(cacheName).then(function (cache) {
            // Add all the default files to the cache
            console.log('[ServiceWorker] Caching cacheFiles');
            return cache.addAll(cacheFiles).then(function () {
                console.log(caches)
            }, function (error) {
                console.log(error)
            }).then(function () {
                return self.skipWaiting();
            });
        })
    );
});

self.addEventListener('activate', function (e) {
    console.log('[ServiceWorker] Activated');

    e.waitUntil(
        // Get all the cache keys (cacheName)
        caches.keys().then(function (cacheNames) {
            return Promise.all(cacheNames.map(function (thisCacheName) {

                // If a cached item is saved under a previous cacheName
                if (thisCacheName !== cacheName) {

                    // Delete that cached file
                    console.log('[ServiceWorker] Removing Cached Files from Cache - ', thisCacheName);
                    return caches.delete(thisCacheName);
                }
            }));
        })
    ); // end e.waitUntil

});


// NETWORK FIRST (vooral om de updates simpeler te houden)
self.addEventListener('fetch', function (e) {
    console.log('[ServiceWorker] Fetch', e.request.url);
    // e.respondWidth Responds to the fetch event

    if (!navigator.onLine) {
        fetchOffline(e);
    } else {
        fetchOnline(e);
    }
});

function fetchOffline(e) {
    e.respondWith(
        caches.match(e.request)
            .then(function (res) {
                if (res)
                    return res;

                return caches.match(new Request('/Offline.html'));
            })
    )
}

function fetchOnline(e) {
    e.respondWith(
        fetch(e.request).then(function (fResponse, reject) {
                return caches.open(cacheName).then(function (cache) {
                    if (!fResponse.ok) {
                        return cache.match(e.request);
                    } else {
                        cache.put(e.request, fResponse.clone());
                        return fResponse;
                    }
                })
            }
        ));
}


self.addEventListener("push", function (e) {
    var title = "Howest";
    var options = {
        body: "Hello world!",
        icon: "../../images/covers/defaultcover.jpg",
        badge: "../../images/covers/defaultcover.jpg"
    };

    e.waitUntil(self.registration.showNotification(title, options));
});