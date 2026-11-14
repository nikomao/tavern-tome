import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const ROOT = "d:/dsh-workspace/tavern-tome";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

const srv = http.createServer((req, res) => {
  const clean = (req.url || "/").split("?")[0];
  const fp = path.join(ROOT, decodeURIComponent(clean === "/" ? "/index.html" : clean));
  if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    res.writeHead(404); res.end("Not found"); return;
  }
  const ext = path.extname(fp).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  fs.createReadStream(fp).pipe(res);
});

class CDP {
  constructor(wsUrl) {
    this.id = 0;
    this.pending = new Map();
    this.ws = new WebSocket(wsUrl);
  }
  async connect() {
    await new Promise((res, rej) => {
      this.ws.addEventListener("open", res, { once: true });
      this.ws.addEventListener("error", rej, { once: true });
    });
    this.ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { res, rej } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message));
        else res(msg.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expr) {
    const r = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + JSON.stringify(r.exceptionDetails.exception));
    return r.result ? r.result.value : undefined;
  }
  close() { this.ws.close(); }
}

function assert(condition, message) {
  if (!condition) {
    console.error("FAIL:", message);
    process.exit(1);
  }
  console.log("PASS:", message);
}

srv.listen(0, "127.0.0.1", async () => {
  const port = srv.address().port;
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "tt-verify-font-"));
  const proc = spawn(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=0",
    "--window-size=1280,820",
    `--user-data-dir=${userData}`,
    "about:blank"
  ], { stdio: ["ignore", "pipe", "pipe"] });

  let wsBrowser = "";
  const onData = (d) => {
    const m = d.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
    if (m) wsBrowser = m[1];
  };
  proc.stderr.on("data", onData);
  proc.stdout.on("data", onData);

  while (!wsBrowser) await new Promise(r => setTimeout(r, 50));

  const res = await fetch(wsBrowser.replace(/^ws:/, "http:").replace(/\/devtools\/browser\/.*/, "/json/list"));
  const list = await res.json();
  const pageWs = new CDP(list[0].webSocketDebuggerUrl);
  await pageWs.connect();
  await pageWs.send("Page.enable");
  await pageWs.send("Runtime.enable");

  const errors = [];
  pageWs.ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === "Runtime.exceptionThrown") {
      errors.push("JS EXCEPTION: " + (m.params.exceptionDetails.text || "") + " " + (m.params.exceptionDetails.exception?.description || ""));
    }
  });

  // 1. Test index.html
  await pageWs.send("Page.navigate", { url: `http://127.0.0.1:${port}/index.html` });
  await new Promise(r => setTimeout(r, 600));

  const hasAPI = await pageWs.eval("typeof window.TTFontSize === 'object'");
  assert(hasAPI, "window.TTFontSize API exists on index.html");

  // Open font popup
  await pageWs.eval("document.getElementById('fontScaleBtn').click()");
  const popOpen = await pageWs.eval("!document.getElementById('fontScalePop').hidden");
  assert(popOpen, "Clicking #fontScaleBtn opens font popover");

  // Click large (125%)
  await pageWs.eval("document.querySelector('#fspPills [data-size=\"large\"]').click()");
  const afterLarge = await pageWs.eval("({ attr: document.documentElement.getAttribute('data-font-size'), saved: localStorage.getItem('tt_font_size'), label: document.getElementById('fsCurrentLabel').textContent })");
  assert(afterLarge.attr === "large" && afterLarge.saved === "large" && afterLarge.label === "125%", "Selecting large sets data-font-size=large, saves to localStorage, and updates label to 125%");

  // Step up to huge (140%)
  await pageWs.eval("document.getElementById('fspStepInc').click()");
  const afterHuge = await pageWs.eval("({ attr: document.documentElement.getAttribute('data-font-size'), saved: localStorage.getItem('tt_font_size'), label: document.getElementById('fsCurrentLabel').textContent })");
  console.log("afterHuge:", afterHuge);
  assert(afterHuge.attr === "huge" && afterHuge.saved === "huge" && afterHuge.label === "140%", "Step increment button sets huge (140%)");

  // Test railFontBtn cycle
  await pageWs.eval("document.getElementById('railFontBtn').click()");
  const afterRailCycle = await pageWs.eval("({ attr: document.documentElement.getAttribute('data-font-size'), saved: localStorage.getItem('tt_font_size'), toast: document.getElementById('ttFontToast')?.textContent })");
  assert(afterRailCycle.saved === "default" && afterRailCycle.toast.includes("标准"), "Rail Aa button cycles to default and shows toast");

  // 2. Test play.html inheritance & controls
  // Set to medium (112%) on index.html first
  await pageWs.eval("window.TTFontSize.set('medium')");
  await pageWs.send("Page.navigate", { url: `http://127.0.0.1:${port}/play.html` });
  await new Promise(r => setTimeout(r, 1200));

  const playInherit = await pageWs.eval("({ attr: document.documentElement.getAttribute('data-font-size'), label: document.getElementById('fsCurrentLabel')?.textContent, saved: localStorage.getItem('tt_font_size'), state: document.readyState })");
  console.log("playInherit:", playInherit);
  assert(playInherit.attr === "medium" && playInherit.label === "112%", "play.html seamlessly inherits medium (112%) from localStorage");

  // In play.html, open pop and switch to large
  await pageWs.eval("document.getElementById('fontScaleBtn').click()");
  await pageWs.eval("document.querySelector('#fspPills [data-size=\"large\"]').click()");
  const playLarge = await pageWs.eval("({ attr: document.documentElement.getAttribute('data-font-size'), saved: localStorage.getItem('tt_font_size'), label: document.getElementById('fsCurrentLabel').textContent })");
  assert(playLarge.attr === "large" && playLarge.saved === "large" && playLarge.label === "125%", "play.html font selector updates to large 125%");

  // 3. Test zh-TW versions
  await pageWs.send("Page.navigate", { url: `http://127.0.0.1:${port}/zh-TW/index.html` });
  await new Promise(r => setTimeout(r, 600));
  const twIndex = await pageWs.eval("({ attr: document.documentElement.getAttribute('data-font-size'), hasBtn: !!document.getElementById('fontScaleBtn') })");
  assert(twIndex.attr === "large" && twIndex.hasBtn, "zh-TW/index.html has font scale widget and inherits size");

  await pageWs.send("Page.navigate", { url: `http://127.0.0.1:${port}/zh-TW/play.html` });
  await new Promise(r => setTimeout(r, 600));
  const twPlay = await pageWs.eval("({ attr: document.documentElement.getAttribute('data-font-size'), hasBtn: !!document.getElementById('fontScaleBtn') })");
  assert(twPlay.attr === "large" && twPlay.hasBtn, "zh-TW/play.html has font scale widget and inherits size");

  assert(errors.length === 0, `Zero runtime JS exceptions across all tested pages (${errors.join("; ")})`);

  pageWs.close();
  proc.kill();
  srv.close();
  try { fs.rmSync(userData, { recursive: true, force: true }); } catch(e){}
  console.log("\nALL FONT SCALE VERIFICATION TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
});
