/** Prevent theme/language flash on first paint */
export function ThemeScript() {
  const script = `(function(){try{var m=document.cookie.match(/(?:^|; )pbudget-theme=([^;]*)/);var l=document.cookie.match(/(?:^|; )dark-mode=([^;]*)/);var t=m&&m[1]==='dark'?'dark':m&&m[1]==='light'?'light':l&&l[1]==='true'?'dark':'light';var r=document.documentElement;r.classList.remove('light','dark');r.classList.add(t);r.dataset.theme=t;r.style.colorScheme=t;var lang=localStorage.getItem('pb_lang');if(lang==='en'){r.lang='en';r.dir='ltr';}else if(lang==='ar'){r.lang='ar';r.dir='rtl';}else{r.lang='fa';r.dir='rtl';}}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
