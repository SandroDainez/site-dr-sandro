// Service worker do PWA. ESTRATÉGIA: rede-primeiro (nunca serve versão velha;
// só cai no cache quando offline). Bump o CACHE ao mudar a estratégia.
const CACHE = "portal-v3";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // só mesmo domínio
  if (url.pathname.startsWith("/api/")) return;            // nunca cacheia API
  if (url.pathname.startsWith("/admin")) return;           // admin sempre fresco

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || (req.mode === "navigate" ? caches.match("/minha-area") : Response.error()))
      )
  );
});

// ── Notificações push (lembretes de estudo) ──────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { titulo: "Hora de estudar", corpo: "Você tem questões para revisar hoje.", url: "/estudar" };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch {}
  event.waitUntil(
    self.registration.showNotification(data.titulo, {
      body: data.corpo,
      icon: "/icon-192",
      badge: "/icon-192",
      data: { url: data.url || "/minha-area" },
      vibrate: [80, 40, 80],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/minha-area";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cls) => {
      for (const c of cls) { if ("focus" in c) { c.navigate(url); return c.focus(); } }
      return self.clients.openWindow(url);
    })
  );
});
