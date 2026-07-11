import { getTranslator } from "@/i18n";
const t = getTranslator();
import { defaultCache, PAGES_CACHE_NAME } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * App Router navigations and RSC payloads must not be cached with query strings.
 * Stale SW entries break client-side routing after a hard refresh on filtered pages.
 */
const dynamicNavigationCaching = [
  {
    matcher: ({
      request,
      sameOrigin,
      url: { pathname },
    }: {
      request: Request;
      sameOrigin: boolean;
      url: URL;
    }) =>
      sameOrigin &&
      !pathname.startsWith("/api/") &&
      (request.mode === "navigate" || request.headers.get("RSC") === "1"),
    handler: new NetworkOnly(),
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: dynamicNavigationCaching,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              key === PAGES_CACHE_NAME.html ||
              key === PAGES_CACHE_NAME.rsc ||
              key === PAGES_CACHE_NAME.rscPrefetch,
          )
          .map((key) => caches.delete(key)),
      ),
    ),
  );
});

self.addEventListener("push", (event) => {
  let payload: { title?: string; body?: string; url?: string } = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = { body: event.data?.text() };
  }

  const title = payload.title ?? t("auto.kd501173931");
  const body = payload.body ?? "";
  const url = payload.url ?? "/";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/assets/icons/icon-192x192.png",
      badge: "/assets/icons/icon-96x96.png",
      data: { url },
      dir: "rtl",
      lang: "fa",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data?.url as string | undefined) ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            void client.focus();
            if ("navigate" in client) {
              void (client as WindowClient).navigate(url);
            }
            return;
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
