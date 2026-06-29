self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {}
  const title = payload.title || 'Energy Dashboard'
  const body = payload.body || ''
  const data = payload.data || {}
  const options = {
    badge: payload.badge || '/favicon.svg',
    body,
    data,
    icon: payload.icon || '/apple-touch-icon.png',
    tag: payload.tag || 'energy-dashboard-notification',
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification?.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client && client.url.includes(targetUrl)) {
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }

      return undefined
    }),
  )
})
