import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { HERE, KIT, bundle, pageHtml, makeCommon } from "./common.mjs";
const k = await import(join(KIT, "iso-kit.mjs"));
const G = await import(join(KIT, "lathe.mjs"));
import { makeScene7, COLS, PERIOD } from "./scene7.mjs";

const WIDTH = 1200, HEIGHT = 400;
const ACCENT = "#33D6E8";
const probe = { origin: [0, 0], scale: 1, azimuth: 45, elevation: 30 };
const pre = makeScene7(k, G, probe, makeCommon(k, G, probe));
const KPX = 307 / (COLS.C - COLS.B);
const P0 = { origin: [600, 0], scale: KPX / Math.sqrt(1.6), azimuth: 45, elevation: 30 };
const ys = pre.extents().map((p) => k.iso(p, P0)[1]);
const top = Math.min(...ys), bottom = Math.max(...ys);
const P = { ...P0, origin: [600, 8 + (HEIGHT - 34 - (bottom - top)) / 2 - top] };
console.log("content height", (bottom - top).toFixed(0));
const C = makeCommon(k, G, P);
const SC = makeScene7(k, G, P, C);
const T0 = 6.4;
const f = SC.frame(T0);
const svgRaw = k.figureSvg({
  width: WIDTH, height: HEIGHT,
  label: "A survey site model on a board, with the new capture tools at work. Left: a drone with a LiDAR payload flies over a stand of trees; its scan line reaches the bare earth under them. Next: a drone with a full-frame camera takes overlapping photos over a shed, and points appear where two photos see the ground. Next: a person walks through a road culvert, the bank cut away, carrying a handheld SLAM scanner that maps the barrel as they go. Right: a scanning total station on a tripod turns a full circle and scans a retaining wall and the ground around it. The point cloud builds in cyan as they work." || " Left: a dumpy level on a tripod reads a staff on a benchmark, then a staff on a peg, and reduces the peg's level. Middle: a total station turns to a prism pole and shoots one feature at a time: fence posts, a manhole, a kerb. Right: a GNSS rover pole fixes points one by one from four satellites and a base station's radio corrections.",
  body: [SC.board(), ...["A", "B", "C", "D"].map((c) => `<g data-col="${c}">${f[c]}</g>`)],
});
const svg = svgRaw.replace("<svg ", "<svg ") + "";
const xOf = (u) => k.iso(SC.W(u, 0, 0), P)[0] / WIDTH * 100;
const readouts = ["A", "B", "C", "D"].map((c) => `<div class="ro" data-ro="${c}" style="left:${xOf(COLS[c]).toFixed(2)}%">${f.s["read" + c]}</div>`).join("");
const live = `
const P = ${JSON.stringify(P)};
const C = makeCommon(K, G, P);
const SC = makeScene7(K, G, P, C);
const cols = {}, ro = {};
for (const c of ["A", "B", "C", "D"]) { cols[c] = document.querySelector('[data-col="' + c + '"]'); ro[c] = document.querySelector('[data-ro="' + c + '"]'); }
function render(t) {
  const f = SC.frame(t);
  for (const c of ["A", "B", "C", "D"]) { cols[c].innerHTML = f[c]; const h = f.s["read" + c]; if (ro[c].innerHTML !== h) ro[c].innerHTML = h; }
}
window.__render = render;
window.__period = ${PERIOD};
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!location.hash.includes("frames") && !still) {
  const start = performance.now() - ${T0} * 1000;
  const loop = (now) => { render((now - start) / 1000); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
} else render(${T0});
`;
const strip = (s) => s.replace(/^import .*$/gm, "").replace(/^export /gm, "");
const script = bundle(join(KIT, "iso-kit.mjs"), "K") + bundle(join(KIT, "lathe.mjs"), "G").replace("const G = (() => {", "const G = (() => {const { cameraOf, iso, pathOf } = K;") + strip(readFileSync(join(HERE, "common.mjs"), "utf8")).replace(/^const HERE.*$/m, "").replace(/^const KIT.*$/m, "").replace(/^function bundle[\s\S]*?^}\n/m, "").replace(/^function pageHtml[\s\S]*?^}\n/m, "") + strip(readFileSync(join(HERE, "scene7.mjs"), "utf8")) + live;
writeFileSync(join(HERE, "slide7-new-toolkit.html"), pageHtml({ title: "The new toolkit", svg, readouts, script, accent: ACCENT }));
console.log("wrote slide7-new-toolkit.html", "scale", P.scale.toFixed(3));
