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
  ".png": "image/png"
};

const srv = http.createServer((req, res) => {
  const clean = (req.url || "/").split("?")[0];
  const fp = path.join(ROOT, decodeURIComponent(clean === "/" ? "/index.html" : clean));
  if (!fs.existsSync(fp)) { res.writeHead(404); res.end(); return; }
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

srv.listen(0, "127.0.0.1", async () => {
  const port = srv.address().port;
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "tt-verify-cards-"));
  const proc = spawn(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
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

  await pageWs.send("Page.navigate", { url: `http://127.0.0.1:${port}/index.html` });
  await new Promise(r => setTimeout(r, 1200));

  const mechItems = await pageWs.eval(`(() => {
    const mechPanel = document.getElementById('p-mech');
    if (!mechPanel) return [];
    return Array.from(mechPanel.querySelectorAll('.core-item')).map(li => {
      const name = li.querySelector('.ci-head b')?.textContent || '';
      const img = li.querySelector('.ci-thumb img')?.getAttribute('src') || '';
      const noimg = !!li.querySelector('.ci-thumb.noimg');
      const letter = li.querySelector('.ci-thumb i')?.textContent || '';
      return { name, img, noimg, letter };
    });
  })()`);

  console.log("=== Mechanical tribe core cards rendered ===");
  console.table(mechItems);

  let hasNoImg = false;
  for (const item of mechItems) {
    if (item.noimg || !item.img) {
      console.error("FAIL: Card still has no image:", item.name);
      hasNoImg = true;
    }
  }

  // Also check all 11 tribe panels
  const allTribesStats = await pageWs.eval(`(() => {
    const panels = Array.from(document.querySelectorAll('.panel'));
    let totalCores = 0;
    let totalImages = 0;
    let missingCores = [];
    panels.forEach(p => {
      const id = p.id;
      p.querySelectorAll('.core-item').forEach(li => {
        totalCores++;
        const name = li.querySelector('.ci-head b')?.textContent || '';
        const img = li.querySelector('.ci-thumb img');
        if (img && img.getAttribute('src')) {
          totalImages++;
        } else {
          missingCores.push({ panel: id, name });
        }
      });
    });
    return { totalCores, totalImages, missingCores };
  })()`);

  console.log(`\nAll Tribes Core Card Summary: ${allTribesStats.totalImages} / ${allTribesStats.totalCores} images loaded`);
  if (allTribesStats.missingCores.length > 0) {
    console.warn("Remaining missing cores:", allTribesStats.missingCores);
  }

  pageWs.close();
  proc.kill();
  srv.close();
  try { fs.rmSync(userData, { recursive: true, force: true }); } catch(e){}

  if (hasNoImg || allTribesStats.missingCores.length > 0) {
    process.exit(1);
  }
  console.log("\nALL CORE CARDS NOW SUCCESSFULLY DISPLAY REAL PORTRAIT IMAGES!");
  process.exit(0);
});
