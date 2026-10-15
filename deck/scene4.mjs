// Slide 4: the old toolkit. One survey model on a board: a dumpy level reading two staves,
// a total station shooting a prism, a GNSS rover fixing points against a base. One point at a time.
export const PERIOD = 24;
export const COLS = { L: -290, T: 0, G: 290 };

export function makeScene4(k, G, P, C) {
  const { V, at, S, Ln, Dt, depth, Z, path, rod, obox, tripod, pole, satellite } = C;
  const R2 = Math.SQRT1_2;
  const W = (u, v, z = 0) => [(u + v) * R2, (v - u) * R2, z];
  const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const lerp = (a, b, f) => a + (b - a) * f;
  const lerpP = (a, b, f) => [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
  const yawTo = (from, to) => Math.atan2(to[1] - from[1], to[0] - from[0]);
  const angLerp = (a, b, f) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * f;
  const sorted = (items) => items.sort((a, b) => a.key - b.key).map((x) => x.svg).join("");

  // ---------- the board ----------
  const BASE = { u0: -424, u1: 424, v0: -82, v1: 82 };
  const quad = (u0, u1, v0, v1, z) => [W(u0, v0, z), W(u1, v0, z), W(u1, v1, z), W(u0, v1, z)];
  const uvBox = (u0, u1, v0, v1, z0, z1, style = {}) => {
    const F = G.frameOf(W(0, 0, z0), Z, [R2, -R2, 0], [R2, R2, 0]);
    return S(G.prismOf(F, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], 0, z1 - z0, P), { tone: "mid", ...style });
  };
  const TERRACE = { u0: COLS.L + 62, u1: COLS.L + 142, v0: -78, v1: -30, h: 21.8 };
  const BM = { u: COLS.L - 92, v: -52, h: 12.4 };
  const L0 = { u: COLS.L - 10, v: 24 };
  const PEGS = [[COLS.L + 36, -60, 0, 2.4], [COLS.L + 104, -56, TERRACE.h, 1.6], [COLS.L + 22, -30, 0, 0.9]];
  const T0 = { u: COLS.T - 92, v: 28 };
  const POSTS = [-36, 12, 60, 108].map((u) => COLS.T + u);
  const KERB = { u0: COLS.T - 128, u1: COLS.T + 136, v0: 62, v1: 72, h: 10 };
  const MH = { u: COLS.T + 46, v: 4 };
  const TPTS = [[POSTS[1], -56, 0], [POSTS[3], -56, 0], [MH.u, MH.v, 1.4], [COLS.T + 84, 67, KERB.h], [COLS.T - 20, 67, KERB.h]];
  const B0 = { u: COLS.G + 98, v: -50 };
  const GPTS = [[COLS.G - 110, -36], [COLS.G - 50, -62], [COLS.G + 12, -14], [COLS.G - 92, 46], [COLS.G - 24, 34], [COLS.G + 64, 50]];
  const SATS = [[COLS.G - 150, -80, 166], [COLS.G - 50, -84, 182], [COLS.G + 60, -82, 174], [COLS.G + 128, -74, 158]].map(([u, v, z]) => W(u, v, z));

  function board() {
    const out = [];
    out.push(`<path class="iso-halo" d="${k.pathOf(quad(BASE.u0 + 10, BASE.u1 - 10, BASE.v0 + 10, BASE.v1 - 10, -16).map(at), true)}"/>`);
    out.push(uvBox(BASE.u0, BASE.u1, BASE.v0, BASE.v1, -16, -6, { tone: "lo" }));
    out.push(uvBox(BASE.u0 + 4, BASE.u1 - 4, BASE.v0 + 4, BASE.v1 - 4, -6, 0, {}));
    // soil strata on the board's front edge, edge to edge
    out.push(Ln([-12.5, -9].map((z) => path([W(BASE.u0, BASE.v1, z), W(BASE.u1, BASE.v1, z)])).join(""), { tone: "faint" }));
    out.push(Dt([[BASE.u0 + 12, BASE.v0 + 12], [BASE.u1 - 12, BASE.v0 + 12], [BASE.u1 - 12, BASE.v1 - 12], [BASE.u0 + 12, BASE.v1 - 12]].map(([u, v]) => at(W(u, v, -6))), { size: 0.6 }));
    // a faint survey grid scored into the ground every metre
    const grid = [];
    for (let u = -400; u <= 400; u += 50) grid.push(path([W(u, BASE.v0 + 5, 0), W(u, BASE.v1 - 5, 0)]));
    for (const v of [-50, 0, 50]) grid.push(path([W(BASE.u0 + 5, v, 0), W(BASE.u1 - 5, v, 0)]));
    out.push(Ln(grid.join(""), { tone: "faint" }));
    // label plate at the front left, three rule lines for its engraving
    out.push(uvBox(BASE.u0 + 14, BASE.u0 + 62, 58, 72, 0, 0.8, { tone: "lo" }));
    for (const [v, len] of [[62, 36], [65.5, 26], [69, 32]]) out.push(Ln(path([W(BASE.u0 + 20, v, 0.8), W(BASE.u0 + 20 + len, v, 0.8)]), { tone: "lo", free: true }));
    return out.join("");
  }

  // ---------- levelling ----------
  function staff(u, v, zg, face, reading) {
    // a 2 m levelling staff, face toward the level, E-pattern graduations every 10 cm
    const o = W(u, v, 0);
    const e1 = [Math.cos(face), Math.sin(face), 0];
    const e2 = [-e1[1], e1[0], 0];
    let svg = obox(o, e1, -1.6, 1.6, -3.2, 3.2, zg, zg + 180, { tone: "hi", crease: "lo" });
    const F = (c, z) => at([o[0] + e1[0] * 1.6 + e2[0] * c, o[1] + e1[1] * 1.6 + e2[1] * c, z]);
    const blocks = [], ticks = [], majors = [];
    for (let i = 0; i < 18; i++) {
      const z = zg + i * 10;
      (i % 5 === 0 ? majors : ticks).push(k.pathOf([F(-3.2, z), F(3.2, z)]));
      const side = i % 2 ? 1 : -1;
      blocks.push(k.pathOf([F(0, z + 2), F(side * 3.2, z + 2), F(side * 3.2, z + 3.4), F(side * 1.2, z + 3.4), F(side * 1.2, z + 4.6), F(side * 3.2, z + 4.6), F(side * 3.2, z + 6), F(0, z + 6)], true));
    }
    svg += `<path class="iso-line" data-tone="mid" style="fill:var(--anatomy-mid);fill-opacity:.55;stroke-width:.3" d="${blocks.join("")}"/>`;
    svg += Ln(ticks.join(""), { tone: "lo" }) + Ln(majors.join(""), { tone: "mid" });
    svg += Ln(k.pathOf([F(3.2, zg + 0.5), F(3.2, zg + 179.5)]), { tone: "faint" });
    if (reading > 0.01) svg += `<g opacity="${reading.toFixed(2)}">${Ln(k.pathOf([F(-3.2, 150), F(3.2, 150)]), { tone: "lit" })}</g>`;
    return { key: depth([o[0], o[1], 100]), svg };
  }

  function level(yaw, sight, target) {
    const o = W(L0.u, L0.v, 0);
    const items = tripod(o[0], o[1], 137, { phase: 0.9 });
    const d = [Math.cos(yaw), Math.sin(yaw), 0];
    const r = [d[1], -d[0], 0];
    const head = [];
    head.push(S(k.cylinder(o[0], o[1], 6.2, 137, 2.4, P, 28), { tone: "mid" }));
    const screws = [0, 1, 2].map((i) => [o[0] + Math.cos(0.9 + i * 2.094) * 4.4, o[1] + Math.sin(0.9 + i * 2.094) * 4.4]).sort((a, b) => depth([...a, 0]) - depth([...b, 0]));
    for (const [x, y] of screws) head.push(S(k.cylinder(x, y, 1.5, 139.4, 2.6, P, 12), { tone: "mid" }));
    head.push(S(k.cylinder(o[0], o[1], 5, 142, 1.6, P, 28), { tone: "mid" }));
    head.push(S(k.cylinder(o[0], o[1], 2.6, 143.6, 3.2, P, 16), { tone: "mid" }));
    const F = G.frameOf([o[0], o[1], 150], d, r, Z);
    const knob = S(G.disc(3.2, 6.2, 1.9, G.frameAlong([o[0] + d[0] * 2, o[1] + d[1] * 2, 150], G.mul3(r, Math.sign(G.dot3(r, V)) || 1)), P, { steps: 16 }), { tone: "mid" });
    const tube = S(G.solidOf([[-16, 2], [-13, 2], [-13, 2.8], [-9, 2.8], [-9, 3.4], [12, 3.4], [12, 4.3], [17, 4.3]], F, P, { steps: 28 }), { tone: "hi", crease: "lo" });
    const vial = obox([o[0], o[1]], d, -5, 5, -1.3, 1.3, 153.3, 155);
    head.push(G.dot3(r, V) > 0 ? tube + vial + knob : knob + tube + vial);
    items.push({ key: depth([o[0], o[1], 140]) + 1, svg: head.join("") });
    if (sight > 0.01) {
      const from = [o[0] + d[0] * 17, o[1] + d[1] * 17, 150];
      items.push({ key: depth(target) + 0.2, svg: `<g opacity="${sight.toFixed(2)}">${Ln(k.pathOf([at(from), at(target)]), { tone: "lit" })}</g>` });
    }
    return items;
  }

  // ---------- total station ----------
  const TS_Z = 156;
  function station(yaw, tilt, beam, prism) {
    const o = W(T0.u, T0.v, 0);
    const items = tripod(o[0], o[1], 137, { phase: 0.2 });
    const d = [Math.cos(yaw), Math.sin(yaw), 0];
    const l = [-d[1], d[0], 0];
    const t = [Math.cos(tilt) * d[0], Math.cos(tilt) * d[1], Math.sin(tilt)];
    const rr = G.mul3(l, -1);
    const up = G.cross3(rr, t);
    const A = (s, c, z) => [o[0] + d[0] * s + rr[0] * c, o[1] + d[1] * s + rr[1] * c, z];
    const box = (s0, s1, c0, c1, z0, z1, style = {}) => S(G.prismOf(G.frameOf([o[0], o[1], z0], Z, d, l), [[s0, -c0], [s1, -c0], [s1, -c1], [s0, -c1]], 0, z1 - z0, P), { tone: "mid", ...style });
    const parts = [];
    const tri = [];
    for (let c = 0; c < 3; c++) for (let j = 0; j <= 6; j++) { const a = ((90 + c * 120 - 36 + j * 12) * Math.PI) / 180; tri.push([o[0] + Math.cos(a) * 8, o[1] + Math.sin(a) * 8]); }
    parts.push(S(k.extrude(tri, 137, 3.6, P, { bevel: 0.3 }), { tone: "mid" }));
    parts.push(S(k.cylinder(o[0], o[1], 6.6, 140.6, 3, P, 32), { tone: "mid" }));
    parts.push(box(-7, 7, -10, 10, 143.6, 148.6));
    // display on the eyepiece face
    const face = (c, z) => at(A(-7.05, c, z));
    parts.push(Ln(k.pathOf([face(-8, 147.6), face(-1, 147.6), face(-1, 144.6), face(-8, 144.6)], true), { tone: "lo" }));
    parts.push(Dt([[1.5, 147], [3.5, 147], [5.5, 147], [1.5, 145.3], [3.5, 145.3], [5.5, 145.3]].map(([c, z]) => face(c, z)), { size: 0.35, tone: "mid" }));
    const TF = G.frameOf([o[0], o[1], TS_Z], t, up, rr);
    const prof = [[-9, 1.8], [-6.5, 1.8], [-6.5, 3.2], [5, 3.2], [5, 4], [9, 4]];
    const piece = (s0, s1) => {
      const at0 = (s) => { for (let i = 0; i < prof.length - 1; i++) { const [a, ra] = prof[i], [b, rb] = prof[i + 1]; if (s >= a && s <= b && b > a) return ra + ((rb - ra) * (s - a)) / (b - a); } return prof[prof.length - 1][1]; };
      const inner = prof.filter(([s]) => s > s0 && s < s1);
      const first = prof.filter(([s]) => s === s0), last = prof.filter(([s]) => s === s1);
      const p = [...(first.length ? first.slice(-1) : [[s0, at0(s0)]]), ...inner, ...(last.length ? last.slice(0, 1) : [[s1, at0(s1)]])];
      return S(G.solidOf(p, TF, P, { steps: 24 }), { tone: "hi", crease: "lo" });
    };
    const nearSide = G.dot3(rr, V) > 0 ? 1 : -1;
    const eyeNear = G.dot3(d, V) < 0;
    const std = (side) => box(-5, 5, side * 6.4, side * 10, 148.6, 160);
    const ends = { far: eyeNear ? piece(5, 9) : piece(-9, -5), near: eyeNear ? piece(-9, -5) : piece(5, 9) };
    parts.push(ends.far, std(-nearSide), piece(-5, 5), std(nearSide), ends.near);
    parts.push(box(-2, 2, -10, 10, 160, 162.4));
    items.push({ key: depth([o[0], o[1], 140]) + 1, svg: parts.join("") });
    if (beam > 0.01) {
      const from = G.add3([o[0], o[1], TS_Z], G.mul3(t, 9));
      items.push({ key: Math.min(depth(from), depth(prism)) + 0.1, svg: `<g opacity="${beam.toFixed(2)}">${Ln(k.pathOf([at(from), at(prism)]), { tone: "lit" })}</g>` });
    }
    return items;
  }

  function prismPole(p, faceYaw) {
    const items = pole(p[0], p[1], 146, { facing: Math.PI / 4 }).map((it) => ({ ...it, key: it.key }));
    const g = [Math.cos(faceYaw), Math.sin(faceYaw), 0];
    const F = G.frameOf([p[0], p[1], 152], g, [-g[1], g[0], 0], Z);
    const glass = [0, 1, 2].map((i) => k.pathOf([at(G.pointOf(F, 2.6, 0, 0)), at(G.pointOf(F, 2.6, 3, Math.PI / 2 + i * 2.094))])).join("");
    items.push({ key: depth([p[0], p[1], 150]) + 0.5, svg: S(G.solidOf([[-2.6, 3.6], [1.6, 3.6], [1.6, 4.2], [2.6, 4.2]], F, P, { steps: 24 }), { tone: "hi", crease: "lo" }) + Ln(G.circleOf(F, 2.6, 3.2, P, 24), { tone: "mid" }) + Ln(glass, { tone: "lo" }) });
    return items.map((it) => ({ key: it.key, svg: it.svg }));
  }

  // ---------- GNSS ----------
  function antenna(x, y, z, r = 8) {
    return S(k.cylinder(x, y, r, z, 3, P, 32), { tone: "mid" }) + S(G.solidOf([[0, r - 0.6, 1], [1.8, r - 1.8, 1], [3.2, r - 4, 1], [3.9, 0, 1]], G.frameOf([x, y, z + 3], Z, [1, 0, 0], [0, 1, 0]), P, { steps: 32 }), { tone: "hi", crease: "lo" });
  }
  function base() {
    const o = W(B0.u, B0.v, 0);
    const items = tripod(o[0], o[1], 137, { phase: 1.3 });
    const legA = 1.3 + 2.094;
    const box = [o[0] + Math.cos(legA) * 14, o[1] + Math.sin(legA) * 14];
    items.push({ key: depth([o[0], o[1], 140]) + 1, svg: S(k.cylinder(o[0], o[1], 6, 137, 3, P, 24), { tone: "mid" }) + rod([o[0], o[1], 140], [o[0], o[1], 147], 1.6) + antenna(o[0], o[1], 147, 9.5) });
    const radio = { x: box[0] - 5, y: box[1] - 4, w: 10, d: 8, r: 1 };
    items.push({ key: depth([box[0], box[1], 90]) + 2, svg: S(k.slabOf(radio, 84, 14, P, 3, 0.3), { tone: "mid" }) + rod([box[0] + 3, box[1] + 2, 98], [box[0] + 3, box[1] + 2, 168], 0.5, { tone: "hi", crease: "none" }) + S(G.sphereOf([box[0] + 3, box[1] + 2, 169], 1.2, P, { steps: 16 }), { tone: "hi" }) + Dt([at([box[0] - 2, box[1] - 4, 94])], { size: 0.5, tone: "hi" }) });
    items.push({ key: depth(o) + 0.1, svg: S(k.cylinder(o[0], o[1], 3, 0, 1.2, P, 16), { tone: "lo" }) + Dt([at([o[0], o[1], 1.2])], { size: 0.6, tone: "hi" }) });
    return { items, radioTop: [box[0] + 3, box[1] + 2, 98] };
  }
  function rover(p) {
    const items = pole(p[0], p[1], 176, { facing: Math.PI / 4 });
    const ctl = { x: p[0] - 2, y: p[1] + 1.2, w: 9, d: 2.4, r: 0.6 };
    items.push({ key: depth([p[0], p[1], 176]) + 0.5, svg: antenna(p[0], p[1], 176, 8) });
    items.push({ key: depth([p[0] + 2, p[1] + 3, 120]) + 0.4, svg: S(k.slabOf(ctl, 114, 12, P, 2), { tone: "mid" }) });
    return items;
  }

  // ---------- the timeline ----------
  function state(t) {
    t = ((t % PERIOD) + PERIOD) % PERIOD;
    const fadeAll = 1 - ease((t - 23.2) / 0.7);
    // levelling: three foresights from one setup, each reduced from the benchmark
    const ls = Math.floor(t / 8), lt = t - ls * 8;
    const peg = PEGS[ls], prev = PEGS[(ls + 2) % 3];
    const hop = ease(lt / 1.6);
    const staffAt = lt < 1.6 ? [lerp(prev[0], peg[0], hop), lerp(prev[1], peg[1], hop), lerp(prev[2] + prev[3], peg[2] + peg[3], hop) + Math.sin(Math.PI * hop) * 14] : [peg[0], peg[1], peg[2] + peg[3]];
    const lpos = W(L0.u, L0.v, 0);
    const bmP = W(BM.u, BM.v, 0), fsP = W(staffAt[0], staffAt[1], 0), prevP = W(prev[0], prev[1], 0), pegP = W(peg[0], peg[1], 0);
    const yBS = yawTo(lpos, bmP), yPrev = yawTo(lpos, prevP), yFS = yawTo(lpos, pegP);
    let yaw = yPrev;
    if (lt >= 1.6) yaw = angLerp(yPrev, yBS, ease((lt - 1.6) / 1));
    if (lt >= 2.6) yaw = yBS;
    if (lt >= 4.2) yaw = angLerp(yBS, yFS, ease((lt - 4.2) / 1));
    if (lt >= 5.2) yaw = yFS;
    const onBS = ease((lt - 2.8) / 0.3) * (1 - ease((lt - 4.0) / 0.25));
    const onFS = ease((lt - 5.4) / 0.3) * (1 - ease((lt - 7.5) / 0.3));
    const BS = (150 - BM.h) / 100, HI = 100 + BS;
    const fsRead = (150 - peg[2] - peg[3]) / 100;
    const lshow = lt >= 6.0;
    const levelPts = PEGS.map((_, i) => (i < ls || (i === ls && lshow) ? 1 : 0) * fadeAll);
    // total station: five features, a shot each
    const ts = Math.floor(t / 4.8), tt = t - ts * 4.8;
    const cur = TPTS[ts], before = TPTS[(ts + 4) % 5];
    const mv = ease(tt / 1.4);
    const pp = tt < 1.4 ? [lerp(before[0], cur[0], mv), lerp(before[1], cur[1], mv), lerp(before[2], cur[2], mv)] : cur;
    const tpos = [...W(T0.u, T0.v, 0).slice(0, 2), TS_Z];
    const prismOf = (q) => { const w = W(q[0], q[1], q[2] + 152); return w; };
    const aim = (q) => { const w = prismOf(q); return { yaw: yawTo(tpos, w), tilt: Math.atan2(w[2] - TS_Z, Math.hypot(w[0] - tpos[0], w[1] - tpos[1])) }; };
    const a0 = aim(before), a1 = aim(cur);
    const sv = ease((tt - 1.3) / 1.1);
    const tsYaw = angLerp(a0.yaw, a1.yaw, sv), tsTilt = lerp(a0.tilt, a1.tilt, sv);
    const beam = ease((tt - 2.5) / 0.25) * (1 - ease((tt - 3.5) / 0.4));
    const tshow = tt >= 3.2;
    const tsPts = TPTS.map((_, i) => (i < ts || (i === ts && tshow) ? 1 : 0) * fadeAll);
    // GNSS: six points in the open, each a fix from the satellites plus the base's corrections
    const gs = Math.floor(t / 4), gt = t - gs * 4;
    const gc = GPTS[gs], gb = GPTS[(gs + 5) % 6];
    const gm = ease(gt / 1.4);
    const rp = gt < 1.4 ? [lerp(gb[0], gc[0], gm), lerp(gb[1], gc[1], gm)] : gc;
    const sats = ease((gt - 1.5) / 0.4) * (1 - ease((gt - 3.3) / 0.5));
    const fix = gt >= 2.6;
    const gshow = gt >= 2.8;
    const gPts = GPTS.map((_, i) => (i < gs || (i === gs && gshow) ? 1 : 0) * fadeAll);
    const E = (u, v) => (2716.0 + (u - COLS.T) / 100 * 0.9 + v / 100 * 0.4).toFixed(3);
    const N = (u, v) => (6043.0 + v / 100 * 0.9 - (u - COLS.T) / 100 * 0.4).toFixed(3);
    return {
      t, staffAt, yaw, onBS, onFS, BS, HI, fsRead, lshow, ls, levelPts,
      pp, tsYaw, tsTilt, beam, ts, tshow, tsPts, prismW: prismOf(pp), faceYaw: yawTo(prismOf(pp), tpos),
      rp, sats, fix, gs, gt, gPts, gshow,
      readL: lt >= 3.0 ? `BS <b>${BS.toFixed(3)}</b>` + (lt >= 5.6 ? `  FS <b>${fsRead.toFixed(3)}</b>` : "") + (lshow ? `  RL <i>${(HI - fsRead).toFixed(3)}</i>` : "") : `BM <b>RL 100.000</b>`,
      readT: `PT <b>${String(tshow ? ts + 1 : ts).padStart(2, "0")}</b>` + (tshow || ts > 0 ? `  E <i>${E(...(tshow ? cur : before))}</i>  N <i>${N(...(tshow ? cur : before))}</i>` : "  —"),
      readG: (gt >= 1.6 ? (fix ? `RTK <i>FIX</i>  ±0.02 m` : `RTK <b>FLOAT</b>  ±0.40 m`) : `RTK <b>—</b>`) + `  PT <b>${String(gshow ? gs + 1 : gs).padStart(2, "0")}</b>`,
    };
  }

  function marker(p, alpha) {
    if (alpha <= 0.01) return null;
    return { key: depth(p) + 0.05, svg: `<g opacity="${alpha.toFixed(2)}">${Ln(k.ring(p[0], p[1], 3.4, p[2], P, 20), { tone: "lit" })}${S(k.cylinder(p[0], p[1], 0.9, p[2], 5, P, 10), { tone: "lit", lit: true })}</g>` };
  }

  function frame(t) {
    const s = state(t);
    // levelling column
    const L = [];
    L.push({ key: depth(W(TERRACE.u0, TERRACE.v1, 0)) - 30, svg: uvBox(TERRACE.u0, TERRACE.u1, TERRACE.v0, TERRACE.v1, 0, TERRACE.h, { tone: "mid" }) + Ln(path([W(TERRACE.u0 + 4, TERRACE.v1 - 4, TERRACE.h), W(TERRACE.u1 - 4, TERRACE.v1 - 4, TERRACE.h)]), { tone: "faint" }) });
    const bm = W(BM.u, BM.v, 0);
    L.push({ key: depth(bm), svg: S(k.slabOf({ x: bm[0] - 11, y: bm[1] - 11, w: 22, d: 22, r: 1.5 }, 0, BM.h, P, 3, 0.5), { tone: "mid" }) + Ln(k.ring(bm[0], bm[1], 3.6, BM.h, P, 20), { tone: "hi" }) + Dt([at([bm[0], bm[1], BM.h])], { size: 0.6, tone: "hi" }) });
    for (const pg of PEGS) { const w = W(pg[0], pg[1], pg[2]); L.push({ key: depth(w) - 0.1, svg: S(k.slabOf({ x: w[0] - 2, y: w[1] - 2, w: 4, d: 4, r: 0.4 }, pg[2], pg[3], P, 2), { tone: "lo" }) }); }
    const lpos = W(L0.u, L0.v, 0);
    const bsStaff = staff(BM.u, BM.v, BM.h, yawTo(bm, lpos), s.onBS);
    const fw = W(s.staffAt[0], s.staffAt[1], 0);
    const fsStaff = staff(s.staffAt[0], s.staffAt[1], s.staffAt[2], yawTo(fw, lpos), s.onFS);
    L.push(bsStaff, fsStaff);
    const target = s.onBS > s.onFS ? (() => { const f = yawTo(bm, lpos); return [bm[0] + Math.cos(f) * 1.6, bm[1] + Math.sin(f) * 1.6, 150]; })() : (() => { const f = yawTo(fw, lpos); return [fw[0] + Math.cos(f) * 1.6, fw[1] + Math.sin(f) * 1.6, 150]; })();
    L.push(...level(s.yaw, Math.max(s.onBS, s.onFS), target));
    PEGS.forEach((pg, i) => { const m = marker(W(pg[0], pg[1], pg[2] + pg[3]), s.levelPts[i]); if (m) L.push(m); });
    // total-station column
    const T = [];
    const kerbBox = uvBox(KERB.u0, KERB.u1, KERB.v0, KERB.v1, 0, KERB.h, {});
    T.push({ key: depth(W((KERB.u0 + KERB.u1) / 2, KERB.v0, 0)) + 40, svg: kerbBox + Ln(path([W(KERB.u0, KERB.v0 + 3, KERB.h), W(KERB.u1, KERB.v0 + 3, KERB.h)]), { tone: "faint" }) });
    const mh = W(MH.u, MH.v, 0);
    T.push({ key: depth(mh) - 20, svg: S(k.cylinder(mh[0], mh[1], 20, 0, 1.4, P, 48), { tone: "mid" }) + Ln(k.ring(mh[0], mh[1], 15, 1.4, P, 40) + k.ring(mh[0], mh[1], 10, 1.4, P, 40), { tone: "faint" }) });
    const postW = POSTS.map((u) => W(u, -64, 0));
    postW.forEach((w) => T.push({ key: depth([w[0], w[1], 50]), svg: S(k.slabOf({ x: w[0] - 2.2, y: w[1] - 2.2, w: 4.4, d: 4.4, r: 0.6 }, 0, 104, P, 2), { tone: "mid" }) }));
    for (let i = 0; i < postW.length - 1; i++) {
      const a = postW[i], b = postW[i + 1];
      T.push({ key: depth([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 70]) - 1, svg: Ln([62, 92].map((z) => k.pathOf([at([a[0], a[1], z]), at([b[0], b[1], z])])).join(""), { tone: "lo" }) });
    }
    const pw = W(s.pp[0], s.pp[1], s.pp[2]);
    T.push(...prismPole([pw[0], pw[1], 0].map((x, i) => (i < 2 ? x : 0)), s.faceYaw).map((it) => it));
    T.push(...station(s.tsYaw, s.tsTilt, s.beam, s.prismW));
    TPTS.forEach((q, i) => { const m = marker(W(q[0], q[1], q[2]), s.tsPts[i]); if (m) T.push(m); });
    // GNSS column
    const Gi = [];
    const b = base();
    Gi.push(...b.items);
    const rw = W(s.rp[0], s.rp[1], 0);
    Gi.push(...rover(rw));
    const ant = [rw[0], rw[1], 181];
    Gi.push({ key: depth(ant) + 3, svg: Ln(k.pathOf([at(b.radioTop.map((x, i) => (i === 2 ? 168 : x))), at([rw[0], rw[1], 177])]), { tone: "lo", dashed: true }) });
    SATS.forEach((c) => Gi.push({ key: -1e4, svg: satellite(c) }));
    if (s.sats > 0.01) SATS.forEach((c) => Gi.push({ key: -9e3, svg: `<g opacity="${s.sats.toFixed(2)}">${Ln(k.pathOf([at([c[0], c[1], c[2] - 9]), at(ant)]), { tone: "lit" })}</g>` }));
    GPTS.forEach((q, i) => { const m = marker(W(q[0], q[1], 0), s.gPts[i]); if (m) Gi.push(m); });
    // the shadow of a hop: the staff lifts, so does the halo under it
    return { L: sorted(L), T: sorted(T), G: sorted(Gi), s };
  }

  function extents() {
    const pts = [...quad(BASE.u0, BASE.u1, BASE.v0, BASE.v1, -16), ...quad(BASE.u0, BASE.u1, BASE.v0, BASE.v1, 0)];
    pts.push(W(BM.u, BM.v, BM.h + 180), W(PEGS[1][0], PEGS[1][1], TERRACE.h + 180), W(PEGS[2][0], PEGS[2][1], 180));
    SATS.forEach((c) => pts.push([c[0], c[1], c[2] + 4]));
    return pts;
  }

  return { board, frame, state, extents, W };
}
