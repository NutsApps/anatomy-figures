import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL = join(HERE, "..", ".claude", "skills", "anatomy");
const k = await import(join(SKILL, "kit", "iso-kit.mjs"));
const G = await import(join(SKILL, "kit", "lathe.mjs"));
const { kitScript } = await import(join(SKILL, "scripts", "inline-kit.mjs"));
import * as M from "./model.mjs";
import { makeParts } from "./parts.mjs";

const theme = process.argv.includes("--dark") ? "dark" : "light";
const WIDTH = 600, HEIGHT = 500;
const ext = [[-60, -60, 0], [60, 60, 0], [0, 0, 160], [M.RAIL_A[0], M.RAIL_A[1], 0], [M.RAIL_B[0], M.RAIL_B[1], 190], [M.RAIL_A[0] - 60, M.RAIL_A[1] + 40, 0], [M.RAIL_B[0] + 40, M.RAIL_B[1] - 60, 0]];
const P = k.fitProjection(makeParts(k, G, { origin: [0, 0], scale: 1, azimuth: 62 }, M).extents(), WIDTH, HEIGHT, { pad: 22, azimuth: 62 });
const PARTS = makeParts(k, G, P, M);
const T0 = 0.5;
const s0 = M.sight(T0);
const svg = k.figureSvg({
  width: WIDTH, height: HEIGHT,
  label: "A robotic total station on a survey pier, its telescope locked on a round prism that stands on a carriage on an oblique rail bench. A glass code circle under the instrument is read by two heads that turn with it; a second circle beside the telescope gives the vertical angle; a laser beam runs from the telescope to the prism and back.",
  body: [PARTS.bench(), `<g data-part="prism">${PARTS.prismSide(T0)}</g>`, `<path data-part="beam" class="iso-line" data-tone="lit" d="${PARTS.beam(T0, s0.bearing, s0.tilt)}"/>`, PARTS.fixedBase(), `<g data-part="alidade">${PARTS.alidade(s0.bearing, s0.tilt, M.phaseOf(s0.slope).degrees, 1)}</g>`],
});
const body = k.plateHtml({
  fig: "Fig 1",
  title: "Total station",
  hint: "Hover or ← → to slide the prism",
  readout: `Hz ${M.dms(M.hzOf(s0.bearing))} · V ${M.dms(M.vOf(s0.tilt)).slice(0, -3)} · SD ${s0.slope.toFixed(4)} m`,
  keys: [
    { mark: "lit", label: "The measuring beam: a laser modulated at 99.93 MHz, sent to the prism and back along the same path" },
    { mark: "raised", label: "Glass code circles: the horizontal one is fixed to the tribrach, the vertical one turns with the telescope; read heads sit over their tracks" },
    { mark: "edge", label: "The display: modulation sent (upper trace) and received (lower), shifted by the phase of the round trip" },
  ],
  caption:
    "A robotic total station on a survey pier, locked on a round prism that slides along a bench 1.0 to 1.4 m away, drawn to scale. Angle: the horizontal circle stays still while two read heads, opposite each other so the circle's eccentricity cancels, turn with the instrument; the code under them is the Hz angle, counted clockwise from the circle's zero mark. The vertical circle turns with the telescope past a head fixed in the standard and gives the zenith angle V. Distance: the modulation's wavelength is 3 m, and the light goes out and back, so one cycle of phase is 1.5 m of distance. The phase of the returned signal against the sent one gives the fraction: SD = N × 1.5 m + φ / 360° × 1.5 m, with N (0 on this bench) fixed by a second, coarse frequency. While the prism moves the servos chase it and the instrument only reads once it is locked on.",
  body: `<style>.iso-stage{outline:none;touch-action:pan-y}.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}@media (max-width:560px){.iso-plate{overflow:hidden}.iso-stage .iso-svg{width:130%;max-width:none;margin-left:-15%}}</style><div class="iso-stage" tabindex="0" role="slider" aria-label="Total station and prism bench: left and right arrows slide the prism along the rail, Home and End go to its ends" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">${svg}</div>`,
});
const strip = (text) => text.replace(/^import .*$/gm, "").replace(/^export /gm, "");
const latheScript = `const G = (() => {${strip(readFileSync(join(SKILL, "kit", "lathe.mjs"), "utf8"))}\nreturn { viewOf, dot3, add3, sub3, mul3, unit3, cross3, frameOf, frameAlong, prismOf, disc, solidOf, ribsOf, circleOf, arcOf, pointOf };})();\n`;
const modelScript = `const M = (() => {${strip(readFileSync(join(HERE, "model.mjs"), "utf8"))}\nreturn { MM, DEG, TRUNNION, PRISM_Z, RAIL_A, RAIL_B, HZ_ZERO, U, railAt, sight, hzOf, vOf, phaseOf, dms };})();\n`;
const partsScript = strip(readFileSync(join(HERE, "parts.mjs"), "utf8"));
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify({ P, t0: T0 }));
const name = theme === "light" ? "total-station-light.html" : "total-station.html";
writeFileSync(join(HERE, name), k.pageHtml({ title: "Total station", theme, body, script: kitScript() + latheScript + modelScript + partsScript + LIVE }));
console.log("wrote", name, "scale", P.scale.toFixed(3));
