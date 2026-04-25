self.addEventListener('push', event => {
  const payload = event.data?.json?.() || {};
  const title = payload.title || 'Zikir Hatırlatması';
  const options = {
    body: payload.body || 'Zikir vaktiniz geldi.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-128x128.png',
    tag: payload.tag || 'dd-reminder',
    data: payload.data || { url: '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'dd-reminder-sync' });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return Promise.resolve();
    })
  );
});
