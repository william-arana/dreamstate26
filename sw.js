const C='ds26-v11';const SHELL=['./','index.html','data.js','logo.png','icon-180.png','map.jpg','og-fanmade.jpg','live-timing.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C&&k!=='ds26-img').map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});

// Tell open pages what happened: 'fresh' = network answered and nothing changed, 'updated' = a newer copy was saved.
const tell=(type)=>self.clients.matchAll({includeUncontrolled:true}).then(cs=>cs.forEach(c=>c.postMessage({ds26:type,at:Date.now()})));

self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET')return;
 if(u.origin===location.origin){
  // Saved copy first, network in the background. With bad festival signal the page
  // never waits on a request that hangs; a new version shows on the next open.
  const nav=e.request.mode==='navigate';
  const home=nav&&/\/(index\.html)?$/.test(u.pathname);
  const key=home?'index.html':e.request;
  const main=home||/\/(index\.html|data\.js)$/.test(u.pathname);
  e.respondWith(caches.open(C).then(c=>c.match(key,{ignoreSearch:true}).then(cached=>{
   const old=main&&cached?cached.clone():null; // copy before the saved one is handed to the page
   const net=fetch(nav?u.href:e.request,{cache:'no-cache'}).then(async r=>{
    if(r.ok){
     let changed=false;
     if(old){const [a,b]=await Promise.all([old.text(),r.clone().text()]);changed=a!==b}
     await c.put(key,r.clone());
     if(main)tell(changed?'updated':'fresh');
    }
    return r});
   if(cached){e.waitUntil(net.catch(()=>{}));return cached}
   return net.catch(()=>nav?c.match('index.html'):Response.error());
  })));return}
 if(u.hostname.endsWith('mzstatic.com')){ // cover art: cache first
  e.respondWith(caches.open('ds26-img').then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(n=>{c.put(e.request,n.clone());return n}))));}
});
