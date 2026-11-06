// Viewport overlay survives the hero's exit, without transforming its form/UI.
// Departure: the bus keeps its size and accelerates right, toward the destination
// landmark; a navy curtain wipes in behind it in the same direction, then wipes
// out to reveal the results. Photos are never upscaled, so they stay sharp.
export function startSearchTransition(source: SVGSVGElement | null, navigate: () => void): () => void {
  let done = false, removed = false;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const overlay = document.createElement('div');
  overlay.dataset.searchCurtain = 'approaching';
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, { position:'fixed', inset:'0', zIndex:'9999', overflow:'hidden', pointerEvents:'auto' });
  const sourceVisibility = source?.style.visibility || '';
  const animations: Animation[] = [];
  let fallback = 0;
  const commit = () => { if (!done) { done = true; navigate(); } };
  const cleanup = () => {
    if (removed) return;
    removed = true; clearTimeout(fallback); animations.forEach(a => a.cancel());
    media.removeEventListener('change', reduce); window.removeEventListener('pagehide', cleanup); overlay.remove();
    if (source) source.style.visibility = sourceVisibility;
  };
  const reduce = () => { if (media.matches) { commit(); cleanup(); } };
  if (media.matches || !source || typeof overlay.animate !== 'function') { commit(); return cleanup; }
  const clone = source.cloneNode(true) as SVGSVGElement;
  // Only clone the rendered vehicle; remove test IDs and freeze its current pose.
  clone.removeAttribute('data-testid');
  const original = source.querySelector<SVGGElement>('[data-vehicle]:last-child');
  const copied = clone.querySelector<SVGGElement>('[data-vehicle]:last-child');
  if (!original || !copied) { commit(); return cleanup; }
  const box = source.getBoundingClientRect(), bus = (original.querySelector('[data-vehicle-photo]') || original).getBoundingClientRect();
  copied.style.transform = getComputedStyle(original).transform;
  copied.style.opacity = '1';
  clone.querySelectorAll('[data-testid],[data-vehicle],[data-vehicle-photo]').forEach(el => {
    el.removeAttribute('data-testid'); el.removeAttribute('data-vehicle'); el.removeAttribute('data-vehicle-photo');
  });
  Object.assign(clone.style, { position:'absolute', left:`${box.left}px`, top:`${box.top}px`, width:`${box.width}px`, height:`${box.height}px` });

  // Origin side dims, destination side stays bright: "heading there".
  const shade = document.createElement('div');
  Object.assign(shade.style, { position:'absolute', inset:'0', opacity:'0', pointerEvents:'none',
    background:'linear-gradient(90deg, rgba(16,39,68,.42) 0%, rgba(16,39,68,.16) 45%, rgba(255,246,222,0) 70%, rgba(255,236,190,.18) 100%)' });

  // Curtain sits under the bus, so the bus drives out over the wipe.
  const curtain = document.createElement('div');
  Object.assign(curtain.style, { position:'absolute', inset:'0', display:'flex', alignItems:'center', justifyContent:'center',
    background:'linear-gradient(180deg, #102744 0%, #0d1b2a 100%)', clipPath:'inset(0 100% 0 0)', pointerEvents:'none' });
  const hud = document.createElement('div');
  hud.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;color:#fff;text-align:center;font-family:inherit;padding:0 24px;';
  hud.innerHTML = `
    <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 14px;border-radius:9999px;background:rgba(245,174,27,0.15);border:1px solid rgba(245,174,27,0.35);color:#F5AE1B;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">✦ DANAVA GO KHỞI HÀNH</div>
    <div style="font-size:17px;font-weight:700;letter-spacing:-0.2px;color:#F8FAFC;">Đang tìm chuyến xe phù hợp nhất…</div>
    <div style="position:relative;width:140px;height:3px;background:rgba(255,255,255,0.15);border-radius:9999px;overflow:hidden;margin-top:2px;"><div data-search-progress style="position:absolute;inset:0;background:linear-gradient(90deg,#F5AE1B,#EE3132);transform-origin:left;transform:scaleX(0);"></div></div>`;
  curtain.append(hud);

  const frame = document.createElement('div');
  frame.dataset.searchVehicle = '';
  Object.assign(frame.style, { position:'absolute', inset:'0', willChange:'transform' });
  frame.append(clone);
  // Wind streaks trail the bus and travel with it.
  const streaks = [.38, .58, .76].map((at, i) => {
    const line = document.createElement('div');
    const length = Math.max(60, bus.width * (.42 - i*.08));
    Object.assign(line.style, { position:'absolute', left:`${bus.left - length + bus.width*.08}px`, top:`${bus.top + bus.height*at}px`,
      width:`${length}px`, height:'2px', borderRadius:'2px', opacity:'0', transformOrigin:'right center',
      background:'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.85))', boxShadow:'0 0 6px rgba(255,255,255,.5)' });
    frame.append(line);
    return line;
  });

  overlay.append(shade, curtain, frame); document.body.append(overlay);
  source.style.visibility = 'hidden';
  clone.style.visibility = 'visible';
  media.addEventListener('change', reduce); window.addEventListener('pagehide', cleanup);
  fallback = window.setTimeout(() => { commit(); cleanup(); }, 2400);

  const run = async () => {
    try {
      // Far enough that the whole bus leaves the viewport on the right.
      const distance = Math.max(innerWidth - bus.left + 40, bus.width + 40);
      const DRIVE = 1000;
      // Gentle pull-away, then accelerating out of frame.
      const drive = frame.animate([
        { transform:'translate3d(0,0,0) scale(1)' },
        { transform:`translate3d(${distance}px,0,0) scale(1.03)` },
      ], { duration:DRIVE, easing:'cubic-bezier(.45,0,.75,.55)', fill:'forwards' });
      animations.push(drive);
      streaks.forEach((line, i) => animations.push(line.animate([
        { opacity:0, transform:'scaleX(.2)' }, { opacity:.8, transform:'scaleX(1)', offset:.55 }, { opacity:.55, transform:'scaleX(1.4)' },
      ], { duration:DRIVE - 120, delay:120 + i*50, easing:'ease-out', fill:'forwards' })));
      animations.push(shade.animate([{ opacity:0 }, { opacity:1 }], { duration:500, easing:'ease-out', fill:'forwards' }));
      const progress = hud.querySelector<HTMLElement>('[data-search-progress]');
      if (progress) animations.push(progress.animate([{ transform:'scaleX(0)' }, { transform:'scaleX(1)' }], { duration:900, delay:380, easing:'ease-in-out', fill:'forwards' }));

      const cover = curtain.animate([
        { clipPath:'inset(0 100% 0 0)' }, { clipPath:'inset(0 0% 0 0)' },
      ], { duration:560, delay:420, easing:'cubic-bezier(.5,0,.5,1)', fill:'forwards' });
      animations.push(cover);
      await Promise.all([cover.finished, drive.finished]);

      if (removed) return;
      overlay.dataset.searchCurtain = 'covered';
      frame.style.visibility = 'hidden';
      shade.style.visibility = 'hidden';
      commit();

      // The page swaps under the opaque curtain, which then exits to the right.
      const reveal = curtain.animate([
        { clipPath:'inset(0 0 0 0%)' }, { clipPath:'inset(0 0 0 100%)' },
      ], { duration:460, delay:200, easing:'cubic-bezier(.6,0,.4,1)', fill:'forwards' });
      animations.push(reveal);
      await reveal.finished;
      cleanup();
    } catch {
      if (!removed) { commit(); cleanup(); }
    }
  };
  void run();
  // Once covered, the overlay owns its brief reveal after hero unmounts.
  return () => { if (!done) cleanup(); };
}
