// The truth of the figure: where the prism is, what the instrument reads.
// World units are 2.5 mm; the instrument's trunnion axis sits over the origin.
export const MM = 2.5;
export const DEG = Math.PI / 180;

export const TRUNNION = [0, 0, 122];
export const PRISM_Z = 160;
// The prism rail runs obliquely, so sliding the prism changes distance and direction together.
const pol = (bearing, r) => [Math.cos(bearing * DEG) * r, Math.sin(bearing * DEG) * r];
export const RAIL_A = pol(200, 400);
export const RAIL_B = pol(232, 540);
export const HZ_ZERO = 262; // bearing of the circle's zero index, Hz counts clockwise from it

// EDM: phase comparison on a fine modulation of 99.93 MHz (unit length U = 1.5 m in air)
// and a coarse one of 0.999 MHz (150 m) that fixes the whole number of units.
export const C = 299792458;
export const N_AIR = 1.000283;
export const F_FINE = C / N_AIR / 3.0;
export const U = C / N_AIR / F_FINE / 2; // metres, half the modulation wavelength

export const railAt = (t) => [RAIL_A[0] + (RAIL_B[0] - RAIL_A[0]) * t, RAIL_A[1] + (RAIL_B[1] - RAIL_A[1]) * t];

export function sight(t) {
  const [x, y] = railAt(t);
  const dx = x - TRUNNION[0], dy = y - TRUNNION[1], dz = PRISM_Z - TRUNNION[2];
  const hd = Math.hypot(dx, dy);
  return { bearing: Math.atan2(dy, dx), tilt: Math.atan2(dz, hd), slope: Math.hypot(hd, dz) * MM / 1000, horizontal: hd * MM / 1000, prism: [x, y, PRISM_Z] };
}

export const hzOf = (bearing) => (((HZ_ZERO - bearing / DEG) % 360) + 360) % 360;
export const vOf = (tilt) => 90 - tilt / DEG;

export function phaseOf(slope) {
  const units = slope / U;
  const whole = Math.floor(units);
  return { whole, fraction: units - whole, degrees: (units - whole) * 360 };
}

export function dms(value) {
  let total = Math.round(value * 3600);
  const d = Math.floor(total / 3600);
  total -= d * 3600;
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return `${d}°${String(m).padStart(2, "0")}′${String(s).padStart(2, "0")}″`;
}
