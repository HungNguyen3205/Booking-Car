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
  const run = async () => {
    try {
      const zoom = frame.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${innerWidth*.5-x}px,${innerHeight*.52-y}px) scale(6.5)`}], {duration:680,easing:'cubic-bezier(.45,0,.8,.45)',fill:'forwards'});
      animations.push(zoom);
      const cover = curtain.animate([{opacity:0},{opacity:1}],{duration:180,delay:510,fill:'forwards'}); animations.push(cover);
      await cover.finished;
      if (removed) return;
      overlay.dataset.searchCurtain = 'covered'; commit();
      // Existing page exit completes under the opaque curtain, then reveal results.
      const reveal = curtain.animate([{opacity:1},{opacity:0}],{duration:300,delay:260,fill:'forwards'}); animations.push(reveal);
      frame.style.visibility = 'hidden';
      await reveal.finished; cleanup();
    } catch { if (!removed) { commit(); cleanup(); } }
  };
  void run();
  // Once covered, the overlay owns its brief reveal after hero unmounts.
  return () => { if (!done) cleanup(); };
}
