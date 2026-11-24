const V='moneytor-v3.0.3',FILES=['./','./index.html','./manifest.json','./icon-180.png','./icon-192.png','./icon-512.png','./favicon.svg','./favicon-48.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x!=='moneytor-cfg').map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin&&!u.hostname.includes('fonts.g'))return;
e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{if(res.ok&&(res.type==='basic'||u.hostname.includes('fonts.g'))){const cp=res.clone();caches.open(V).then(c=>c.put(e.request,cp))}return res}).catch(()=>caches.match('./index.html'))))});

/* ===== Notifikasi latar belakang ===== */
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{for(const c of l){if('focus' in c)return c.focus()}return self.clients.openWindow('./')}))});
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(_){try{d={body:e.data.text()}}catch(__){}}e.waitUntil(self.registration.showNotification(d.title||'MoneyTor',{body:d.body||'Ada pembaruan',tag:d.tag||'moneytor',icon:'icon-192.png',badge:'icon-192.png'}))});
self.addEventListener('periodicsync',e=>{if(e.tag==='moneytor-pn')e.waitUntil(pnBg())});
async function pnBg(){const c=await caches.open('moneytor-cfg'),r=await c.match('cfg');if(!r)return;const cfg=await r.json();if(!cfg||!cfg.on||!cfg.as||!cfg.as.length)return;
 const res=[];
 if(cfg.as.includes('BTC')){try{const j=await(await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=idr&include_24hr_change=true',{cache:'no-store'})).json();if(j.bitcoin&&j.bitcoin.idr)res.push(['BTC','Bitcoin',+j.bitcoin.idr_24h_change,'Rp '+String(Math.round(j.bitcoin.idr)).replace(/\B(?=(\d{3})+(?!\d))/g,'.'),'dalam 24 jam'])}catch(e){}}
 const st=cfg.as.filter(a=>a!=='BTC');
 if(st.length&&cfg.stkUrl){try{const u=new URL(cfg.stkUrl);u.searchParams.set('s',st.map(k=>k+'.JK').join(','));const j=await(await fetch(u.toString(),{cache:'no-store'})).json();st.forEach(k=>{const q=j[k+'.JK']||j[k];if(q&&q.p>0&&q.prev>0)res.push([k,k,(q.p-q.prev)/q.prev*100,'Rp '+String(Math.round(q.p)).replace(/\B(?=(\d{3})+(?!\d))/g,'.'),'dari penutupan kemarin'])})}catch(e){}}
 const lr=await c.match('last'),last=lr?await lr.json():{},td=new Date().toLocaleDateString('en-CA');let ch=false;
 for(const [k,nm,v,p,ket] of res){if(isNaN(v))continue;const hit=cfg.dir==='up'?v>=cfg.pct:cfg.dir==='down'?v<=-cfg.pct:Math.abs(v)>=cfg.pct;if(!hit)continue;const key=k+':'+(v>0?'u':'d');if(last[key]===td)continue;
  await self.registration.showNotification(nm+(v>0?' naik ':' turun ')+Math.abs(v).toFixed(2).replace('.',',')+'%',{body:p+' · '+ket,tag:'pn-'+key,icon:'icon-192.png',badge:'icon-192.png'});last[key]=td;ch=true}
 if(ch)await c.put('last',new Response(JSON.stringify(last)))}
