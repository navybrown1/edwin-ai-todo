self.addEventListener("push", (event) => {
  const fallback = {
    body: "Your planner has something coming up.",
    tag: "planner-reminder",
    title: "Planner reminder",
    url: "/",
  };

  const payload = (() => {
    try {
      return event.data ? JSON.parse(event.data.text()) : fallback;
    } catch {
      return fallback;
    }
  })();

  event.waitUntil(
    self.registration.showNotification(payload.title || fallback.title, {
      body: payload.body || fallback.body,
      data: { url: payload.url || fallback.url },
      tag: payload.tag || fallback.tag,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clients) => {
      const existing = clients.find((client) => "focus" in client);
      if (existing) {
        existing.focus();
        if ("navigate" in existing) {
          return existing.navigate(destination);
        }
        return undefined;
      }

      return self.clients.openWindow(destination);
    }),
  );
});
