// Service Worker for Lo Push Notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'New Lo Message',
    body: 'You have a new message nearby',
    icon: '/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png',
    badge: '/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png',
    vibrate: [200, 100, 200],
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        vibrate: data.vibrate || notificationData.vibrate,
        data: data.data || {},
        tag: data.tag,
        requireInteraction: data.requireInteraction || false,
        actions: data.actions || []
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Send message to client with notification data
          client.postMessage({
            type: 'notification-click',
            data: event.notification.data
          });
          return client.focus();
        }
      }
      // If app is not open, open it
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Background sync for offline messages
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncOfflineMessages());
  }
});

async function syncOfflineMessages() {
  try {
    // Get offline messages from IndexedDB
    const db = await openDB();
    const tx = db.transaction('offline_messages', 'readonly');
    const store = tx.objectStore('offline_messages');
    const messages = await store.getAll();

    // Send each message to the server
    for (const message of messages) {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
    }

    // Clear offline messages after successful sync
    const clearTx = db.transaction('offline_messages', 'readwrite');
    const clearStore = clearTx.objectStore('offline_messages');
    await clearStore.clear();
  } catch (error) {
    console.error('Error syncing offline messages:', error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LoAppDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline_messages')) {
        db.createObjectStore('offline_messages', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}