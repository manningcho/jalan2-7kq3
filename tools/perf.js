(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await sleep(500);
  const nav = performance.getEntriesByType('navigation')[0], paint = performance.getEntriesByType('paint');
  const fcp = (paint.find(p => p.name === 'first-contentful-paint') || {}).startTime;
  let lcp = 0; try { await new Promise(r => { new PerformanceObserver(l => { l.getEntries().forEach(e => lcp = e.startTime); r(); }).observe({ type: 'largest-contentful-paint', buffered: true }); setTimeout(r, 500); }); } catch (e) {}
  const res = performance.getEntriesByType('resource'), by = {};
  res.forEach(r => { const k = /fonts\.g/.test(r.name) ? 'fonts' : /\.(jpg|png)/.test(r.name) ? 'images' : /\.js/.test(r.name) ? 'js' : /\.css/.test(r.name) ? 'css' : 'other'; by[k] = (by[k] || 0) + (r.transferSize || r.encodedBodySize || 0); });
  const kb = n => Math.round(n / 1024) + 'KB';
  const page = Object.values(by).reduce((a, b) => a + b, 0) + nav.transferSize;
  // what the offline copy downloads in the background
  await navigator.serviceWorker.ready; let last = -1, same = 0, bg = 0;
  for (let i = 0; i < 160; i++) { const k = await caches.keys(); let tot = 0;
    for (const name of k) { const c = await caches.open(name); for (const rq of await c.keys()) { const r = await c.match(rq); tot += (await r.clone().blob()).size; } }
    if (tot === last) { if (++same >= 3) { bg = tot; break; } } else same = 0; last = tot; await sleep(1000); }
  return { 'first paint (FCP)': Math.round(fcp) + 'ms', 'big picture shown (LCP)': Math.round(lcp) + 'ms', 'page fully loaded': Math.round(nav.loadEventEnd) + 'ms',
    'first screen download': kb(page), detail: Object.fromEntries(Object.entries(by).map(([k, v]) => [k, kb(v)])), 'offline copy stored in background': kb(bg) };
})()
