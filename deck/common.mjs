// Shared by both slide animations: the deck's palette as kit tokens, the browser bundle,
// and a few parts both scenes use (tripods, poles, satellites).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
export const HERE = dirname(fileURLToPath(import.meta.url));
export const KIT = join(HERE, "..", ".claude", "skills", "anatomy", "kit");

// Tokens tuned to the deck: slide #0B0F14, cards #141A21, text #9AA5B1 / #EEF2F5.
export const themeCss = (accent) => `
.iso[data-theme="dark"]{
  --anatomy-page:#0B0F14;--anatomy-card:#0B0F14;--anatomy-paper:#0B0F14;--anatomy-face:#2a3542;--anatomy-top:#26313d;
  --anatomy-shade-0:#141b23;--anatomy-shade-1:#18202a;--anatomy-shade-2:#1d2631;--anatomy-shade-3:#222c38;
  --anatomy-lit-top:#2f3b49;--anatomy-lit-shade:#253040;
  --anatomy-hi:#dfe6ec;--anatomy-mid:#8a95a1;--anatomy-lo:#56616d;--anatomy-faint:#333d48;--anatomy-weight:.9px;--anatomy-lit:${accent};
  --anatomy-halo:#000;--anatomy-halo-opacity:.85;--anatomy-dot:#dfe5eb;--anatomy-text:#9AA5B1;--anatomy-muted:#6B7581;--anatomy-strong:#EEF2F5;
}
html,body{margin:0;background:#0B0F14}
.band{position:relative;width:1200px;margin:0}
.band .iso-svg{display:block;width:1200px;height:auto}
.band .ro{position:absolute;bottom:6px;transform:translateX(-50%);font:500 12.5px/1 "Courier New",ui-monospace,monospace;letter-spacing:.06em;color:#6B7581;white-space:nowrap}
.band .ro b{font-weight:500;color:#EEF2F5}
.band .ro i{font-style:normal;color:${accent}}
.pc{fill:none;stroke:${accent};stroke-width:1.5;stroke-linecap:round}
.ph{fill:${accent};fill-opacity:.05;stroke:${accent};stroke-opacity:.35;stroke-width:.6}
.acc{stroke:${accent}}
.acc-fill{fill:${accent}}
`;

// A module's source as an object of its exports, for the page.
export function bundle(file, name) {
  const src = readFileSync(file, "utf8");
  const names = [...src.matchAll(/^export (?:const|function|let) (\w+)/gm)].map((m) => m[1]);
  const body = src.replace(/^import .*$/gm, "").replace(/^export /gm, "");
  return `const ${name} = (() => {${body}\nreturn { ${names.join(", ")} };})();\n`;
}

export function pageHtml({ title, svg, readouts, script, accent }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>${readFileSync(join(KIT, "iso.css"), "utf8")}${themeCss(accent)}</style></head><body class="iso" data-theme="dark"><div class="band">${svg}${readouts}</div><script type="module">${script.replace(/<\/(script)/gi, "<\\/$1")}</script></body></html>`;
}

// Parts both scenes use. k = iso kit, G = lathe kit, P = projection.
export function makeCommon(k, G, P) {
  const V = G.viewOf(P);
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const Ln = (d, style) => k.lineSvg(d, style);
  const Dt = (points, style) => k.dotsSvg(points, style);
  const depth = (p) => G.dot3(p, V);
  const Z = [0, 0, 1];
  const path = (points, closed) => k.pathOf(points.map(at), closed);
  const rod = (a, b, r, style = { tone: "mid", crease: "none" }) => {
    const d = G.sub3(b, a);
    return S(G.disc(0, G.len3(d), r, G.frameAlong(a, d), P, { steps: 12 }), style);
  };
  // an oriented box: centre o, unit axes e1 (along), e2 (across), z up
  const obox = (o, e1, s0, s1, c0, c1, z0, z1, style = {}) => {
    const e2 = [-e1[1], e1[0], 0];
    const F = G.frameOf([o[0], o[1], z0], Z, e1, e2);
    return S(G.prismOf(F, [[s0, c0], [s1, c0], [s1, c1], [s0, c1]], 0, z1 - z0, P), { tone: "mid", ...style });
  };

  // a surveyor's tripod: three legs from the head rim to shod feet, a clamp on each leg
  function tripod(cx, cy, head, { spread = 34, phase = 0.3, open = 1 } = {}) {
    const items = [];
    for (let i = 0; i < 3; i++) {
      const a = phase + (i * 2 * Math.PI) / 3;
      const top = [cx + Math.cos(a) * 5.5, cy + Math.sin(a) * 5.5, head - 1];
      const foot = [cx + Math.cos(a) * spread * open, cy + Math.sin(a) * spread * open, 0];
      const mid = G.lerp3(top, foot, 0.42);
      const svg = rod(top, mid, 1.7) + rod(mid, foot, 1.25) + S(G.disc(-2.2, 2.2, 2.3, G.frameAlong(mid, G.sub3(foot, top)), P, { steps: 12 }), { tone: "mid" }) + rod(foot, G.lerp3(foot, top, 0.06), 1.8, { tone: "lo" });
      items.push({ key: depth(G.lerp3(top, foot, 0.5)), svg });
    }
    items.push({ key: depth([cx, cy, head]) + 0.5, svg: S(k.cylinder(cx, cy, 7.5, head - 3, 3, P, 32), { tone: "mid" }) + Ln(k.ring(cx, cy, 5, head, P, 24), { tone: "faint" }) });
    return items;
  }

  // a range pole standing on a bipod; the pole's tip on the ground at (x, y)
  function pole(x, y, top, { legs = 0.9, facing = 0 } = {}) {
    const items = [];
    for (const s of [-1, 1]) {
      const a = facing + Math.PI + s * 0.55;
      const from = [x, y, 110];
      const foot = [x + Math.cos(a) * 46 * legs, y + Math.sin(a) * 46 * legs, 0];
      items.push({ key: depth(G.lerp3(from, foot, 0.5)), svg: rod(from, foot, 0.8, { tone: "lo", crease: "none" }) });
    }
    const banded = S(k.cylinder(x, y, 1.3, 0, top, P, 12), { tone: "hi", crease: "none", inner: Ln([30, 60, 90].map((z) => k.sideArc(x, y, 1.3, z, P, 8)).join(""), { tone: "lo" }) });
    items.push({ key: depth([x, y, top / 2]), svg: banded + S(k.cylinder(x, y, 2.2, 104, 9, P, 16), { tone: "mid" }) + S(k.cylinder(x, y, 2.6, 0, 3, P, 12), { tone: "lo" }) });
    return items;
  }

  // a navigation satellite: body, two solar wings with cell grids, an antenna face
  function satellite(c, yaw = 0.6) {
    const e1 = [Math.cos(yaw), Math.sin(yaw), 0];
    const e2 = [-e1[1], e1[0], 0];
    const o = [c[0], c[1]];
    let svg = "";
    const wing = (side) => {
      const w = obox(o, e1, -5, 5, side * 7.5, side * 29, c[2] - 0.6, c[2] + 0.6, { tone: "lo", crease: "none" });
      const cells = [];
      for (let j = 1; j < 4; j++) {
        const cc = side * (7.5 + (j * 21.5) / 4);
        cells.push(k.pathOf([G.add3(G.add3(c, G.mul3(e1, -5)), G.mul3(e2, cc)), G.add3(G.add3(c, G.mul3(e1, 5)), G.mul3(e2, cc))].map((p) => at([p[0], p[1], c[2] + 0.6]))));
      }
      cells.push(k.pathOf([G.add3(c, G.mul3(e2, side * 7.5)), G.add3(c, G.mul3(e2, side * 29))].map((p) => at([p[0], p[1], c[2] + 0.6]))));
      return w + Ln(cells.join(""), { tone: "mid" });
    };
    const near = G.dot3(e2, V) > 0 ? 1 : -1;
    svg += wing(-near);
    svg += obox(o, e1, -5, 5, -5, 5, c[2] - 6, c[2] + 6, { tone: "mid" });
    svg += rod([c[0], c[1], c[2] - 6], [c[0], c[1], c[2] - 9], 2.4, { tone: "mid" });
    svg += wing(near);
    return svg;
  }

  return { V, at, S, Ln, Dt, depth, Z, path, rod, obox, tripod, pole, satellite };
}

export const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
