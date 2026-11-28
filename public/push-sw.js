self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("push", (event) => {
  let d = { title: "Dental Clinic", body: "" };
  try { d = event.data.json(); } catch (_) { /* ignore */ }
  event.waitUntil(self.registration.showNotification(d.title, {
    body: d.body, icon: "/icon-192.png", badge: "/badge-96.png", dir: "rtl", lang: "ar",
    vibrate: [200, 100, 200], requireInteraction: true, tag: String(Date.now()),
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) if (c.url.includes("/doctor")) return c.focus();
    return self.clients.openWindow("/doctor");
  })());
});
