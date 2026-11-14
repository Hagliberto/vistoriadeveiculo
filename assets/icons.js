/* Ícones vetoriais locais. Sem dependência de CDN ou fontes externas. */
(() => {
  'use strict';
  const paths = {
    'list':'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    'columns':'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/>',
    'clipboard-text':'<rect x="4" y="5" width="16" height="16" rx="2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M8 12h8M8 16h6"/>',
    'gear':'<path d="M10.2 2h3.6l.5 2.2 2 .9 2-1.1 2.5 2.5-1.1 2 1 2 .2 3-2.2.6-.9 2 1.1 2-2.5 2.5-2-1.1-2 .9-.5 2.2h-3.6l-.5-2.2-2-.9-2 1.1-2.5-2.5 1.1-2-.9-2-2.2-.6v-3.6l2.2-.5.9-2-1.1-2 2.5-2.5 2 1.1 2-.9L10.2 2Z"/><circle cx="12" cy="12" r="3.1"/>',
    'printer':'<path d="M6 9V3h12v6M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6zM17 12h1"/>',
    'car-profile':'<path d="M3 14h18l-1.5-6a3 3 0 0 0-2.9-2.2H7.4A3 3 0 0 0 4.5 8L3 14Z"/><path d="M3 14v4a1 1 0 0 0 1 1h2v-2h12v2h2a1 1 0 0 0 1-1v-4"/><path d="M3.8 11h16.4"/><circle cx="6.5" cy="14.8" r="1"/><circle cx="17.5" cy="14.8" r="1"/>',
    'car':'<path d="M3 14h18l-2-6a2 2 0 0 0-2-1.5H7A2 2 0 0 0 5 8l-2 6Z"/><path d="M3 14v5h3v-2h12v2h3v-5"/><path d="M4.5 10h15"/><circle cx="6.5" cy="14.7" r="1"/><circle cx="17.5" cy="14.7" r="1"/>',
    'car-simple':'<path d="M5 17h14l2-5-3-4H6l-3 4 2 5Z"/><path d="M5 17v2h3v-2m8 0v2h3v-2"/><path d="M5 12h14m-12 3h1m8 0h1"/>',
    'check':'<path d="m5 12 4 4L19 6"/>',
    'checks':'<path d="m2 12 4 4 7-8"/><path d="m11 14 3 3 8-9"/>',
    'files':'<rect x="7" y="7" width="13" height="15" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2"/>',
    'check-circle':'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    'warning-circle':'<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 4h.01"/>',
    'x':'<path d="M18 6 6 18M6 6l12 12"/>',
    'caret-down':'<path d="m6 9 6 6 6-6"/>',
    'download-simple':'<path d="M12 3v12m-4-4 4 4 4-4M4 17v3h16v-3"/>',
    'upload-simple':'<path d="M12 17V5m-4 4 4-4 4 4M4 17v3h16v-3"/>',
    'export':'<path d="M12 3v12m-4-4 4 4 4-4M5 17v4h14v-4"/>',
    'floppy-disk':'<path d="M5 3h12l4 4v14H3V3h2Z"/><path d="M6 3v7h11V3M7 21v-8h10v8M9 6h5"/>',
    'folder-open':'<path d="M3 8V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v2"/><path d="M3 8h18l-2 12H5L3 8Z"/>',
    'trash':'<path d="M4 7h16m-13 0 1 14h8l1-14M9 7V4h6v3m-5 4v6m4-6v6"/>',
    'eraser':'<path d="m4 15 9-10a2 2 0 0 1 3 0l4 4a2 2 0 0 1 0 3l-8 8H9l-5-5Z"/><path d="m9 10 7 7M14 20h7"/>',
    'camera':'<path d="M3 7h4l2-3h6l2 3h4v13H3V7Z"/><circle cx="12" cy="13.5" r="4"/>',
    'map-pin':'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/>',
    'signature':'<path d="M3 19h18M3 15q2-2 4 0t4-1l5-9c.6-1 2.4 0 2 1.3L13 16q-1 2 1 2h5"/>',
    'shield-check':'<path d="m12 2 9 4v6c0 5-4 8-9 10-5-2-9-5-9-10V6l9-4Z"/><path d="m8 12 3 3 5-6"/>',
    'lightbulb':'<path d="M9 18h6m-5 3h4m-2-19a7 7 0 0 0-4 13v3h8v-3a7 7 0 0 0-4-13Z"/>',
    'identification-card':'<rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 16c1-2 5-2 6 0m3-6h5m-5 4h5"/>',
    'steering-wheel':'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M4 9h16M12 14v7m-4-9 2 2m6-2-2 2"/>',
    'tire':'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="2"/><path d="M12 3v4m0 10v4M3 12h4m10 0h4"/>',
    'engine':'<path d="M7 8h10v3h3v7h-4l-2 2H8l-2-3H3v-7h4V8Zm2 0V5m6 3V5"/><path d="M10 13h4"/>',
    'chat-text':'<path d="M3 4h18v14H8l-5 3V4Z"/><path d="M7 9h10m-10 4h7"/>'
  };
  const types = Object.keys(paths);
  function replaceIcon(i) {
    const name = types.find(key => i.classList.contains(`ph-${key}`));
    if (!name) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('fill','none');
    svg.setAttribute('stroke','currentColor');
    svg.setAttribute('stroke-width','1.85');
    svg.setAttribute('stroke-linecap','round');
    svg.setAttribute('stroke-linejoin','round');
    svg.setAttribute('aria-hidden','true');
    svg.setAttribute('focusable','false');
    svg.setAttribute('class', 'icon '+ [...i.classList].filter(c => !c.startsWith('ph-')).join(' '));
    if(i.id) svg.id=i.id;
    svg.innerHTML=paths[name];
    i.replaceWith(svg);
  }
  function scan(root) {
    if(root.nodeType !== 1 && root.nodeType !== 9) return;
    if(root.matches?.('i[class*="ph-"]')) replaceIcon(root);
    root.querySelectorAll?.('i[class*="ph-"]').forEach(replaceIcon);
  }
  function boot(){
    scan(document);
    new MutationObserver(changes=>{
      for(const change of changes) for(const node of change.addedNodes) scan(node);
    }).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
