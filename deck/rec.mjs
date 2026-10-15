// Frame recorder: opens a page at the band's exact size, calls window.__render(t) for each frame
// and saves PNGs. node rec.mjs page.html outDir --fps 25 --seconds 24 --scale 2 [--at 6.4 single.png]
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, mkdtempSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const page = resolve(args[0]);
const out = resolve(args[1]);
const fps = +opt("--fps", 25), seconds = +opt("--seconds", 24), scale = +opt("--scale", 2);
const W = +opt("--width", 1200), H = +opt("--height", 400);
const at = opt("--at", null);
const chrome = process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(chrome, ["--headless=new", `--remote-debugging-port=${port}`, "--no-sandbox", "--hide-scrollbars", "--force-color-profile=srgb", `--user-data-dir=${mkdtempSync(join(tmpdir(), "rec-"))}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50; i++) { try { const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); target = list.find((t) => t.type === "page"); if (target) break; } catch {} await sleep(200); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: scale, mobile: false });
await send("Page.enable");
await send("Page.navigate", { url: "file://" + page + "#frames" });
await sleep(1500);
const shot = async (t, file) => {
  const r = await send("Runtime.evaluate", { expression: `window.__render(${t}); new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`, awaitPromise: true });
  if (r.result?.exceptionDetails) { console.error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); process.exit(1); }
  const s = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: W, height: H, scale: 1 } });
  writeFileSync(file, Buffer.from(s.result.data, "base64"));
};
if (at !== null) { await shot(+at, out); console.log("shot", out); }
else {
  mkdirSync(out, { recursive: true });
  const n = Math.round(fps * seconds);
  for (let f = 0; f < n; f++) { await shot(f / fps, join(out, String(f).padStart(5, "0") + ".png")); if (f % 100 === 0) process.stdout.write(`${f}/${n} `); }
  console.log("frames", n);
}
ws.close(); proc.kill();
