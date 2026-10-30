(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms)), log = [];
  const ok = (n, c, x) => log.push((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  [' + x + ']' : ''));
  document.documentElement.setAttribute('data-theme', 'dark');
  const cv = () => document.querySelector('[data-cv]'), cur = () => [...cv().querySelectorAll('.cv-dots i')].findIndex(d => d.classList.contains('is-on'));
  const tag = () => cv().querySelector('[data-cv-tag]').textContent, col = () => document.querySelector('.hero .hw').style.color;
  await sleep(800);
  ok('7 slides in one frame', cv().querySelectorAll('.cv-slide').length === 7 && cv().querySelectorAll('.cv-dots i').length === 7);
  ok('starts on the Borobudur picture with the family line', cur() === 0 && /family/.test(tag()), tag());
  await sleep(5300);
  ok('changes by itself after 5 s', cur() === 1 && tag() === 'sizihwan · kaohsiung', cur() + ' ' + tag() + ' ' + col());
  // swipe left
  const r = cv().getBoundingClientRect(), y = r.top + r.height / 2, x0 = r.left + r.width * .75;
  const pe = (t, x, yy) => cv().dispatchEvent(new PointerEvent(t, { pointerId: 5, pointerType: 'touch', isPrimary: true, clientX: x, clientY: yy, bubbles: true }));
  pe('pointerdown', x0, y); for (let k = 1; k <= 8; k++) { await sleep(16); pe('pointermove', x0 - k * 25, y + 2); } pe('pointerup', x0 - 200, y + 2);
  cv().click(); await sleep(700);
  ok('swipe left goes to the next picture (and the swipe does not open the viewer)', cur() === 2 && !document.querySelector('.wp'), cur() + ' ' + tag());
  // swipe right twice
  for (let t = 0; t < 2; t++) { pe('pointerdown', x0 - 150, y); for (let k = 1; k <= 8; k++) { await sleep(16); pe('pointermove', x0 - 150 + k * 25, y); } pe('pointerup', x0 + 50, y); await sleep(700); }
  ok('swipe right goes back, and wraps from the first to the last', cur() === 0, cur());
  pe('pointerdown', x0 - 150, y); for (let k = 1; k <= 8; k++) { await sleep(16); pe('pointermove', x0 - 150 + k * 25, y); } pe('pointerup', x0 + 50, y); await sleep(700);
  ok('wraps to the last picture', cur() === 6 && tag() === 'kaohsiung × indonesia', cur() + ' ' + tag());
  // a mostly vertical move is left alone (page scroll)
  pe('pointerdown', x0, y); for (let k = 1; k <= 8; k++) { await sleep(16); pe('pointermove', x0 - k * 3, y + k * 20); } pe('pointerup', x0 - 24, y + 160); await sleep(500);
  ok('vertical swipe does not change the picture', cur() === 6, cur());
  // tap opens the viewer on the same picture
  cv().click(); await sleep(1500);
  const wp = document.querySelector('.wp'), img = wp && wp.querySelector('.wp-img');
  ok('tap opens the wallpaper viewer', !!wp && document.documentElement.classList.contains('wp-open'));
  ok('shows the matching full wallpaper', img && /wall-6\.jpg$/.test(img.src) && img.naturalWidth === 1179 && img.naturalHeight === 2556, img && img.src.split('/').pop() + ' ' + img.naturalWidth + 'x' + img.naturalHeight);
  ok('hint and counter shown', /長按|右鍵/.test(wp.querySelector('.wp-hint span').textContent) && wp.querySelector('.wp-n').textContent === '6 / 6', wp.querySelector('.wp-hint').textContent);
  await sleep(5500);
  ok('cover does not change while the viewer is open', cur() === 6);
  wp.querySelector('.wp-next').click(); await sleep(300);
  ok('next arrow (wraps 6 -> 1)', /wall-1\.jpg$/.test(img.src) && wp.querySelector('.wp-n').textContent === '1 / 6', img.src.split('/').pop());
  wp.querySelector('.wp-prev').click(); await sleep(300);
  ok('prev arrow', /wall-6\.jpg$/.test(img.src));
  const fig = wp.querySelector('.wp-fig').getBoundingClientRect(), wy = fig.top + fig.height / 2;
  wp.querySelector('.wp-scrim').dispatchEvent(new PointerEvent('pointerdown', { pointerId: 6, clientX: 300, clientY: wy, bubbles: true }));
  wp.querySelector('.wp-scrim').dispatchEvent(new PointerEvent('pointerup', { pointerId: 6, clientX: 150, clientY: wy + 5, bubbles: true }));
  wp.querySelector('.wp-scrim').click(); await sleep(300);
  ok('swipe in the viewer changes picture and does not close it', /wall-1\.jpg$/.test(img.src) && document.querySelector('.wp'), img.src.split('/').pop());
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await sleep(200);
  ok('keyboard arrow', /wall-2\.jpg$/.test(img.src));
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sleep(200);
  ok('Esc closes', !document.querySelector('.wp') && !document.documentElement.classList.contains('wp-open'));
  cv().click(); await sleep(400); document.querySelector('.wp-scrim').click(); await sleep(200);
  ok('tap on the dark backdrop closes', !document.querySelector('.wp'));
  cv().click(); await sleep(400); document.querySelector('.wp-x').click(); await sleep(200);
  ok('X closes', !document.querySelector('.wp'));
  location.hash = 'menu'; await sleep(400);
  ok('menu reel includes the wallpaper tip', [...document.querySelectorAll('.tick-i')].some(p => /桌布/.test(p.textContent)));
  location.hash = 'home'; await sleep(600);
  ok('back on the cover it starts again from the first picture', cur() === 0);
  return log;
})()
