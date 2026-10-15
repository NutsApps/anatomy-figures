// Slide 7: the new toolkit. One site, four capture tools, a point cloud that builds as they work.
export const PERIOD = 24;
export const COLS = { A: -600, B: -200, C: 200, D: 600 };

export function makeScene7(k, G, P, C) {
  const { V, at, S, Ln, Dt, depth, Z, path, rod, obox, tripod } = C;
  const R2 = Math.SQRT1_2;
  const W = (u, v, z = 0) => [(u + v) * R2, (v - u) * R2, z];
  const U = [R2, -R2, 0], VV = [R2, R2, 0];
  const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const lerp = (a, b, f) => a + (b - a) * f;
  const sorted = (items) => items.sort((a, b) => a.key - b.key).map((x) => x.svg).join("");
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const uvBox = (u0, u1, v0, v1, z0, z1, style = {}) => {
    const F = G.frameOf(W(0, 0, z0), Z, U, VV);
    return S(G.prismOf(F, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], 0, z1 - z0, P), { tone: "mid", ...style });
  };
  const quad = (u0, u1, v0, v1, z) => [W(u0, v0, z), W(u1, v0, z), W(u1, v1, z), W(u0, v1, z)];
  const BASE = { u0: -780, u1: 780, v0: -110, v1: 110 };
  // a point cloud: one path of round dots, each [world point, birth time]
  const cloud = (pts, t, fade = 1) => {
    let d = "";
    for (const [p, born] of pts) if (born <= t) { const [x, y] = at(p); d += `M${x.toFixed(1)} ${y.toFixed(1)}h0`; }
    return d ? `<path class="pc" style="opacity:${fade.toFixed(2)}" d="${d}"/>` : "";
  };
  const loopT = (t) => ((t % PERIOD) + PERIOD) % PERIOD;
  const fadeOut = (t) => 1 - ease((t - 23.1) / 0.8);

  function board() {
    const out = [];
    out.push(`<path class="iso-halo" d="${k.pathOf(quad(BASE.u0 + 10, BASE.u1 - 10, BASE.v0 + 10, BASE.v1 - 10, -16).map(at), true)}"/>`);
    out.push(uvBox(BASE.u0, BASE.u1, BASE.v0, BASE.v1, -16, -6, { tone: "lo" }));
    out.push(uvBox(BASE.u0 + 4, BASE.u1 - 4, BASE.v0 + 4, BASE.v1 - 4, -6, 0, {}));
    out.push(Ln([-12.5, -9].map((z) => path([W(BASE.u0, BASE.v1, z), W(BASE.u1, BASE.v1, z)])).join(""), { tone: "faint" }));
    out.push(Dt([[BASE.u0 + 12, BASE.v0 + 12], [BASE.u1 - 12, BASE.v0 + 12], [BASE.u1 - 12, BASE.v1 - 12], [BASE.u0 + 12, BASE.v1 - 12]].map(([u, v]) => at(W(u, v, -6))), { size: 0.6 }));
    const grid = [];
    for (let u = -750; u <= 750; u += 50) grid.push(path([W(u, BASE.v0 + 4, 0), W(u, BASE.v1 - 4, 0)]));
    for (const v of [-100, -50, 0, 50, 100]) grid.push(path([W(BASE.u0 + 4, v, 0), W(BASE.u1 - 4, v, 0)]));
    out.push(Ln(grid.join(""), { tone: "faint" }));
    return out.join("");
  }

  // ---------- a quadcopter with a payload under a gimbal ----------
  function drone(c, payload, spin) {
    const [x, y, z] = c;
    const items = [];
    const yaw0 = 0.45;
    const arms = [45, 135, 225, 315].map((a) => (a * Math.PI) / 180 + yaw0 - Math.PI / 4);
    const motor = (a) => [x + Math.cos(a) * 46, y + Math.sin(a) * 46];
    const sorted4 = [...arms].sort((a, b) => depth([...motor(a), z]) - depth([...motor(b), z]));
    const armSvg = (a) => {
      const m = motor(a);
      let s = rod([x + Math.cos(a) * 12, y + Math.sin(a) * 12, z + 6], [m[0], m[1], z + 6], 2.2, { tone: "mid", crease: "none" });
      s += S(k.cylinder(m[0], m[1], 4.2, z + 4, 6, P, 16), { tone: "mid" });
      const blade = [0, Math.PI].map((o) => k.pathOf([at([m[0], m[1], z + 10.6]), at([m[0] + Math.cos(spin + o + a) * 20, m[1] + Math.sin(spin + o + a) * 20, z + 10.6])])).join("");
      s += Ln(k.ring(m[0], m[1], 20, z + 10.6, P, 32), { tone: "faint" }) + Ln(blade, { tone: "lo" }) + Dt([at([m[0], m[1], z + 10.6])], { size: 0.6, tone: "hi" });
      return s;
    };
    // landing gear: two legs a side and a skid
    const gear = (side) => {
      const p0 = [x + U[0] * -12 + VV[0] * side * 12, y + U[1] * -12 + VV[1] * side * 12];
      const p1 = [x + U[0] * 12 + VV[0] * side * 12, y + U[1] * 12 + VV[1] * side * 12];
      const f0 = [p0[0] + VV[0] * side * 8, p0[1] + VV[1] * side * 8, z - 26], f1 = [p1[0] + VV[0] * side * 8, p1[1] + VV[1] * side * 8, z - 26];
      return rod([p0[0], p0[1], z], f0, 1.2, { tone: "lo", crease: "none" }) + rod([p1[0], p1[1], z], f1, 1.2, { tone: "lo", crease: "none" }) + rod(G.add3(f0, G.mul3(U, -8)), G.add3(f1, G.mul3(U, 8)), 1.3, { tone: "mid", crease: "none" });
    };
    items.push({ key: 1, svg: gear(-1) });
    items.push({ key: 2, svg: armSvg(sorted4[0]) + armSvg(sorted4[1]) });
    // payload on its gimbal
    const g = [x, y, z - 6];
    let pay = rod([x, y, z], [x, y, z - 6], 1.6) + obox([x, y], U, -4, 4, -7, 7, z - 9, z - 5, { tone: "mid" });
    if (payload === "L2") pay += obox([x, y], U, -7, 7, -7, 7, z - 24, z - 9, { tone: "hi", crease: "lo" }) + Ln(k.sideRing ? "" : "", {}) + Dt([at(W(0, 0, 0).map((_, i) => [x, y, z - 16][i] + VV[i] * 7.2))], { size: 0.9, tone: "lit" });
    else pay += obox([x, y], U, -8, 8, -6, 6, z - 21, z - 9, { tone: "hi", crease: "lo" }) + S(k.cylinder(x, y, 5.2, z - 27, 6, P, 24), { tone: "mid" }) + Ln(k.ring(x, y, 3.4, z - 27, P, 20), { tone: "lit" });
    items.push({ key: 3, svg: pay });
    items.push({ key: 4, svg: obox([x, y], U, -18, 18, -13, 13, z, z + 9, { tone: "hi", crease: "lo" }) + obox([x, y], U, -9, 9, -7, 7, z + 9, z + 13, { tone: "mid" }) + Dt([at([x + U[0] * 15 + VV[0] * 10, y + U[1] * 15 + VV[1] * 10, z + 9])], { size: 0.7, tone: "lit" }) });
    items.push({ key: 5, svg: armSvg(sorted4[2]) + armSvg(sorted4[3]) });
    items.push({ key: 6, svg: gear(1) });
    return items.map((it) => it.svg).join("");
  }

  // ---------- column A: drone LiDAR over trees ----------
  const TREES = [[-735, -62, 200, 44], [-680, 4, 240, 52], [-612, -70, 260, 56], [-548, 10, 210, 46], [-480, -40, 230, 50], [-650, 62, 150, 34]].map(([u, v, h, r]) => ({ u, v, h, r }));
  const A_FROM = -690, A_TO = -440, A_Z = 390;
  const aPts = (() => {
    const pts = [];
    for (let i = 0; i < 900; i++) {
      const u = lerp(A_FROM - 30, A_TO + 26, rnd()), v = lerp(-98, 98, rnd());
      const tree = TREES.find((tr) => Math.hypot(u - tr.u, v - tr.v) < tr.r * 0.85);
      const born = 0.6 + ((u - v * 0.42 - A_FROM + 30) / (A_TO - A_FROM + 56)) * 10.6;
      pts.push([W(u, v, 0.4), born]);
      if (tree && rnd() < 0.55) pts.push([W(u, v, tree.h - tree.r * 0.25 + rnd() * tree.r * 0.5), born, "crown"]);
    }
    return pts;
  })();
  function tree(tr) {
    const c = W(tr.u, tr.v, 0);
    const trunk = S(k.cylinder(c[0], c[1], 4, 0, tr.h - tr.r * 0.6, P, 14), { tone: "lo", crease: "none" });
    const crown = S(G.sphereOf([c[0], c[1], tr.h], tr.r, P, { steps: 40 }), { tone: "mid" });
    const lower = S(G.sphereOf([c[0] + 10, c[1] - 6, tr.h - tr.r * 0.55], tr.r * 0.62, P, { steps: 32 }), { tone: "mid" });
    return { key: depth([c[0], c[1], 0]), svg: trunk + lower + crown };
  }
  function colA(t) {
    const tt = loopT(t), fade = fadeOut(tt);
    const out = (tt < 11.6 ? ease(tt / 11.6) : 1 - ease((tt - 12) / 11));
    const u = lerp(A_FROM, A_TO, tt < 11.6 ? ease(tt / 11.6) : 1 - ease((tt - 12) / 11));
    const scanning = tt > 0.6 && tt < 11.2;
    const items = [];
    items.push({ key: -1e5, svg: cloud(aPts.filter((p) => !p[2]), tt, fade) });
    TREES.forEach((tr) => items.push(tree(tr)));
    items.push({ key: 1e4, svg: cloud(aPts.filter((p) => p[2]), tt, fade) });
    const dc = W(u, -6, A_Z);
    if (scanning) {
      const src = [dc[0], dc[1], A_Z - 24];
      const rays = [];
      for (let i = 0; i <= 8; i++) {
        const v = lerp(-96, 96, i / 8);
        const g = W(u + v * 0.42, v, 0);
        const tr = TREES.find((x) => Math.hypot(u + v * 0.42 - x.u, v - x.v) < x.r);
        rays.push(k.pathOf([at(src), at(g)]));
        if (tr) rays.push(k.pathOf([at(W(u + v * 0.42 - 3, v, tr.h + tr.r * 0.3)), at(W(u + v * 0.42 + 3, v, tr.h + tr.r * 0.3))]));
      }
      items.push({ key: 2e4, svg: `<g opacity=".55">${Ln(rays.join(""), { tone: "lit" })}</g>` + Ln(path([W(u - 41, -98, 0.5), W(u + 41, 98, 0.5)]), { tone: "lit" }) });
    }
    items.push({ key: 3e4, svg: drone(dc, "L2", tt * 40) });
    const n = Math.min(10.6, Math.max(0, tt - 0.6)) * 240000;
    return { svg: sorted(items), read: `L2 <b>240k</b> pts/s · <i>${(n / 1e6).toFixed(2)} M</i>`, u };
  }

  // ---------- column B: drone photogrammetry over a shed ----------
  // a frame turned about z: s along e, n across, so a part shows two faces
  const turned = (ou, ov, deg) => {
    const a = (deg * Math.PI) / 180;
    const e = [U[0] * Math.cos(a) + VV[0] * Math.sin(a), U[1] * Math.cos(a) + VV[1] * Math.sin(a), 0];
    const n = [-e[1], e[0], 0];
    const o = W(ou, ov, 0);
    const at3 = (sx, nx, z) => [o[0] + e[0] * sx + n[0] * nx, o[1] + e[1] * sx + n[1] * nx, z];
    const box = (s0, s1, n0, n1, z0, z1, style = {}) => S(G.prismOf(G.frameOf([o[0], o[1], z0], Z, e, n), [[s0, n0], [s1, n0], [s1, n1], [s0, n1]], 0, z1 - z0, P), { tone: "mid", ...style });
    return { e, n, o, at3, box, inside: (p, s0, s1, n0, n1) => { const d = G.sub3(p, o); const ss = G.dot3(d, e), nn = G.dot3(d, n); return ss > s0 && ss < s1 && nn > n0 && nn < n1; } };
  };
  const SH = turned(-205, -30, 32);
  const SHED = { s0: -58, s1: 58, n0: -40, n1: 40, h: 128 };
  const B_FROM = -340, B_TO = -60, B_Z = 390, FOOT = { du: 72, dv: 96 };
  const SHOT = 1.1;
  const bShots = [];
  for (let i = 0; i * SHOT < 11; i++) { const tt = 0.5 + i * SHOT; bShots.push({ t: tt, u: lerp(B_FROM, B_TO, ease(tt / 11.6)) }); }
  const bPts = (() => {
    const pts = [];
    for (let i = 0; i < 900; i++) {
      const u = lerp(B_FROM - 70, B_TO + 70, rnd()), v = lerp(-96, 96, rnd());
      const cover = bShots.filter((s) => Math.abs(s.u - u) < FOOT.du && Math.abs(v) < FOOT.dv);
      if (cover.length < 2) continue;
      const p = W(u, v, 0.4);
      if (SH.inside(p, SHED.s0 - 4, SHED.s1 + 4, SHED.n0 - 4, SHED.n1 + 4)) {
        const nn = G.dot3(G.sub3(p, SH.o), SH.n);
        if (nn > SHED.n0 - 4 && nn < SHED.n1 + 4) { p[2] = SHED.h + 22 - Math.abs(nn) * (22 / 44); pts.push([p, cover[1].t, "roof"]); }
        continue;
      }
      pts.push([p, cover[1].t, ""]);
    }
    return pts;
  })();
  function shed() {
    const s = SHED;
    let svg = SH.box(s.s0, s.s1, s.n0, s.n1, 0, s.h, {});
    const F = G.frameOf(SH.at3(0, 0, 0), SH.e, SH.n, Z);
    svg += S(G.prismOf(F, [[s.n0 - 5, s.h], [s.n1 + 5, s.h], [0, s.h + 24]], s.s0 - 5, s.s1 + 5, P), { tone: "hi", crease: "lo" });
    const fz = (sx, z) => at(SH.at3(sx, s.n1 + 0.1, z));
    svg += Ln(k.pathOf([fz(-40, 0), fz(-40, 78), fz(-18, 78), fz(-18, 0)]) + k.pathOf([fz(8, 48), fz(34, 48), fz(34, 76), fz(8, 76)], true) + k.pathOf([fz(21, 48), fz(21, 76)]), { tone: "lo" });
    return svg;
  }
  function colB(t) {
    const tt = loopT(t), fade = fadeOut(tt);
    const u = lerp(B_FROM, B_TO, tt < 11.6 ? ease(tt / 11.6) : 1 - ease((tt - 12) / 11));
    const items = [];
    // photos taken so far: their footprints on the ground, the latest one bright
    const taken = bShots.filter((s) => s.t <= tt);
    const foot = (s) => k.pathOf(quad(s.u - FOOT.du, s.u + FOOT.du, -FOOT.dv, FOOT.dv, 0.3).map(at), true);
    items.push({ key: -2e5, svg: taken.length ? `<path class="ph" style="opacity:${(fade * 0.9).toFixed(2)}" d="${taken.map(foot).join("")}"/>` : "" });
    items.push({ key: -1e5, svg: cloud(bPts.filter((p) => !p[2]), tt, fade) });
    items.push({ key: depth(SH.o), svg: shed() });
    items.push({ key: 1e4, svg: cloud(bPts.filter((p) => p[2]), tt, fade) });
    const dc = W(u, -6, B_Z);
    const last = taken[taken.length - 1];
    const flash = last ? 1 - ease((tt - last.t) / 0.7) : 0;
    if (flash > 0.01 && tt < 11.6) {
      const cam = [dc[0], dc[1], B_Z - 27];
      const corners = quad(last.u - FOOT.du, last.u + FOOT.du, -FOOT.dv, FOOT.dv, 0.4);
      items.push({ key: 2e4, svg: `<g opacity="${flash.toFixed(2)}">${Ln(corners.map((c) => k.pathOf([at(cam), at(c)])).join("") + k.pathOf(corners.map(at), true), { tone: "lit" })}</g>` });
    }
    items.push({ key: 3e4, svg: drone(dc, "P1", tt * 40 + 1) });
    return { svg: sorted(items), read: `P1 <b>45 MP</b> · 80% overlap · <i>${String(taken.length).padStart(2, "0")}</i> photos` };
  }

  // ---------- column C: handheld SLAM under a footbridge ----------
  const CU = turned(COLS.C, -24, -28);
  const BR = { a0: 112, a1: 152, n0: -64, n1: 64, soffit: 214, deck: 24 };
  const C_FROM = -14, C_TO = 102;
  const cPts = (() => {
    const pts = [];
    const bornAt = (nx) => 0.8 + ((nx - C_FROM) / (C_TO - C_FROM)) * 10.4 + (rnd() - 0.5) * 1.2;
    for (let i = 0; i < 420; i++) { const nx = lerp(BR.n0 + 2, BR.n1 - 2, rnd()), z = lerp(3, BR.soffit - 3, rnd()); pts.push([CU.at3(BR.a0 - 0.5, nx, z), bornAt(nx)]); }
    for (let i = 0; i < 160; i++) { const sx = lerp(-BR.a1 + 2, -BR.a0 - 2, rnd()), z = lerp(3, BR.soffit - 3, rnd()); pts.push([CU.at3(sx, BR.n1 + 0.5, z), bornAt(BR.n1 - 20)]); }
    for (let i = 0; i < 140; i++) { const sx = lerp(-BR.a1, BR.a1, rnd()), z = lerp(BR.soffit + 2, BR.soffit + BR.deck - 2, rnd()); pts.push([CU.at3(sx, BR.n1 + 0.5, z), bornAt(BR.n1 - 10)]); }
    for (let i = 0; i < 360; i++) { const sx = lerp(-BR.a0 + 4, BR.a0 - 4, rnd()), nx = lerp(-110, 96, rnd()); const p = CU.at3(sx, nx, 0.4); if (Math.abs(G.dot3(p, VV)) > 104) continue; pts.push([p, bornAt(Math.max(C_FROM, Math.min(C_TO, nx)))]); }
    return pts;
  })();
  function abutment(sign) {
    const a0 = sign * BR.a0, a1 = sign * BR.a1;
    let svg = CU.box(Math.min(a0, a1), Math.max(a0, a1), BR.n0 - 6, BR.n1 + 6, 0, BR.soffit, {});
    // bearing shelf seam and a weep hole row on the faces
    return svg;
  }
  function deck() {
    let svg = CU.box(-BR.a1 - 6, BR.a1 + 6, BR.n0, BR.n1, BR.soffit, BR.soffit + BR.deck, { tone: "hi", crease: "lo" });
    // railings: posts on both edges and a top rail
    for (const nx of [BR.n0 + 4, BR.n1 - 4]) {
      const posts = [];
      for (let sx = -BR.a1; sx <= BR.a1 + 0.1; sx += BR.a1 / 3) posts.push(rod(CU.at3(sx, nx, BR.soffit + BR.deck), CU.at3(sx, nx, BR.soffit + BR.deck + 52), 1.6, { tone: "mid", crease: "none" }));
      svg += posts.join("") + rod(CU.at3(-BR.a1 - 2, nx, BR.soffit + BR.deck + 52), CU.at3(BR.a1 + 2, nx, BR.soffit + BR.deck + 52), 2, { tone: "mid", crease: "none" });
    }
    return svg;
  }
  function walker(nx, dir, phase, scanSpin) {
    const hip = CU.at3(-6, nx, 92);
    const fwd = G.mul3(CU.n, dir);
    const side = G.mul3(CU.e, -1);
    const items = [];
    const leg = (sd, swing) => {
      const h = G.add3(hip, G.mul3(side, sd * 8));
      const knee = G.add3(G.add3(h, G.mul3(fwd, Math.sin(swing) * 40)), [0, 0, -46]);
      const foot = G.add3(G.add3(knee, G.mul3(fwd, Math.sin(swing) * 6 - 4)), [0, 0, -44]);
      foot[2] = Math.max(foot[2], 2);
      return rod(h, knee, 5.6, { tone: "mid", crease: "none" }) + rod(knee, foot, 4.6, { tone: "mid", crease: "none" }) + rod(foot, G.add3(foot, G.mul3(fwd, 14)), 3.4, { tone: "lo", crease: "none" });
    };
    const near = G.dot3(side, V) > 0 ? 1 : -1;
    items.push(leg(-near, -Math.sin(phase) * 0.45));
    items.push(rod(G.add3(hip, G.add3(G.mul3(side, -near * 16), [0, 0, 52])), G.add3(G.add3(hip, G.mul3(side, -near * 18)), G.add3(G.mul3(fwd, -Math.sin(phase) * 14), [0, 0, 6])), 4, { tone: "mid", crease: "none" }));
    items.push(S(G.prismOf(G.frameOf([hip[0], hip[1], 88], Z, fwd, side), [[-10, -17], [10, -17], [10, 17], [-10, 17]], 0, 60, P), { tone: "mid" }));
    items.push(leg(near, Math.sin(phase) * 0.45));
    items.push(rod(G.add3(hip, [0, 0, 148 - 92]), G.add3(hip, [0, 0, 160 - 92]), 4.2) + S(G.sphereOf(G.add3(hip, [0, 0, 76]), 11, P, { steps: 32 }), { tone: "mid" }));
    const sh = G.add3(G.add3(hip, G.mul3(side, near * 16)), [0, 0, 52]);
    const hand = G.add3(G.add3(hip, G.mul3(fwd, 36)), G.add3(G.mul3(side, near * 10), [0, 0, 36]));
    items.push(rod(sh, hand, 4, { tone: "mid", crease: "none" }));
    items.push(rod(hand, G.add3(hand, [0, 0, 14]), 2.6, { tone: "lo", crease: "none" }) + S(k.cylinder(hand[0], hand[1], 5.6, hand[2] + 14, 10, P, 24), { tone: "hi", crease: "lo" }));
    const head = [hand[0], hand[1], hand[2] + 24];
    items.push(S(k.cylinder(head[0], head[1], 4.4, head[2], 7, P, 20), { tone: "mid" }) + Dt([at([head[0] + Math.cos(scanSpin) * 4.4, head[1] + Math.sin(scanSpin) * 4.4, head[2] + 4])], { size: 1, tone: "lit" }));
    return { svg: items.join(""), head: [head[0], head[1], head[2] + 3.5] };
  }
  function colC(t) {
    const tt = loopT(t), fade = fadeOut(tt);
    const f = tt < 11.6 ? ease(tt / 11.6) : 1 - ease((tt - 12) / 11);
    const nx = lerp(C_FROM, C_TO, f);
    const dir = tt < 11.8 ? 1 : -1;
    const walked = (tt < 11.6 ? f : 1 + (1 - f)) * (C_TO - C_FROM) / 100;
    const items = [];
    const creek = [[-BR.a0, -130], [BR.a0, -130], [BR.a0, 110], [-BR.a0, 110]].map(([sx, n]) => CU.at3(sx * 0.7, n, 0.2));
    items.push({ key: -4e5, svg: `<path class="iso-line" data-tone="faint" style="fill:var(--anatomy-shade-1)" d="${k.pathOf(creek.map(at), true)}"/>` });
    items.push({ key: -3e5, svg: cloud(cPts.filter(([p]) => p[2] < 1), tt, fade) });
    const far = G.dot3(CU.e, V) > 0 ? -1 : 1;
    items.push({ key: -2e5, svg: abutment(far) + cloud(cPts.filter(([p]) => p[2] >= 1 && G.dot3(G.sub3(p, CU.o), CU.e) * far > 0), tt, fade) });
    const w = walker(nx, dir, (nx - C_FROM) / 22, tt * 30);
    if (tt > 0.6 && tt < 11.4) {
      const rays = [];
      for (let i = 0; i < 7; i++) { const a = tt * 6 + i * 0.9; const hit = CU.at3(BR.a0 - 1, nx + Math.sin(a * 1.3) * 60, 20 + (Math.sin(a) * 0.5 + 0.5) * (BR.soffit - 40)); rays.push(k.pathOf([at(w.head), at(hit)])); }
      w.svg += `<g opacity=".5">${Ln(rays.join(""), { tone: "lit" })}</g>`;
    }
    items.push({ key: -1e5, svg: abutment(-far) + cloud(cPts.filter(([p]) => p[2] >= 1 && p[2] < BR.soffit && G.dot3(G.sub3(p, CU.o), CU.e) * far < 0), tt, fade) });
    // the walker passes behind the near abutment's face only while under the deck
    items.push({ key: nx > BR.n1 ? 1e5 : -0.5e5, svg: w.svg });
    items.push({ key: 0, svg: deck() + cloud(cPts.filter(([p]) => p[2] >= BR.soffit), tt, fade) });
    return { svg: sorted(items), read: `SLAM · walked <i>${walked.toFixed(1)} m</i> · ${tt < 11.6 ? "mapping" : "<b>loop closed</b>"}` };
  }

  // ---------- column D: SX10 scanning a retaining wall from one setup ----------
  const WA = turned(COLS.D + 10, -66, 24);
  const WALL = { s0: -128, s1: 128, n0: -18, n1: 0, h: 170 };
  const D0 = W(COLS.D - 40, 40, 0);
  const SX_Z = 158;
  const azOf = (p) => Math.atan2(p[1] - D0[1], p[0] - D0[0]);
  const dPts = (() => {
    const pts = [];
    const a0 = azOf(WA.o);
    const born = (p) => { let d = azOf(p) - a0; d = ((d % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); return 0.8 + (d / (2 * Math.PI)) * 20; };
    for (let i = 0; i < 380; i++) { const sx = lerp(WALL.s0 + 2, WALL.s1 - 2, rnd()), z = lerp(4, WALL.h - 4, rnd()); const p = WA.at3(sx, 0.5, z); pts.push([p, born(p)]); }
    for (let i = 0; i < 520; i++) { const a = rnd() * Math.PI * 2, r = lerp(30, 175, Math.sqrt(rnd())); const p = [D0[0] + Math.cos(a) * r, D0[1] + Math.sin(a) * r, 0.4]; const q = [(p[0] - p[1]) * R2, (p[0] + p[1]) * R2]; if (q[1] < -100 || q[1] > 104 || q[0] < COLS.D - 190 || q[0] > 770 || G.dot3(G.sub3(p, WA.o), WA.n) < 2) continue; pts.push([p, born(p)]); }
    return pts;
  })();
  function sx10(yaw) {
    const [x, y] = D0;
    const items = tripod(x, y, 137, { phase: 0.4 });
    const F = G.frameOf([x, y, 144], Z, [1, 0, 0], [0, 1, 0]);
    let head = S(k.cylinder(x, y, 9, 137, 4, P, 28), { tone: "mid" }) + S(k.cylinder(x, y, 12, 141, 4, P, 32), { tone: "mid" });
    const body = S(G.solidOf([[0, 13, 1], [10, 14, 1], [20, 13.2, 1], [28, 9, 1], [32, 0, 1]], G.frameOf([x, y, 145], Z, [1, 0, 0], [0, 1, 0]), P, { steps: 40 }), { tone: "hi", crease: "lo" });
    const d = [Math.cos(yaw), Math.sin(yaw), 0];
    const lensF = G.frameAlong([x + d[0] * 11, y + d[1] * 11, SX_Z], d);
    const lens = S(G.disc(0, 4, 5.4, lensF, P, { steps: 24 }), { tone: "mid" }) + Ln(G.circleOf(lensF, 4, 3.4, P, 20), { tone: "lit" });
    head += G.dot3(d, V) > 0 ? body + lens : lens + body;
    items.push({ key: depth([x, y, 140]) + 1, svg: head });
    return items;
  }
  function colD(t) {
    const tt = loopT(t), fade = fadeOut(tt);
    const a0 = azOf(WA.o);
    const sweep = Math.min(1, Math.max(0, (tt - 0.8) / 20));
    const yaw = a0 + sweep * Math.PI * 2 + (tt > 21 ? -ease((tt - 21) / 2.6) * Math.PI * 2 : 0);
    const items = [];
    items.push({ key: -2e5, svg: cloud(dPts.filter(([p]) => p[2] < 1), tt, fade) });
    const wall = WA.box(WALL.s0, WALL.s1, WALL.n0, WALL.n1, 0, WALL.h, {}) + WA.box(WALL.s0 - 4, WALL.s1 + 4, WALL.n0 - 3, WALL.n1 + 3, WALL.h, WALL.h + 8, { tone: "mid" });
    const joints = [];
    for (let sx = WALL.s0 + 60; sx < WALL.s1 - 10; sx += 60) joints.push(path([WA.at3(sx, 0.1, 0), WA.at3(sx, 0.1, WALL.h)]));
    items.push({ key: -1.5e5, svg: wall + Ln(joints.join(""), { tone: "lo" }) + Dt([-120, -60, 0, 60, 120].flatMap((sx) => [[sx, 46], [sx, 124]]).map(([sx, z]) => at(WA.at3(sx + 30, 0.1, z))), { size: 0.6 }) });
    items.push({ key: -1e5, svg: cloud(dPts.filter(([p]) => p[2] >= 1), tt, fade) });
    sx10(yaw).forEach((it) => items.push(it));
    if (sweep > 0 && sweep < 1) {
      const d = [Math.cos(yaw), Math.sin(yaw), 0];
      const src = [D0[0] + d[0] * 15, D0[1] + d[1] * 15, SX_Z];
      // where the beam lands: the wall if it faces it, otherwise the ground ahead
      let reach = 120; for (; reach > 30; reach -= 5) { const e = [D0[0] + d[0] * reach, D0[1] + d[1] * reach]; const q = [(e[0] - e[1]) * R2, (e[0] + e[1]) * R2]; if (Math.abs(q[1]) < 100 && q[0] < 770) break; }
      let end = [D0[0] + d[0] * reach, D0[1] + d[1] * reach, 0];
      const vd = G.dot3(d, WA.n);
      if (vd < -0.2) { const s = G.dot3(G.sub3(src, WA.o), WA.n) / -vd; const e = G.add3(src, G.mul3(d, s)); const ss = G.dot3(G.sub3(e, WA.o), WA.e); if (ss > WALL.s0 && ss < WALL.s1) end = [e[0], e[1], SX_Z - 50 + Math.sin(tt * 9) * 70]; }
      items.push({ key: depth([D0[0], D0[1], 140]) + (G.dot3(d, V) > 0 ? 2 : -2), svg: Ln(k.pathOf([at(src), at(end)]), { tone: "lit" }) });
    }
    const n = Math.round(sweep * 20 * 26600);
    return { svg: sorted(items), read: `SX10 <b>26.6k</b> pts/s · <i>${Math.round(sweep * 360)}°</i> · ${(n / 1000).toFixed(0)}k` };
  }

  function frame(t) {
    const a = colA(t), b = colB(t), c = colC(t), d = colD(t);
    return { A: a.svg, B: b.svg, C: c.svg, D: d.svg, s: { readA: a.read, readB: b.read, readC: c.read, readD: d.read } };
  }
  function extents() {
    return [...quad(BASE.u0, BASE.u1, BASE.v0, BASE.v1, -16), ...quad(BASE.u0, BASE.u1, BASE.v0, BASE.v1, 0), W(COLS.A, -6, A_Z + 16), W(COLS.B, -6, B_Z + 16)];
  }
  return { board, frame, extents, W };
}
