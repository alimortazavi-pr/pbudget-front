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
  skipWaiting: true,
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
