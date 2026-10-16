import { CUSTOM_THEME_BOOT_SCRIPT } from "@/common/theme/custom-theme";

/**
 * Prevent theme flash on first paint (the old language choice is cleared; the
 * app is Persian only). Public content pages are server-rendered, so visitors
 * see them at once instead of waiting behind the splash (better LCP).
 */
export function ThemeScript() {
  const script = `(function(){try{var m=document.cookie.match(/(?:^|; )pbudget-theme=([^;]*)/);var l=document.cookie.match(/(?:^|; )dark-mode=([^;]*)/);var t=m&&m[1]==='dark'?'dark':m&&m[1]==='light'?'light':l&&l[1]==='true'?'dark':'light';var r=document.documentElement;r.classList.remove('light','dark');r.classList.add(t);r.dataset.theme=t;r.style.colorScheme=t;localStorage.removeItem('pb_lang');var p=location.pathname,a=/(?:^|; )pdesk-personal-auth=/.test(document.cookie);if(/^\/(pricing|download|privacy|faq|learn)(\/|$)/.test(p)||(p==='/'&&!a)){r.dataset.ready='true';}}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script + CUSTOM_THEME_BOOT_SCRIPT }} />;
}
