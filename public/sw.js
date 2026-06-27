// Service Worker für Web Push. Wird registriert, wenn ein User
// Push-Benachrichtigungen in den Einstellungen aktiviert (siehe
// app/einstellungen/NotificationToggle.tsx).

self.addEventListener("push", (event) => {
  let data = { title: "Bellator", body: "Es gibt etwas Neues.", url: "/shop" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // Falls der Payload mal kein JSON ist, einfach den Default nehmen.
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/shop";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client)
          return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
