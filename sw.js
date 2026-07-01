// MNEMO mobile — Service Worker
// เก็บ shell ของแอป (HTML/CSS/JS/ไอคอน) ไว้ใช้งานแบบออฟไลน์ได้
// ข้อมูลจริง (memories/categories/links/trash) ไม่ cache ที่นี่ เพราะต้องดึงสดจาก GitHub เสมอ

const CACHE_NAME = "mnemo-shell-v1";
const SHELL_FILES = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // ไม่ cache request ไปยัง GitHub API / Groq API — ต้องสดเสมอ
  if (url.hostname.includes("api.github.com") || url.hostname.includes("api.groq.com")) {
    return;
  }
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((resp) => {
        if (resp.ok && url.origin === self.location.origin) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
