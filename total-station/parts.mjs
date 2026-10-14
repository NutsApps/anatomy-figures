// Every part of the instrument and the prism bench. The build draws them at rest and the page
// rebuilds the moving ones from this same module, so the drawing and the live figure agree.
export function makeParts(k, G, P, M) {
  const V = G.viewOf(P);
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const Ln = (d, style) => k.lineSvg(d, style);
  const Dt = (points, style) => k.dotsSvg(points, style);
  const depth = (p) => G.dot3(p, V);
  const Z = [0, 0, 1];
  const [OX, OY, TZ] = M.TRUNNION;
  const path = (points, closed) => k.pathOf(points.map(at), closed);

  // ---- fixed instrument: pier, tribrach, circle housing, horizontal glass circle ----
  const PIER = { base: 56, r: 46, top: 39 };
  const DISC_R = 47;
  const DISC_Z = 70;
  const DISC_T = 1.6;
  const tri = (r, round, z) => {
    const ring = [];
    for (let c = 0; c < 3; c++) {
      const a0 = 90 + c * 120;
      for (let j = 0; j <= 10; j++) {
        const a = (a0 - 40 + j * 8) * M.DEG;
        ring.push([OX + Math.cos(a) * r + Math.cos(a) * round * 0, OY + Math.sin(a) * r]);
      }
    }
    return ring;
  };
  const lobes = (r) => [0, 1, 2].map((c) => [OX + Math.cos((90 + c * 120) * M.DEG) * r, OY + Math.sin((90 + c * 120) * M.DEG) * r]);
  const byDepth = (list) => [...list].sort((a, b) => depth([a[0], a[1], 0]) - depth([b[0], b[1], 0]));

  function fixedBase() {
    const out = [];
    const plan = { x: OX - PIER.base, y: OY - PIER.base, w: PIER.base * 2, d: PIER.base * 2, r: PIER.base };
    out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(plan, 4), 0, 4, P)}"/>`);
    // pier: floor flange with anchor bolts, concrete column, forced-centring plate
    out.push(S(k.cylinder(OX, OY, PIER.base, 0, 4, P, 72, 0.8), { tone: "lo" }));
    const bolts = byDepth([45, 135, 225, 315].map((a) => [OX + Math.cos(a * M.DEG) * 50, OY + Math.sin(a * M.DEG) * 50]));
    for (const [x, y] of bolts) {
      out.push(S(k.cylinder(x, y, 3, 4, 2, P, 6), { tone: "mid", crease: "none" }));
      out.push(Dt([at([x, y, 6.6])], { size: 0.5 }));
      out.push(S(k.cylinder(x, y, 1.1, 6, 0.6, P, 12), { tone: "mid", crease: "none" }));
    }
    out.push(S(k.cylinder(OX, OY, PIER.r, 4, 32, P, 72), { tone: "mid", inner: Ln(k.sideArc(OX, OY, PIER.r, 14, P, 48), { tone: "faint" }) + Ln(k.sideArc(OX, OY, PIER.r, 25, P, 48), { tone: "faint" }) }));
    out.push(S(k.cylinder(OX, OY, PIER.r + 2, 36, 3, P, 72, 0.6), { tone: "mid" }));
    out.push(Ln(k.ring(OX, OY, PIER.r - 4, 39, P, 64), { tone: "faint" }));
    const plateScrews = byDepth([30, 150, 270].map((a) => [OX + Math.cos(a * M.DEG) * 42, OY + Math.sin(a * M.DEG) * 42]));
    out.push(Ln(plateScrews.map(([x, y]) => k.ring(x, y, 1.8, 39, P, 14)).join(""), { tone: "lo" }));
    out.push(Dt(plateScrews.map(([x, y]) => at([x, y, 39])), { size: 0.45 }));
    // name plate on the flange, toward the viewer, its engraving as three rule lines
    const tv = k.towardViewer(P);
    const np = [OX + tv[0] * 51, OY + tv[1] * 51];
    const plate = { x: np[0] - 3, y: np[1] - 3, w: 6, d: 6, r: 0.8 };
    out.push(S(k.slabOf(plate, 4, 0.6, P, 3), { tone: "lo" }));
    for (const [dy, len] of [[-1.5, 4], [0, 3], [1.5, 3.6]]) out.push(Ln(k.lineOnTop([np[0] - 2, np[1] + dy], [np[0] - 2 + len, np[1] + dy], 4.6, P), { tone: "lo", free: true }));
    // tribrach: base plate, three knurled foot screws, upper body, bubble, lock lever
    out.push(S(k.extrude(tri(40, 0, 0), 39, 3, P, { bevel: 0.4 }), { tone: "mid" }));
    const feet = byDepth(lobes(31));
    for (const [x, y] of feet) {
      out.push(S(k.cylinder(x, y, 2.4, 42, 10, P, 16), { tone: "mid", crease: "none" }));
      out.push(S(k.cylinder(x, y, 6.2, 44, 5, P, 32), { tone: "mid" }));
      out.push(Ln(k.knurl(x, y, 6.2, 44, 49, 26, P, 0.4), { tone: "lo" }));
    }
    out.push(S(k.extrude(tri(36, 0, 0), 52, 7, P, { bevel: 0.6 }), { tone: "mid" }));
    const vial = lobes(27)[2];
    out.push(S(k.cylinder(vial[0], vial[1], 4.6, 59, 1.6, P, 28), { tone: "mid" }));
    out.push(Ln(k.ring(vial[0], vial[1], 3.4, 60.6, P, 28), { tone: "lo" }));
    out.push(Ln(k.ring(vial[0], vial[1], 1.3, 60.6, P, 16), { tone: "hi" }));
    const lever = lobes(27)[1];
    out.push(S(k.cylinder(lever[0], lever[1], 3.2, 59, 2.4, P, 20), { tone: "mid" }));
    out.push(Ln(k.lineOnTop([lever[0], lever[1]], [lever[0] + 6, lever[1] - 3], 61.4, P), { tone: "hi" }));
    out.push(Dt([at([lever[0], lever[1], 61.4])], { size: 0.45 }));
    // circle housing (fixed to the tribrach), with its seam and index mark
    out.push(S(k.cylinder(OX, OY, 34, 59, DISC_Z - 59, P, 72, 0.6), { tone: "mid", inner: Ln(k.sideArc(OX, OY, 34, 63, P, 48), { tone: "faint" }) }));
    // horizontal glass circle with its code track; zero index at HZ_ZERO
    out.push(S(k.cylinder(OX, OY, DISC_R, DISC_Z, DISC_T, P, 96), { tone: "hi", crease: "lo" }));
    const top = DISC_Z + DISC_T;
    const ticks = { minor: [], major: [] };
    for (let i = 0; i < 144; i++) {
      const a = (M.HZ_ZERO - i * 2.5) * M.DEG;
      const big = i % 12 === 0;
      const r0 = DISC_R - 1 - (big ? 4.4 : 2.4);
      (big ? ticks.major : ticks.minor).push(k.lineOnTop([OX + Math.cos(a) * r0, OY + Math.sin(a) * r0], [OX + Math.cos(a) * (DISC_R - 1), OY + Math.sin(a) * (DISC_R - 1)], top, P));
    }
    out.push(Ln(k.ring(OX, OY, DISC_R - 1, top, P, 96), { tone: "lo" }));
    out.push(Ln(k.ring(OX, OY, DISC_R - 7.6, top, P, 96), { tone: "faint" }));
    out.push(Ln(ticks.minor.join(""), { tone: "lo" }), Ln(ticks.major.join(""), { tone: "mid" }));
    const z0 = M.HZ_ZERO * M.DEG;
    out.push(Ln(k.lineOnTop([OX + Math.cos(z0) * (DISC_R - 7.6), OY + Math.sin(z0) * (DISC_R - 7.6)], [OX + Math.cos(z0) * (DISC_R - 1), OY + Math.sin(z0) * (DISC_R - 1)], top, P), { tone: "hi" }));
    out.push(Ln(k.ring(OX, OY, 20, top, P, 48), { tone: "faint" }));
    // spindle bushing
    out.push(S(k.cylinder(OX, OY, 16, top, 4, P, 48), { tone: "mid" }));
    return out.join("");
  }

  // ---- the alidade: everything that turns with the telescope ----
  const BODY = { s0: -30, s1: 30, c: 44, z0: 84, z1: 104 };
  const STD = { s0: -22, s1: 22, c0: 30, c1: 44, z1: 142 };
  const TEL = { eye: -36, obj: 36 };
  function frames(bearing, tilt) {
    const d = [Math.cos(bearing), Math.sin(bearing), 0];
    const l = [-Math.sin(bearing), Math.cos(bearing), 0]; // the operator's left
    const r = G.mul3(l, -1);
    const t = [Math.cos(tilt) * d[0], Math.cos(tilt) * d[1], Math.sin(tilt)];
    const up = G.cross3(r, t);
    return { d, l, r, t, up };
  }
  // a point in the alidade: s along the sight, c to the right, z up
  const A = (f, s, c, z) => [OX + f.d[0] * s + f.r[0] * c, OY + f.d[1] * s + f.r[1] * c, z];
  const box = (f, s0, s1, c0, c1, z0, z1, style, extra = "") => {
    const F = G.frameOf([OX, OY, z0], Z, f.d, f.l);
    const poly = [[s0, -c0], [s1, -c0], [s1, -c1], [s0, -c1]];
    return S(G.prismOf(F, poly, 0, z1 - z0, P), { tone: "mid", ...style }) + extra;
  };
  // a point in the telescope: s along the line of sight, c right, u up
  const T = (f, s, c, u) => G.add3(G.add3(G.add3(M.TRUNNION, G.mul3(f.t, s)), G.mul3(f.r, c)), G.mul3(f.up, u));

  function alidade(bearing, tilt, phase = 0, lock = 1) {
    const f = frames(bearing, tilt);
    const items = [];
    const put = (svg) => items.push(svg);
    const top = DISC_Z + DISC_T;
    // read-head arms and heads (left first: it is the far side)
    const heads = [-1, 1].map((side) => {
      const out = [];
      out.push(box(f, -5, 5, side * 14, side * 52, 78, 82, {}, ""));
      // head block hangs outboard of the glass, a sensor finger reaches over the code track
      out.push(box(f, -6, 6, side * (DISC_R + 0.8), side * (DISC_R + 6.4), top - 6, 82, {}));
      out.push(box(f, -3.5, 3.5, side * (DISC_R - 6.4), side * (DISC_R + 0.8), top + 0.5, top + 2.4, { tone: "hi", crease: "lo" }));
      out.push(Dt([at(A(f, 0, side * (DISC_R + 3.6), 82))], { size: 0.45 }));
      return out.join("");
    });
    put(heads[0]);
    // yoke and spindle collar
    put(S(k.cylinder(OX, OY, 12, top + 4, 4, P, 40), { tone: "mid" }) + S(k.cylinder(OX, OY, 26, 76, 8, P, 72, 0.6), { tone: "mid" }));
    put(Dt([-1, 1].map((s) => at(A(f, s * 18, 0, 84))), { size: 0.45 }));
    put(heads[1]);
    // body: lower case with a seam, battery door on the left, display and keypad on the eyepiece face
    put(box(f, BODY.s0, BODY.s1, -BODY.c, BODY.c, BODY.z0, BODY.z1, {}, ""));
    put(Ln(path([A(f, BODY.s0, -BODY.c, 92), A(f, BODY.s0, BODY.c, 92), A(f, BODY.s1, BODY.c, 92)]), { tone: "faint" }));
    // display panel on the near (eyepiece) face
    const DS = BODY.s0;
    put(box(f, DS - 1.6, DS, -34, 34, 86, 102, {}, ""));
    const face = DS - 1.6;
    const F = (c, z) => A(f, face, c, z);
    // screen recess, keypad
    put(Ln(path([F(-30, 99.5), F(-2, 99.5), F(-2, 88.5), F(-30, 88.5)], true), { tone: "lo" }));
    put(Ln(path([F(-29, 98.5), F(-3, 98.5), F(-3, 89.5), F(-29, 89.5)], true), { tone: "faint" }));
    const keys = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) keys.push(at(F(6 + i * 6.4, 97 - j * 4.4)));
    put(Dt(keys, { size: 0.55, tone: "mid" }));
    put(screenTraces(f, face, phase, lock));
    // standards (left is far), with the telescope split where the standards cut it
    // the body's top strip in front of the standards: a bubble vial and the power key
    const vial = A(f, -26, -36, BODY.z1);
    put(S(k.cylinder(vial[0], vial[1], 3, BODY.z1, 1.4, P, 24), { tone: "mid" }) + Ln(k.ring(vial[0], vial[1], 1.9, BODY.z1 + 1.4, P, 20), { tone: "lo" }) + Dt([at([vial[0], vial[1], BODY.z1 + 1.4])], { size: 0.5, tone: "hi" }));
    const key = A(f, -26, 34, BODY.z1);
    put(S(k.cylinder(key[0], key[1], 2.4, BODY.z1, 1, P, 20), { tone: "mid" }));
    put(box(f, STD.s0, STD.s1, -STD.c1, -STD.c0, BODY.z1, STD.z1, {}));
    put(Ln(path([A(f, STD.s0, -STD.c0, 132), A(f, STD.s1, -STD.c0, 132)]), { tone: "faint" }));
    put(Dt([at(A(f, -16, -37, STD.z1)), at(A(f, 16, -37, STD.z1))], { size: 0.45 }));
    put(telescope(f, 22, TEL.obj, true));
    put(trunnion(f, -1));
    put(telescope(f, -22, 22, false));
    put(trunnion(f, 1));
    put(box(f, STD.s0, STD.s1, STD.c0, STD.c1, BODY.z1, STD.z1, {}, ""));
    put(Ln(path([A(f, STD.s0, STD.c0, 132), A(f, STD.s0, STD.c1, 132)]), { tone: "faint" }));
    put(Dt([at(A(f, -16, 37, STD.z1)), at(A(f, 16, 37, STD.z1))], { size: 0.45 }));
    put(telescope(f, TEL.eye, -22, false));
    // carrying handle across the standards
    put(box(f, -4, 4, -40, -34, STD.z1, 152, {}) + box(f, -4, 4, 34, 40, STD.z1, 152, {}));
    put(box(f, -5, 5, -42, 42, 152, 157, {}, ""));
    put(Dt([at(A(f, 0, -37, 157)), at(A(f, 0, 37, 157))], { size: 0.45 }));
    // vertical circle outboard of the right standard, cover off
    put(verticalCircle(f, tilt));
    // drive knobs on the body's right side
    for (const s of [-16, 12]) {
      const K = G.frameAlong(A(f, s, BODY.c, 94), f.r);
      put(S(G.disc(0, 2, 3, K, P), { tone: "mid" }) + S(G.disc(2, 7, 5.4, K, P), { tone: "mid" }) + k.fadedSvg(G.ribsOf(K, 2, 7, 5.4, 18, P, { fade: [0.1, 0.55] }), { tone: "lo" }));
    }
    return items.join("");
  }

  function trunnion(f, side) {
    const K = G.frameAlong(M.TRUNNION, G.mul3(f.r, side));
    return S(G.disc(15, STD.c0, 7.4, K, P), { tone: "mid" });
  }

  // the telescope, turned along its line of sight; drawn in three pieces split by the standards
  const TPROF = [[-36, 5.4], [-30, 5.4], [-30, 7.6], [-22, 7.6], [-22, 13], [-16, 13], [-16, 14.6], [-6, 14.6], [-6, 13], [20, 13], [20, 16.4], [36, 16.4]];
  const clip = (profile, s0, s1) => {
    const rAt = (s) => {
      for (let i = 0; i < profile.length - 1; i++) {
        const [a, ra] = profile[i], [b, rb] = profile[i + 1];
        if (s >= a && s <= b && b > a) return ra + ((rb - ra) * (s - a)) / (b - a);
      }
      return profile[profile.length - 1][1];
    };
    const inside = profile.filter(([s]) => s > s0 && s < s1);
    const first = profile.filter(([s]) => s === s0);
    const last = profile.filter(([s]) => s === s1);
    return [...(first.length ? first.slice(-1) : [[s0, rAt(s0)]]), ...inside, ...(last.length ? last.slice(0, 1) : [[s1, rAt(s1)]])];
  };
  function telescope(f, s0, s1, objective) {
    const F = G.frameOf(M.TRUNNION, f.t, f.up, f.r);
    const out = [];
    out.push(S(G.solidOf(clip(TPROF, s0, s1), F, P, { rims: s0 === TEL.eye ? "first" : s1 === TEL.obj ? "last" : "none" }), { tone: "hi", crease: "lo" }));
    if (s0 <= -16 && s1 >= -6) out.push(k.fadedSvg(G.ribsOf(F, -16, -6, 14.6, 40, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }));
    if (s0 <= -30 && s1 >= -22) out.push(k.fadedSvg(G.ribsOf(F, -30, -22, 7.6, 22, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }));
    if (s0 === TEL.eye) out.push(Ln(G.circleOf(F, TEL.eye, 3, P, 24), { tone: "lo" }));
    if (objective) out.push(Ln(G.arcOf(F, 28, 16.4, P), { tone: "faint" }));
    if (!objective && s0 === -22) {
      // optical sight on top of the telescope
      const B = G.frameOf(T(f, 0, 0, 13), f.t, f.up, f.r);
      out.push(S(G.prismOf(B, [[0, -2.4], [4.4, -2.4], [4.4, 2.4], [0, 2.4]], -12, 10, P), { tone: "mid" }));
      out.push(Dt([at(T(f, -12, 0, 15.4))], { size: 0.45, tone: "hi" }));
    }
    return out.join("");
  }

  function verticalCircle(f, tilt) {
    const out = [];
    const F = G.frameOf(G.add3(M.TRUNNION, G.mul3(f.r, STD.c1)), f.r, f.up, f.t);
    out.push(S(G.disc(0, 1.6, 9, F, P), { tone: "mid" }));
    out.push(S(G.disc(1.6, 3.2, 21, F, P), { tone: "hi", crease: "lo" }));
    // code track turns with the telescope
    const track = [];
    const major = [];
    for (let i = 0; i < 72; i++) {
      const a = tilt + (i / 72) * Math.PI * 2;
      const big = i % 6 === 0;
      const p0 = G.pointOf(F, 3.2, big ? 15.6 : 17.4, a);
      const p1 = G.pointOf(F, 3.2, 20, a);
      (big ? major : track).push(k.pathOf([at(p0), at(p1)]));
    }
    out.push(Ln(G.circleOf(F, 3.2, 20, P, 72), { tone: "lo" }), Ln(track.join(""), { tone: "lo" }), Ln(major.join(""), { tone: "mid" }));
    out.push(Ln(G.circleOf(F, 3.2, 13, P, 48), { tone: "faint" }));
    out.push(S(G.disc(3.2, 5.6, 5, F, P), { tone: "mid" }));
    out.push(Dt([at(G.pointOf(F, 5.6, 0, 0))], { size: 0.5 }));
    // read head on the standard, its finger over the code track at the eyepiece side
    out.push(box(f, -30, -21.6, STD.c1 - 2, STD.c1 + 5.6, 108, 120, {}));
    out.push(box(f, -24.5, -15.4, STD.c1 + 3.4, STD.c1 + 5.2, 111, 117, { tone: "hi", crease: "lo" }));
    return out.join("");
  }

  // the display: what the EDM compares, sent and returned modulation, drawn in the face plane
  // the EDM's phase comparison: the modulation it sends (upper) and the one that comes back (lower),
  // shifted by the phase of the round trip, over one and a half cycles of the window
  function screenTraces(f, face, phase, lock) {
    const W0 = -29, W1 = -3;
    const trace = (z, shift) => {
      const pts = [];
      for (let i = 0; i <= 52; i++) {
        const c = W0 + ((W1 - W0) * i) / 52;
        const cycles = (1.5 * i) / 52;
        pts.push(A(f, face - 0.05, c, z + 1.5 * Math.sin(2 * Math.PI * cycles - (shift * Math.PI) / 180)));
      }
      return path(pts);
    };
    const mark = (shift) => (W0 + ((W1 - W0) * (shift / 360)) / 1.5);
    return Ln(trace(96, 0), { tone: "mid" }) + (lock > 0.02 ? `<g opacity="${lock.toFixed(2)}">${Ln(trace(92, phase), { tone: "hi" })}${Ln(path([A(f, face - 0.05, mark(phase), 98.5), A(f, face - 0.05, mark(phase), 89.5)]), { tone: "faint" })}</g>` : "");
  }

  // ---- the prism bench ----
  const E = G.unit3([M.RAIL_B[0] - M.RAIL_A[0], M.RAIL_B[1] - M.RAIL_A[1], 0]);
  const N = [-E[1], E[0], 0];
  const MID = [(M.RAIL_A[0] + M.RAIL_B[0]) / 2, (M.RAIL_A[1] + M.RAIL_B[1]) / 2];
  const HALF = Math.hypot(M.RAIL_B[0] - M.RAIL_A[0], M.RAIL_B[1] - M.RAIL_A[1]) / 2;
  const BED = { half: HALF + 34, w: 30, z0: 9, z1: 20 };
  // a point on the bench: a along the rail from its middle, n across, z up
  const R = (a, n, z) => [MID[0] + E[0] * a + N[0] * n, MID[1] + E[1] * a + N[1] * n, z];
  const benchBox = (a0, a1, n0, n1, z0, z1, style = {}, bevel = 0) => {
    const F = G.frameOf([MID[0], MID[1], z0], Z, E, N);
    return S(G.prismOf(F, [[a0, n0], [a1, n0], [a1, n1], [a0, n1]], 0, z1 - z0, P), { tone: "mid", ...style });
  };
  const nearSide = G.dot3(N, V) > 0 ? 1 : -1;
  const alongV = G.dot3(E, V);

  function bench() {
    const out = [];
    const ring = [[-BED.half, -BED.w - 6], [BED.half, -BED.w - 6], [BED.half, BED.w + 6], [-BED.half, BED.w + 6]].map(([a, n]) => R(a, n, 0));
    out.push(`<path class="iso-halo" d="${k.pathOf(ring.map(at), true)}"/>`);
    // levelling feet under each end, near one last
    const feet = [-BED.half + 16, BED.half - 16].sort((a, b) => a * alongV - b * alongV);
    for (const a of feet) {
      out.push(benchBox(a - 11, a + 11, -BED.w - 4, BED.w + 4, 0, 4, { tone: "lo" }));
      const pads = [-1, 1].sort((x, y) => x * nearSide - y * nearSide).map((n) => R(a, n * (BED.w - 2), 4));
      for (const p of pads) out.push(S(k.cylinder(p[0], p[1], 3.4, 4, 5, P, 20), { tone: "mid" }) + Ln(k.knurl(p[0], p[1], 3.4, 4, 9, 14, P), { tone: "lo" }));
    }
    // the bed: a steel beam with a top groove
    out.push(benchBox(-BED.half, BED.half, -BED.w, BED.w, BED.z0, BED.z1, {}));
    out.push(Ln(k.pathOf([R(-BED.half, nearSide * BED.w, 14.5), R(BED.half, nearSide * BED.w, 14.5)].map(at)), { tone: "faint" }));
    const g0 = [[-BED.half + 4, -BED.w + 4], [BED.half - 4, -BED.w + 4], [BED.half - 4, BED.w - 4], [-BED.half + 4, BED.w - 4]];
    out.push(Ln(k.pathOf(g0.map(([a, n]) => at(R(a, n, BED.z1))), true), { tone: "faint" }));
    const cs = [[-BED.half + 9, -BED.w + 9], [BED.half - 9, -BED.w + 9], [BED.half - 9, BED.w - 9], [-BED.half + 9, BED.w - 9]];
    out.push(Dt(cs.map(([a, n]) => at(R(a, n, BED.z1))), { size: 0.45 }));
    // ruler strip along the near side of the bed, ticks hanging from its rail-side edge
    const RN0 = nearSide * 14, RN1 = nearSide * 26;
    out.push(benchBox(-HALF - 8, HALF + 8, Math.min(RN0, RN1), Math.max(RN0, RN1), BED.z1, BED.z1 + 0.6, { tone: "lo", crease: "none" }));
    const minor = [], major = [];
    for (let i = 0, a = -HALF; a <= HALF + 0.01; i++, a += HALF / 20) {
      const big = i % 5 === 0;
      (big ? major : minor).push(k.pathOf([R(a, RN0, BED.z1 + 0.6), R(a, RN0 + nearSide * (big ? 6 : 3.2), BED.z1 + 0.6)].map(at)));
    }
    out.push(Ln(minor.join(""), { tone: "lo" }), Ln(major.join(""), { tone: "mid" }));
    out.push(Dt([R(-HALF - 5, (RN0 + RN1) / 2, BED.z1 + 0.6), R(HALF + 5, (RN0 + RN1) / 2, BED.z1 + 0.6)].map(at), { size: 0.45 }));
    // label plate on the far side of the bed top
    const LA = BED.half - 34;
    out.push(benchBox(LA - 12, LA + 12, -nearSide * 26, -nearSide * 14, BED.z1, BED.z1 + 0.8, { tone: "lo" }));
    for (const [m, len] of [[17, 16], [20, 12], [23, 18]]) out.push(Ln(k.pathOf([R(LA - 9, -nearSide * m, BED.z1 + 0.8), R(LA - 9 + len, -nearSide * m, BED.z1 + 0.8)].map(at)), { tone: "lo", free: true }));
    out.push(Dt([R(LA - 10.5, -nearSide * 20, BED.z1 + 0.8), R(LA + 10.5, -nearSide * 20, BED.z1 + 0.8)].map(at), { size: 0.4 }));
    // the rail, screwed down every 40 units
    out.push(benchBox(-HALF - 22, HALF + 22, -5, 5, BED.z1, BED.z1 + 5, {}));
    const screws = [];
    for (let a = -HALF - 12; a <= HALF + 12; a += (2 * HALF + 24) / 6) screws.push(at(R(a, 0, BED.z1 + 5)));
    out.push(Dt(screws, { size: 0.45 }));
    return out.join("");
  }

  function stops() {
    return [-HALF - 22, HALF + 22].map((a) => {
      const a0 = a < 0 ? a - 6 : a, a1 = a < 0 ? a : a + 6;
      return { key: a * alongV, svg: benchBox(a0, a1, -11, 11, BED.z1, BED.z1 + 12, {}) + Dt([R((a0 + a1) / 2, -6, BED.z1 + 12), R((a0 + a1) / 2, 6, BED.z1 + 12)].map(at), { size: 0.45 }) };
    });
  }

  function carriage(t) {
    const a = -HALF + 2 * HALF * t;
    const [px, py] = M.railAt(t);
    const pz = M.PRISM_Z;
    const g = G.unit3([OX - px, OY - py, 0]); // the prism faces the instrument
    const h = [-g[1], g[0], 0];
    const out = [];
    const RZ = BED.z1 + 5;
    // gibs either side of the rail, the plate, the lock screw and the index tab
    for (const n of [-1, 1].sort((x, y) => x * nearSide - y * nearSide)) out.push(benchBox(a - 15, a + 15, n < 0 ? -9.6 : 5.4, n < 0 ? -5.4 : 9.6, BED.z1 + 1, RZ, {}));
    out.push(benchBox(a - 4, a + 4, nearSide > 0 ? 18 : -27, nearSide > 0 ? 27 : -18, RZ + 0.4, RZ + 1.4, { tone: "hi", crease: "lo" }));
    out.push(Ln(k.pathOf([R(a, nearSide * 20, RZ + 1.4), R(a, nearSide * 27, RZ + 1.4)].map(at)), { tone: "hi" }));
    out.push(benchBox(a - 18, a + 18, -20, 20, RZ, RZ + 6, {}));
    out.push(Dt([[-14, -16], [14, -16], [-14, 16], [14, 16]].map(([da, n]) => at(R(a + da, n, RZ + 6))), { size: 0.45 }));
    const knob = G.frameAlong(R(a - 8, nearSide * 20, RZ + 3), G.mul3(N, nearSide));
    out.push(S(G.disc(0, 2, 1.6, knob, P), { tone: "mid" }) + S(G.disc(2, 6, 4, knob, P), { tone: "mid" }) + k.fadedSvg(G.ribsOf(knob, 2, 6, 4, 14, P, { fade: [0.1, 0.55] }), { tone: "lo" }));
    // mast: an adapter, a pole with a clamp collar
    const base = RZ + 6;
    out.push(S(k.cylinder(px, py, 10, base, 5, P, 40), { tone: "mid" }) + Ln(k.knurl(px, py, 10, base, base + 5, 30, P), { tone: "lo" }));
    out.push(S(k.cylinder(px, py, 3.4, base + 5, pz - 24 - base - 5, P, 20), { tone: "mid", crease: "none", inner: Ln(k.sideArc(px, py, 3.4, base + 60, P, 12), { tone: "faint" }) }));
    out.push(S(k.cylinder(px, py, 5.2, pz - 34, 6, P, 24), { tone: "mid" }));
    // the prism holder, turned to face the instrument: yoke, far arm, canister, near arm, target
    const H = (s, c, z) => [px + g[0] * s + h[0] * c, py + g[1] * s + h[1] * c, z];
    const hb = (s0, s1, c0, c1, z0, z1, style = {}) => S(G.prismOf(G.frameOf([px, py, z0], Z, g, h), [[s0, c0], [s1, c0], [s1, c1], [s0, c1]], 0, z1 - z0, P), { tone: "mid", ...style });
    const head = [];
    head.push({ key: depth([px, py, pz - 22]), svg: hb(-4, 4, -19, 19, pz - 24, pz - 20) + S(k.cylinder(px, py, 3.4, pz - 28, 4, P, 20), { tone: "mid" }) });
    for (const c of [-1, 1]) {
      const arm = hb(-3, 3, c * 15.8, c * 18.6, pz - 20, pz + 4);
      const K = G.frameAlong(H(0, c * 18.6, pz), G.mul3(h, c));
      const pivot = S(G.disc(0, 2.4, 4.2, K, P), { tone: "mid" }) + Dt([at(H(0, c * 21, pz))], { size: 0.45 });
      head.push({ key: depth(H(0, c * 17, pz)), svg: arm + pivot });
    }
    const C = G.frameOf([px, py, pz], g, h, Z);
    const glass = [];
    for (let i = 0; i < 3; i++) glass.push(k.pathOf([at([px + g[0] * 7, py + g[1] * 7, pz]), at(G.pointOf(C, 7, 10.6, Math.PI / 2 + (i * 2 * Math.PI) / 3))]));
    const can = S(G.solidOf([[-9, 11.6], [4, 11.6], [4, 13.2], [7, 13.2]], C, P, { rims: "last" }), { tone: "hi", crease: "lo", inner: Ln(G.arcOf(C, -2, 11.6, P), { tone: "faint" }) });
    head.push({ key: depth([px, py, pz]), svg: can + Ln(G.circleOf(C, 7, 10.6, P, 48), { tone: "mid" }) + Ln(glass.join(""), { tone: "lo" }) + Dt([at([px + g[0] * 7, py + g[1] * 7, pz])], { size: 0.5, tone: "hi" }) });
    // target plate on a stem above the canister
    const plate = hb(-1.2, 1.2, -13, 13, pz + 18, pz + 44);
    const pf = (c, z) => at(H(1.2, c, z));
    const tri = [[pf(-10, pz + 41), pf(10, pz + 41), pf(0, pz + 31)], [pf(-10, pz + 21), pf(10, pz + 21), pf(0, pz + 31)]];
    head.push({ key: depth([px, py, pz + 30]), svg: hb(-1.6, 1.6, -2, 2, pz + 11.3, pz + 18) + plate + Ln(tri.map((p) => k.pathOf(p, true)).join(""), { tone: "hi" }) });
    head.sort((x, y) => x.key - y.key);
    return out.join("") + head.map((x) => x.svg).join("");
  }

  function prismSide(t) {
    const a = (-HALF + 2 * HALF * t) * alongV;
    const items = [...stops(), { key: a, svg: carriage(t) }].sort((x, y) => x.key - y.key);
    return items.map((x) => x.svg).join("");
  }

  function beam(t, bearing, tilt) {
    const f = frames(bearing, tilt);
    const [px, py] = M.railAt(t);
    const g = G.unit3([OX - px, OY - py, 0]);
    const from = T(f, TEL.obj, 0, 0);
    const to = [px + g[0] * 7, py + g[1] * 7, M.PRISM_Z];
    return k.pathOf([at(from), at(to)]);
  }

  function extents() {
    const pts = [];
    for (const a of [-BED.half, BED.half]) for (const n of [-BED.w - 4, BED.w + 4]) pts.push(R(a, n, 0), R(a, n, BED.z1));
    for (const t of [0, 1]) { const [x, y] = M.railAt(t); pts.push([x, y, M.PRISM_Z + 44]); }
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; pts.push([OX + Math.cos(a) * 56, OY + Math.sin(a) * 56, 0], [OX + Math.cos(a) * 50, OY + Math.sin(a) * 50, 157]); }
    return pts;
  }

  return { fixedBase, alidade, bench, prismSide, beam, frames, T, extents };
}
