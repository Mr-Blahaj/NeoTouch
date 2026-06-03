/**
 * TouchWall Secure Local Server
 * A zero-dependency native Node.js static file server.
 * Enables running the project on http://localhost:3000, which is required
 * by browsers to grant high-performance webcam permissions (getUserMedia secure context).
 * 
 * v2 additions:
 *  - /cursor  POST endpoint: moves the macOS system cursor via cursor-bridge.py
 *  - /cursor/click POST: fires a mouse down/up event
 *  - Spawns cursor-bridge.py as a persistent child process for low-latency control
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const PORT = Number(process.env.PORT) || 3000;

// ---------------------------------------------------------------------------
// MIME types
// ---------------------------------------------------------------------------
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml; charset=utf-8",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".gif":  "image/gif",
  ".ico":  "image/x-icon",
  ".wasm": "application/wasm"
};

// ---------------------------------------------------------------------------
// Cursor Bridge (Python subprocess)
// ---------------------------------------------------------------------------
let cursorBridge = null;
let bridgeReady  = false;
let overlayProcess = null;

function startCursorBridge() {
  const bridgePath = path.join(__dirname, "cursor-bridge.py");

  if (!fs.existsSync(bridgePath)) {
    console.warn("  ⚠️  cursor-bridge.py not found — system cursor mode disabled.");
    return;
  }

  try {
    cursorBridge = spawn("python3", [bridgePath], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    cursorBridge.stdout.on("data", (data) => {
      const msg = data.toString().trim();
      if (msg.includes("CURSOR_BRIDGE_READY")) {
        bridgeReady = true;
        console.log("  🖱️  Cursor bridge online — system cursor control active.");
        console.log("  ⚠️  Ensure 'node' (or Terminal) has Accessibility access:");
        console.log("       System Settings → Privacy & Security → Accessibility\n");
      }
    });

    cursorBridge.stderr.on("data", (d) => {
      console.error("[cursor-bridge stderr]", d.toString().trim());
    });

    cursorBridge.on("exit", (code) => {
      bridgeReady = false;
      cursorBridge = null;
      if (code !== 0) {
        console.warn(`  ⚠️  Cursor bridge exited with code ${code}.`);
      }
    });
  } catch (err) {
    console.warn("  ⚠️  Failed to spawn cursor bridge:", err.message);
  }
}

function sendToBridge(line) {
  if (bridgeReady && cursorBridge && cursorBridge.stdin.writable) {
    cursorBridge.stdin.write(line + "\n");
  }
}

function runSystemHotkey(action) {
  const scripts = {
    undo: 'tell application "System Events" to keystroke "z" using {command down}',
    redo: 'tell application "System Events" to keystroke "z" using {command down, shift down}',
    nextSpace: 'tell application "System Events" to key code 124 using {control down}',
    previousSpace: 'tell application "System Events" to key code 123 using {control down}',
    nextWindow: 'tell application "System Events" to key code 50 using {command down}',
    previousWindow: 'tell application "System Events" to key code 50 using {command down, shift down}'
  };

  if (!scripts[action]) {
    return { ok: false, error: "Unknown hotkey action" };
  }

  spawn("osascript", ["-e", scripts[action]], { stdio: "ignore" });
  return { ok: true, action };
}

function startSystemOverlay() {
  const swiftOverlayPath = path.join(__dirname, "system-overlay.swift");
  const overlayBinaryPath = path.join(__dirname, ".cogniplay-overlay");

  if (!fs.existsSync(swiftOverlayPath)) {
    return { ok: false, error: "system-overlay.swift not found" };
  }

  if (overlayProcess && overlayProcess.exitCode === null) {
    return { ok: true, running: true };
  }

  try {
    const srcStat = fs.statSync(swiftOverlayPath);
    const binStat = fs.existsSync(overlayBinaryPath) ? fs.statSync(overlayBinaryPath) : null;
    if (!binStat || srcStat.mtimeMs > binStat.mtimeMs) {
      const build = spawnSync("swiftc", [swiftOverlayPath, "-o", overlayBinaryPath], { encoding: "utf8" });
      if (build.status !== 0) {
        return { ok: false, error: build.stderr || "Swift overlay compile failed" };
      }
    }
  } catch (error) {
    return { ok: false, error: `Overlay compile check failed: ${error.message}` };
  }

  overlayProcess = spawn(overlayBinaryPath, [], {
    stdio: ["ignore", "pipe", "pipe"]
  });

  overlayProcess.stdout.on("data", (data) => {
    console.log("[overlay]", data.toString().trim());
  });

  overlayProcess.stderr.on("data", (data) => {
    console.error("[overlay stderr]", data.toString().trim());
  });

  overlayProcess.on("exit", () => {
    overlayProcess = null;
  });

  return { ok: true, running: true };
}

// ---------------------------------------------------------------------------
// HTTP Server
// ---------------------------------------------------------------------------
const server = http.createServer((req, res) => {
  const requestPath = req.url.split("?")[0];

  // ---- POST /cursor — move system cursor ----
  if (req.method === "POST" && requestPath === "/cursor") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      try {
        const { x, y } = JSON.parse(body);
        sendToBridge(`M,${Math.round(x)},${Math.round(y)}`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, bridgeReady }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "Invalid JSON" }));
      }
    });
    return;
  }

  // ---- POST /cursor/down — mouse button down ----
  if (req.method === "POST" && requestPath === "/cursor/down") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      try {
        const { x, y } = JSON.parse(body);
        sendToBridge(`D,${Math.round(x)},${Math.round(y)}`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400);
        res.end("{}");
      }
    });
    return;
  }

  // ---- POST /cursor/up — mouse button up ----
  if (req.method === "POST" && requestPath === "/cursor/up") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      try {
        const { x, y } = JSON.parse(body);
        sendToBridge(`U,${Math.round(x)},${Math.round(y)}`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400);
        res.end("{}");
      }
    });
    return;
  }

  // ---- POST /cursor/scroll — system scroll wheel ----
  if (req.method === "POST" && requestPath === "/cursor/scroll") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      try {
        const { dx = 0, dy = 0 } = JSON.parse(body);
        sendToBridge(`SC,${Math.round(dx)},${Math.round(dy)}`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400);
        res.end("{}");
      }
    });
    return;
  }

  // ---- GET /cursor/status — bridge health check ----
  if (req.method === "GET" && requestPath === "/cursor/status") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ bridgeReady }));
    return;
  }

  // ---- POST /overlay/start — launch native system whiteboard bar ----
  if ((req.method === "POST" || req.method === "GET") && requestPath === "/overlay/start") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const result = startSystemOverlay();
    res.writeHead(result.ok ? 200 : 500, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
    return;
  }

  // ---- POST /system/hotkey — global macOS shortcuts for hand gestures ----
  if (req.method === "POST" && requestPath === "/system/hotkey") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      try {
        const { action } = JSON.parse(body);
        const result = runSystemHotkey(action);
        res.writeHead(result.ok ? 200 : 400, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "Invalid JSON" }));
      }
    });
    return;
  }

  // ---- OPTIONS preflight ----
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.writeHead(204);
    res.end();
    return;
  }

  // ---- Static file serving ----
  let safePath = requestPath;
  if (safePath === "/") safePath = "/index.html";

  const cogniPrefix = "/cogniplay";
  const isCogniPlay = safePath === cogniPrefix || safePath.startsWith(`${cogniPrefix}/`);
  const webRoot = isCogniPlay ? path.join(__dirname, "CogniPlay", "cogniplay", "dist") : __dirname;
  let relativePath = isCogniPlay ? safePath.slice(cogniPrefix.length) || "/index.html" : safePath;
  if (isCogniPlay && relativePath === "/") relativePath = "/index.html";

  const filePath = path.join(webRoot, relativePath);

  if (!filePath.startsWith(webRoot)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("403 Forbidden: Directory Traversal Blocked");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        if (isCogniPlay) {
          const indexPath = path.join(webRoot, "index.html");
          fs.readFile(indexPath, (indexErr, indexContent) => {
            if (indexErr) {
              res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
              res.end("<h1>404 Not Found</h1><p>Build CogniPlay first with npm run build.</p>");
            } else {
              res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
              res.end(indexContent);
            }
          });
        } else {
          res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<h1>404 Not Found</h1><p>The requested file does not exist.</p>");
        }
      } else {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(`500 Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
});

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------
server.listen(PORT, "localhost", () => {
  console.log("\n=======================================================");
  console.log("       TOUCHWALL INTERACTIVE PROJECTOR SERVER");
  console.log("=======================================================");
  console.log(`\n  🚀 Web Server successfully launched!`);
  console.log(`  🔗 Open in browser: http://localhost:${PORT}/`);
  console.log(`\n  📸 Note: Browser webcam permission will be requested.`);
  console.log("  🛑 Press Ctrl+C to terminate the server.\n");

  // Boot the cursor bridge (optional — won't crash if Python isn't available)
  startCursorBridge();
});

// Graceful shutdown
process.on("SIGINT", () => {
  if (cursorBridge) {
    cursorBridge.stdin.write("Q\n");
    cursorBridge.kill();
  }
  if (overlayProcess) {
    overlayProcess.kill();
  }
  process.exit(0);
});
