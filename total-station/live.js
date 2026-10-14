const D = __DATA__;
const P = D.P;
const K = { fadedSvg, iso, solidSvg, lineSvg, dotsSvg, pathOf, cylinder, knurl, sideArc, ring, lineOnTop, extrude, haloOf, insetPlan };
const PARTS = makeParts(K, G, P, M);
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const prismEl = svg.querySelector('[data-part="prism"]');
const alidadeEl = svg.querySelector('[data-part="alidade"]');
const beamEl = svg.querySelector('[data-part="beam"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

let t = D.t0, target = D.t0;
const s0 = M.sight(t);
let bearing = s0.bearing, tilt = s0.tilt, rate = { b: 0, v: 0 }, lock = 1;
let frame = 0, last = 0, clock = 0, touring = !still.matches, visible = false, idle = 0, drawn = "";
const TOUR = [0.5, 0.08, 0.08, 0.92, 0.92, 0.3, 0.3, 0.7, 0.7, 0.5];
const tourAt = (time) => {
  const step = 2.4, i = Math.floor(time / step) % TOUR.length;
  return TOUR[i];
};

function draw() {
  const sight = M.sight(t);
  const err = Math.hypot(wrap(sight.bearing - bearing), sight.tilt - tilt) / M.DEG;
  lock = clamp(1 - (err - 0.15) / 0.45, 0, 1);
  const phase = M.phaseOf(sight.slope);
  const key = [t.toFixed(4), bearing.toFixed(5), tilt.toFixed(5), lock.toFixed(2)].join();
  if (key === drawn) return;
  drawn = key;
  prismEl.innerHTML = PARTS.prismSide(t);
  alidadeEl.innerHTML = PARTS.alidade(bearing, tilt, phase.degrees, lock);
  beamEl.setAttribute("d", PARTS.beam(t, bearing, tilt));
  beamEl.style.opacity = lock.toFixed(2);
  const hz = "Hz " + M.dms(M.hzOf(bearing));
  const text = lock > 0.98 ? `${hz} · V ${M.dms(M.vOf(tilt)).slice(0, -3)} · SD ${sight.slope.toFixed(4)} m` : `${hz} · tracking…`;
  if (readout.textContent !== text) readout.textContent = text;
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) { clock += dt; target = tourAt(clock); }
  t = calm ? target : t + (target - t) * (1 - Math.exp(-dt / 0.45));
  if (Math.abs(target - t) < 1e-4) t = target;
  // the servo: a critically damped drive on each axis, chasing the prism the ATR sees
  const want = M.sight(t);
  if (calm) { bearing = want.bearing; tilt = want.tilt; rate = { b: 0, v: 0 }; }
  else for (let i = 0; i < 4; i++) {
    const h = dt / 4, w = 11;
    rate.b += (wrap(want.bearing - bearing) * w * w - 2 * w * rate.b) * h;
    rate.v += ((want.tilt - tilt) * w * w - 2 * w * rate.v) * h;
    bearing += rate.b * h;
    tilt += rate.v * h;
  }
  if (Math.abs(wrap(want.bearing - bearing)) < 1e-6 && Math.abs(rate.b) < 1e-5) { bearing = want.bearing; tilt = want.tilt; rate = { b: 0, v: 0 }; }
  draw();
  const settled = !touring && t === target && rate.b === 0;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => {
  touring = false;
  target = clamp(next, 0, 1);
  clearTimeout(idle);
  idle = setTimeout(() => { touring = !still.matches; clock = 0; run(); }, 3600);
  describe();
  run();
};
function describe() {
  const s = M.sight(target);
  stage.setAttribute("aria-valuenow", String(Math.round(target * 100)));
  stage.setAttribute("aria-valuetext", `Prism at ${s.slope.toFixed(3)} metres, horizontal angle ${M.hzOf(s.bearing).toFixed(1)} degrees`);
}
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointermove", (event) => {
  if (event.pointerType === "mouse" && !event.movementX && !event.movementY) return;
  const box = svg.getBoundingClientRect();
  steer(((event.clientX - box.left) / box.width - 0.2) / 0.6);
});
stage.addEventListener("pointerdown", (event) => {
  const box = svg.getBoundingClientRect();
  steer(((event.clientX - box.left) / box.width - 0.2) / 0.6);
});
stage.addEventListener("keydown", (event) => {
  const step = event.shiftKey ? 0.2 : 0.05;
  let to = null;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") to = target + step;
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") to = target - step;
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = 1;
  if (to === null) return;
  event.preventDefault();
  steer(to);
});
describe();
draw();
