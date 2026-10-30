// Viewport overlay survives the hero's exit, without transforming its form/UI.
export function startSearchTransition(source: SVGSVGElement | null, navigate: () => void): () => void {
  let done = false, removed = false;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const overlay = document.createElement('div');
  overlay.dataset.searchCurtain = 'approaching';
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, { position:'fixed', inset:'0', zIndex:'9999', overflow:'hidden', pointerEvents:'auto' });
  const curtain = document.createElement('div');
  Object.assign(curtain.style, { position:'absolute', inset:'0', background:'#102744', opacity:'0' });
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
  const frame = document.createElement('div');
  Object.assign(frame.style, { position:'absolute', inset:'0', transformOrigin:'center' });
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
  // Atlas clip IDs are local to the clone and do not need external references.
  Object.assign(clone.style, { position:'absolute', left:`${box.left}px`, top:`${box.top}px`, width:`${box.width}px`, height:`${box.height}px` });
  const x = bus.left + bus.width*.72, y = bus.top + bus.height*.55;
  frame.style.transformOrigin = `${x}px ${y}px`;
  frame.append(clone); overlay.append(frame, curtain); document.body.append(overlay);
  source.style.visibility = 'hidden';
  clone.style.visibility = 'visible';
  media.addEventListener('change', reduce); window.addEventListener('pagehide', cleanup);
  fallback = window.setTimeout(() => { commit(); cleanup(); }, 1800);
    Object.assign(curtain.style, {
      position: 'absolute',
      inset: '0',
      background: 'linear-gradient(180deg, rgba(16, 39, 68, 0.94) 0%, rgba(13, 27, 42, 0.98) 100%)',
      opacity: '0',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none'
    });
    const hud = document.createElement('div');
    hud.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;color:#fff;text-align:center;font-family:sans-serif;';
    hud.innerHTML = `
      <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 14px;border-radius:9999px;background:rgba(245,174,27,0.15);border:1px solid rgba(245,174,27,0.35);color:#F5AE1B;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
        ✦ DANAVA GO KHỞI HÀNH
      </div>
      <div style="font-size:17px;font-weight:700;letter-spacing:-0.2px;color:#F8FAFC;">
        Đang tìm chuyến xe phù hợp nhất…
      </div>
      <div style="width:140px;height:3px;background:rgba(255,255,255,0.15);border-radius:9999px;overflow:hidden;margin-top:2px;">
        <div style="width:100%;height:100%;background:linear-gradient(90deg, #F5AE1B, #EE3132);animation:shimmer 0.8s infinite linear;"></div>
      </div>
    `;
    curtain.append(hud);
    const run = async () => {
      try {
        // Natural forward departure along the highway lane (exceeds 1.3 scale for perspective without giant 6.5x pixelation)
        const forwardX = Math.min(innerWidth * 0.35, 480);
        const forwardY = Math.min(innerHeight * 0.06, 40);
        const drive = frame.animate([
          { transform: 'translate(0px, 0px) scale(1)', filter: 'drop-shadow(0 4px 12px rgba(16,39,68,0.2))' },
          { transform: `translate(${forwardX}px, ${forwardY}px) scale(1.36)`, filter: 'drop-shadow(0 16px 28px rgba(16,39,68,0.4))' }
        ], { duration: 640, easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)', fill: 'forwards' });
        animations.push(drive);

        const cover = curtain.animate([
          { opacity: 0 },
          { opacity: 1 }
        ], { duration: 200, delay: 480, fill: 'forwards' });
        animations.push(cover);
        await cover.finished;

        if (removed) return;
        overlay.dataset.searchCurtain = 'covered';
        commit();

        // Existing page exit completes under the opaque curtain, then smoothly reveals search results
        const reveal = curtain.animate([
          { opacity: 1 },
          { opacity: 0 }
        ], { duration: 280, delay: 180, fill: 'forwards' });
        animations.push(reveal);
        frame.style.visibility = 'hidden';
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
