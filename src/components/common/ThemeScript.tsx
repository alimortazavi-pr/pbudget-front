import { CUSTOM_THEME_BOOT_SCRIPT } from "@/common/theme/custom-theme";

/** Prevent theme flash on first paint (the old language choice is cleared; the app is Persian only). */
export function ThemeScript() {
  const script = `(function(){try{var m=document.cookie.match(/(?:^|; )pbudget-theme=([^;]*)/);var l=document.cookie.match(/(?:^|; )dark-mode=([^;]*)/);var t=m&&m[1]==='dark'?'dark':m&&m[1]==='light'?'light':l&&l[1]==='true'?'dark':'light';var r=document.documentElement;r.classList.remove('light','dark');r.classList.add(t);r.dataset.theme=t;r.style.colorScheme=t;localStorage.removeItem('pb_lang');}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script + CUSTOM_THEME_BOOT_SCRIPT }} />;
}
