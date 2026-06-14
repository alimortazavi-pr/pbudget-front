/** جلوگیری از فلش تم */
export function ThemeScript() {
  const script = `(function(){try{var m=document.cookie.match(/(?:^|; )pbudget-theme=([^;]*)/);var l=document.cookie.match(/(?:^|; )dark-mode=([^;]*)/);var t=m&&m[1]==='dark'?'dark':m&&m[1]==='light'?'light':l&&l[1]==='true'?'dark':'light';var r=document.documentElement;r.classList.remove('light','dark');r.classList.add(t);r.dataset.theme=t;r.style.colorScheme=t;}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
