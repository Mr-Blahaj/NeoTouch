/**
 * TouchWall Main Application Controller
 * Orchestrates MediaPipe Hand Tracker, Homography Math, Custom Events, 
 * Paint Whiteboard, Bubble Popping physics game, and Smart Home Dashboard.
 */

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements Cache ---
  const webcamFeed = document.getElementById("webcam-feed");
  const overlayCanvas = document.getElementById("overlay-canvas");
  const overlayCtx = overlayCanvas.getContext("2d");
  
  const customCursor = document.getElementById("custom-cursor");
  const dwellRingCircle = document.getElementById("dwell-ring-circle");
  
  const topStatusBadge = document.getElementById("top-status-badge");
  const topStatusText = document.getElementById("top-status-text");
  
  const toggleTrackingBtn = document.getElementById("toggle-tracking-btn");
  const startCalibrationBtn = document.getElementById("start-calibration-btn");
  const resetCalibrationBtn = document.getElementById("reset-calibration-btn");
  const cancelCalibrationBtn = document.getElementById("cancel-calibration-btn");
  const calibrationOverlay = document.getElementById("calibration-overlay");
  const calibrationStatus = document.getElementById("calibration-status");
  const calibrationInstruction = document.getElementById("calibration-instruction");
  
  const clickTriggerMode = document.getElementById("click-trigger-mode");
  const filterAlphaInput = document.getElementById("filter-alpha");
  const filterBetaInput = document.getElementById("filter-beta");
  const alphaVal = document.getElementById("alpha-val");
  const betaVal = document.getElementById("beta-val");
  
  const paintCanvas = document.getElementById("paint-canvas");
  const paintCtx = paintCanvas.getContext("2d");
  const brushSizeInput = document.getElementById("brush-size");
  const brushSizeVal = document.getElementById("brush-size-val");
  const clearCanvasBtn = document.getElementById("clear-canvas-btn");
  
  const gameWelcomeScreen = document.getElementById("game-welcome-screen");
  const startGameBtn = document.getElementById("start-game-btn");
  const gameCanvas = document.getElementById("game-canvas");
  const gameCtx = gameCanvas.getContext("2d");
  const gameScoreVal = document.getElementById("game-score");
  const gameTimerVal = document.getElementById("game-timer");
  
  const logTerminal = document.getElementById("log-terminal");
  const clearLogsBtn = document.getElementById("clear-logs-btn");
  
  const valFps = document.getElementById("val-fps");
  const valZ = document.getElementById("val-z");
  const metricPinchVal = document.getElementById("metric-pinch-val");
  const fillPinch = document.getElementById("fill-pinch");
  const metricDepthVal = document.getElementById("metric-depth-val");
  const fillDepth = document.getElementById("fill-depth");
  const debugMatrix = document.getElementById("debug-matrix");

  // --- Core State Variables ---
  let tracker = null;
  let cursorFilter = new OneEuroFilter(2.2, 0.18, 1.0);
  
  let calibratedTouchThreshold = 0.14; // Default fully-extended finger distance
  let calibrationPoints = []; // 4 points in Camera space normalized [0-1]
  let screenCorners = [];      // 4 points in Screen pixel space
  let homographyMatrix = null;
  let gridMapper = null;
  let gridDivisions = 8;
  let angleDriftStrength = 0.35;
  let lastGridPosition = { u: 0, v: 0 };
  let isCalibrating = false;
  let calibrationStep = 0;
  
  let cursorX = 0;
  let cursorY = 0;
  let prevCursorX = 0;
  let prevCursorY = 0;
  let isClickDown = false;
  let activeClickSource = null;
  
  let currentActiveApp = "puzzles";
  let activeDrawColor = "#00f2fe";
  let brushSize = 8;
  
  // High-Fidelity Drawing Engine State
  let activeTool = "brush"; // "brush", "eraser", "laser", "text"
  let whiteboardHistory = [];
  let whiteboardRedoStack = [];
  let currentStroke = null;
  let activeTextStroke = null;
  let aiShapeAssistEnabled = true;

  // System Cursor Mode
  let systemCursorMode = false;
  let systemScrollEnabled = true;
  let scrollPoseActive = false;
  let lastScrollY = null;
  let lastScrollSendTime = 0;
  let lastCursorSendTime = 0;
  let bridgeOnline = false;
  const CURSOR_SEND_INTERVAL_MS = 14; // ~70fps cap
  const SCROLL_SEND_INTERVAL_MS = 24;

  function getSystemScreenPoint(clientX, clientY) {
    const borderX = Math.max(0, (window.outerWidth - window.innerWidth) / 2);
    const chromeY = Math.max(0, window.outerHeight - window.innerHeight - borderX);
    return {
      x: Math.round(window.screenX + borderX + clientX),
      y: Math.round(window.screenY + chromeY + clientY)
    };
  }

  function getProjectorClientRect() {
    const el = document.getElementById("projector-screen");
    const rect = el ? el.getBoundingClientRect() : null;
    if (rect && rect.width > 80 && rect.height > 80) return rect;

    const dockWidth = document.getElementById("control-dock")?.getBoundingClientRect().width || 380;
    const fallbackWidth = Math.max(1, window.innerWidth - dockWidth);
    return {
      left: 0,
      top: 0,
      width: fallbackWidth > 80 ? fallbackWidth : window.innerWidth,
      height: window.innerHeight,
      right: fallbackWidth,
      bottom: window.innerHeight
    };
  }

  function isFingerExtended(landmarks, tipIndex, pipIndex, mcpIndex) {
    return landmarks[tipIndex].y < landmarks[pipIndex].y && landmarks[pipIndex].y < landmarks[mcpIndex].y;
  }

  function getLandmarkDistance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
  }

  function isTwoFingerScrollPose(landmarks) {
    if (!landmarks) return false;
    const indexExtended = isFingerExtended(landmarks, 8, 6, 5);
    const middleExtended = isFingerExtended(landmarks, 12, 10, 9);
    const ringExtended = isFingerExtended(landmarks, 16, 14, 13);
    const pinkyExtended = isFingerExtended(landmarks, 20, 18, 17);
    const handScale = getLandmarkDistance(landmarks[0], landmarks[9]) || 0.01;
    const pinchDistance = getLandmarkDistance(landmarks[4], landmarks[8]) / handScale;
    return indexExtended && middleExtended && !ringExtended && !pinkyExtended && pinchDistance > 0.35;
  }

  function updateSystemScroll(landmarks) {
    if (!systemCursorMode || !systemScrollEnabled || !bridgeOnline || isClickDown) {
      scrollPoseActive = false;
      lastScrollY = null;
      return;
    }

    const pose = isTwoFingerScrollPose(landmarks);
    if (!pose) {
      scrollPoseActive = false;
      lastScrollY = null;
      customCursor.classList.remove("scrolling");
      return;
    }

    customCursor.classList.add("scrolling");
    if (!scrollPoseActive) {
      scrollPoseActive = true;
      lastScrollY = cursorY;
      return;
    }

    const dy = cursorY - lastScrollY;
    lastScrollY = cursorY;

    const now = performance.now();
    if (Math.abs(dy) < 2 || now - lastScrollSendTime < SCROLL_SEND_INTERVAL_MS) return;

    lastScrollSendTime = now;
    fetch('/cursor/scroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dx: 0, dy: dy * 1.6 })
    }).catch(() => {});
  }

  // Check bridge status every 3 seconds
  setInterval(async () => {
    try {
      const r = await fetch('/cursor/status');
      const d = await r.json();
      bridgeOnline = d.bridgeReady;
      const el = document.getElementById('sys-cursor-status');
      if (el) {
        el.textContent = bridgeOnline ? '🟢 Bridge Online' : '🔴 Bridge Offline';
        el.style.color = bridgeOnline ? 'var(--accent-green)' : '#ff4444';
      }
    } catch { bridgeOnline = false; }
  }, 3000);
  
  // Physics Bubble Game state
  let bubbles = [];
  let gameScore = 0;
  let gameTimeRemaining = 60;
  let gameIntervalId = null;
  let gameAnimationId = null;
  let isGameActive = false;
  
  // FPS Telemetry
  let frameCount = 0;
  let lastFpsUpdateTime = performance.now();
  let currentFps = 0;

  // --- Logger Helper ---
  function log(message) {
    const timestamp = new Date().toLocaleTimeString();
    logTerminal.innerText += `\n[${timestamp}] ${message}`;
    logTerminal.scrollTop = logTerminal.scrollHeight;
    console.log(`[TouchWall] ${message}`);
  }

  // --- Setup Canvas Resolutions ---
  function resizeCanvases() {
    // 1. Webcam Overlay Canvas matches its display wrapper dimensions
    overlayCanvas.width = webcamFeed.clientWidth || 320;
    overlayCanvas.height = webcamFeed.clientHeight || 240;
    
    // 2. Whiteboard Canvas matches its container space exactly
    const pRect = paintCanvas.parentElement.getBoundingClientRect();
    paintCanvas.width = pRect.width;
    paintCanvas.height = pRect.height;
    
    // Maintain drawing style integrity
    paintCtx.lineCap = "round";
    paintCtx.lineJoin = "round";
    
    // 3. Game Canvas matches its parent container
    const gRect = gameCanvas.parentElement.getBoundingClientRect();
    gameCanvas.width = gRect.width;
    gameCanvas.height = gRect.height;
    
    // 4. Update the screen corners for perspective/grid mapping.
    // The calibration overlay lives inside #projector-screen, so use that
    // element's viewport rect rather than the whole browser window/dock.
    const projectorRect = getProjectorClientRect();
    const w = projectorRect.width;
    const h = projectorRect.height;
    const left = projectorRect.left;
    const top = projectorRect.top;
    screenCorners = [
      { x: left + w * 0.05, y: top + h * 0.05 }, // Top-Left
      { x: left + w * 0.95, y: top + h * 0.05 }, // Top-Right
      { x: left + w * 0.95, y: top + h * 0.95 }, // Bottom-Right
      { x: left + w * 0.05, y: top + h * 0.95 }  // Bottom-Left
    ];

    if (calibrationPoints.length === 4) {
      try { computeHomography(); } catch {}
    }
  }
  
  window.addEventListener("resize", resizeCanvases);
  // Delay slightly to allow layout styles to complete
  setTimeout(resizeCanvases, 500);

  // --- Calibration Handlers ---
  function loadSavedCalibration() {
    try {
      const saved = localStorage.getItem("touchwall_calibration_points");
      if (saved) {
        calibrationPoints = JSON.parse(saved);
        if (calibrationPoints.length === 4) {
          computeHomography();
          log("Loaded saved 4-point calibration matrix successfully.");
          return;
        }
      }
    } catch (e) {
      log("Error loading calibration from storage: " + e.message);
    }
    log("System is uncalibrated. Please click 'Calibrate Projector Wall'.");
  }

  function startCalibration() {
    if (isCalibrating) return;
    
    isCalibrating = true;
    calibrationStep = 0;
    calibrationPoints = [];
    
    // Enable click mapping directly on camera canvas preview
    overlayCanvas.style.pointerEvents = "all";
    overlayCanvas.style.cursor = "crosshair";
    
    // Show calibration overlay full-screen on projector output
    calibrationOverlay.classList.add("active");
    updateCalibrationStepUI();
    
    log("Calibration started. Click targets sequentially, or click directly on the live camera preview where you see the target projected on your wall.");
  }

  function updateCalibrationStepUI() {
    // Highlight correct target corner
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`cal-dot-${i}`);
      const indicator = document.getElementById(`dot-step-${i}`);
      
      dot.className = "calibration-dot";
      indicator.className = "step-dot";
      
      if (i === calibrationStep) {
        dot.classList.add("active");
        indicator.classList.add("active");
      } else if (i < calibrationStep) {
        dot.classList.add("completed");
        indicator.classList.add("completed");
      }
    }
    
    const names = ["Top-Left", "Top-Right", "Bottom-Right", "Bottom-Left"];
    calibrationInstruction.innerHTML = `Please touch the glowing <strong style="color: var(--accent-yellow);">${names[calibrationStep]}</strong> corner on the wall, or simply <strong>click on the live camera stream preview</strong> in the side dock exactly where that corner target appears.`;
  }

  function handleCalibrationClick(event) {
    if (!isCalibrating) return;
    
    // We can click directly on the target or hand-trigger it
    const cornerIndex = parseInt(event.currentTarget.getAttribute("data-corner"));
    if (cornerIndex !== calibrationStep) return;
    
    // If clicking with a mouse, we fetch where it corresponds in raw camera coordinates.
    // If calibrating physically, we record the camera coordinates where their index finger is.
    // Since this is a manual fallback click, we can simulate the camera coordinates:
    // Let's pretend the hand was pointing exactly at this corner's normalized pixel ratio:
    // This allows manual testing without a webcam!
    const simulatedCamCoords = [
      { x: 0.1, y: 0.1 },
      { x: 0.9, y: 0.1 },
      { x: 0.9, y: 0.9 },
      { x: 0.1, y: 0.9 }
    ];
    
    recordCalibrationPoint(simulatedCamCoords[cornerIndex]);
  }

  function recordCalibrationPoint(camPoint) {
    calibrationPoints.push(camPoint);
    log(`Recorded calibration point ${calibrationStep + 1}/4 at Cam X:${camPoint.x.toFixed(3)}, Y:${camPoint.y.toFixed(3)}`);
    
    calibrationStep++;
    
    if (calibrationStep === 4) {
      completeCalibration();
    } else {
      updateCalibrationStepUI();
    }
  }

  function completeCalibration() {
    isCalibrating = false;
    calibrationOverlay.classList.remove("active");
    
    overlayCanvas.style.pointerEvents = "none";
    overlayCanvas.style.cursor = "default";
    
    // Save to storage
    localStorage.setItem("touchwall_calibration_points", JSON.stringify(calibrationPoints));
    computeHomography();
    
    log("Calibration completed successfully! 4-point homography matrix calculated.");
  }

  function cancelCalibration() {
    isCalibrating = false;
    calibrationOverlay.classList.remove("active");
    calibrationPoints = [];
    
    overlayCanvas.style.pointerEvents = "none";
    overlayCanvas.style.cursor = "default";
    
    log("Calibration cancelled.");
  }

  function resetCalibration() {
    calibrationPoints = [];
    homographyMatrix = null;
    gridMapper = null;
    localStorage.removeItem("touchwall_calibration_points");
    calibrationStatus.innerText = "Status: Uncalibrated";
    calibrationStatus.style.color = "var(--accent-yellow)";
    debugMatrix.innerText = "Not Calibrated";
    
    overlayCanvas.style.pointerEvents = "none";
    overlayCanvas.style.cursor = "default";
    
    log("Calibration has been reset.");
  }

  // --- Auto-Calibration (Fiducial Markers) ---
  let isAutoCalibrating = false;
  let autoCalIntervalId = null;
  let autoCalTimeoutId = null;
  let detectedAutoCorners = [null, null, null, null]; // Real-time preview points

  function startAutoCalibration() {
    if (isAutoCalibrating || isCalibrating) return;

    // Start tracking if not active
    if (!tracker || !tracker.isTracking) {
      log("Webcam not active. Automatically spinning up computer vision engine...");
      toggleHandTracking().then(() => {
        // Delay slightly for video stream start
        setTimeout(launchAutoCalFlow, 1200);
      }).catch(err => {
        log("Cannot start tracking for auto-cal: " + err.message);
      });
    } else {
      launchAutoCalFlow();
    }
  }

  function launchAutoCalFlow() {
    isAutoCalibrating = true;
    detectedAutoCorners = [null, null, null, null];
    calibrationPoints = [];

    // 1. Grow corner dots into massive concentric high-contrast targets
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`cal-dot-${i}`);
      dot.classList.add("marker-mode");
      dot.classList.remove("completed", "active");
    }

    // 2. Show the calibration overlay
    calibrationOverlay.classList.add("active");
    calibrationInstruction.innerHTML = `🤖 <strong>Auto-Calibrating...</strong><br><span style="color: var(--text-secondary); font-size: 0.9rem;">Please stand aside so the camera has a clear, unobstructed view of the wall. The CV scanner is searching for the 4 glowing color-coded bullseye markers...</span>`;

    // Highlight all indicator dots
    document.querySelectorAll(".step-dot").forEach(d => d.className = "step-dot active");

    log("Auto-Calibration initiated. Scanning for Yellow, Magenta, Cyan, and Green concentric targets...");

    // 3. Launch scanning loops
    autoCalIntervalId = setInterval(runAutoCalScan, 150);
    autoCalTimeoutId = setTimeout(autoCalTimeout, 9000);
  }

  // Converts RGB to HSV color space for robust ambient-light color segmentation
  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max === min) {
      h = 0; // achromatic
    } else {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s, v };
  }

  function runAutoCalScan() {
    if (!tracker || !tracker.isTracking || !webcamFeed || webcamFeed.readyState !== webcamFeed.HAVE_CURRENT_DATA) {
      return;
    }

    // Grab frame on low-res scanner canvas to maintain ultra-fast performance (3ms per scan)
    const scanW = 160;
    const scanH = 120;
    
    // Create offscreen canvas on the fly
    const scanCanvas = document.createElement("canvas");
    scanCanvas.width = scanW;
    scanCanvas.height = scanH;
    const scanCtx = scanCanvas.getContext("2d");
    
    // Draw feed
    scanCtx.drawImage(webcamFeed, 0, 0, scanW, scanH);
    const imgData = scanCtx.getImageData(0, 0, scanW, scanH);
    const pixels = imgData.data;

    // Centroid accumulators
    // 0: Yellow (TL), 1: Magenta (TR), 2: Cyan (BR), 3: Green (BL)
    const sums = [
      { x: 0, y: 0, count: 0 },
      { x: 0, y: 0, count: 0 },
      { x: 0, y: 0, count: 0 },
      { x: 0, y: 0, count: 0 }
    ];

    for (let y = 0; y < scanH; y++) {
      for (let x = 0; x < scanW; x++) {
        const idx = (y * scanW + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx+1];
        const b = pixels[idx+2];

        const hsv = rgbToHsv(r, g, b);

        // Filter high-vibrancy pixels
        if (hsv.s > 0.35 && hsv.v > 0.35) {
          const h = hsv.h;

          // 1. Yellow centroid (45° - 75°)
          if (h >= 42 && h <= 78) {
            sums[0].x += x;
            sums[0].y += y;
            sums[0].count++;
          }
          // 2. Magenta/Red-violet centroid (280° - 345°)
          else if (h >= 280 && h <= 345) {
            sums[1].x += x;
            sums[1].y += y;
            sums[1].count++;
          }
          // 3. Cyan centroid (165° - 220°)
          else if (h >= 165 && h <= 220) {
            sums[2].x += x;
            sums[2].y += y;
            sums[2].count++;
          }
          // 4. Green centroid (90° - 150°)
          else if (h >= 90 && h <= 150) {
            sums[3].x += x;
            sums[3].y += y;
            sums[3].count++;
          }
        }
      }
    }

    // Calculate centroids
    let foundCount = 0;
    const isFlippedX = document.getElementById("flip-x-toggle").checked;

    for (let i = 0; i < 4; i++) {
      // Require at least 8 solid pixels to reject glare/noise
      if (sums[i].count > 8) {
        // Centroid center in range [0, 1]
        const cx = (sums[i].x / sums[i].count) / scanW;
        const cy = (sums[i].y / sums[i].count) / scanH;

        detectedAutoCorners[i] = { x: cx, y: cy };
        foundCount++;
      } else {
        detectedAutoCorners[i] = null;
      }
    }

    // If 4/4 markers are detected, finalize homography calibration!
    if (foundCount === 4) {
      clearInterval(autoCalIntervalId);
      clearTimeout(autoCalTimeoutId);

      // Translate camera points, accounting for active X flipping settings
      calibrationPoints = detectedAutoCorners.map(pt => {
        return {
          x: isFlippedX ? (1 - pt.x) : pt.x,
          y: pt.y
        };
      });

      // Compute Matrix
      computeHomography();
      localStorage.setItem("touchwall_calibration_points", JSON.stringify(calibrationPoints));

      // Visual Success indicator
      calibrationInstruction.innerHTML = `🎉 <strong style="color: var(--accent-green);">Auto-Calibration Successful!</strong><br><span style="color: var(--accent-green);">Detected all 4/4 markers. Calibrated matrix successfully resolved.</span>`;
      log("Auto-Calibration complete! Skew and mirrors resolved.");

      // Delay shortly so they can see success state before closing
      setTimeout(() => {
        isAutoCalibrating = false;
        calibrationOverlay.classList.remove("active");
        
        // Remove marker classes
        for (let i = 0; i < 4; i++) {
          document.getElementById(`cal-dot-${i}`).classList.remove("marker-mode");
        }
        
        overlayCanvas.style.pointerEvents = "none";
        overlayCanvas.style.cursor = "default";
        detectedAutoCorners = [null, null, null, null];
      }, 2000);
    }
  }

  function autoCalTimeout() {
    clearInterval(autoCalIntervalId);
    isAutoCalibrating = false;
    calibrationOverlay.classList.remove("active");
    
    // Remove marker classes
    for (let i = 0; i < 4; i++) {
      document.getElementById(`cal-dot-${i}`).classList.remove("marker-mode");
    }
    
    overlayCanvas.style.pointerEvents = "none";
    overlayCanvas.style.cursor = "default";
    detectedAutoCorners = [null, null, null, null];
    
    log("Auto-Calibration timed out. Could not find all 4 corners.");
    alert("Auto-Calibration timed out!\n\nPlease ensure your webcam can see all 4 glowing corners of the projector screen clearly and that lighting is dark enough for the camera to distinguish the neon colors. If it persists, please use manual calibration!");
  }

  function computeHomography() {
    try {
      const gridSizeInput = document.getElementById("grid-division-count");
      gridDivisions = gridSizeInput ? parseInt(gridSizeInput.value, 10) : gridDivisions;

      // Calculate both mappings. The grid mapper is the active cursor mapping;
      // homography remains available for comparison/debugging.
      homographyMatrix = TouchWallMath.getHomography(calibrationPoints, screenCorners);
      gridMapper = TouchWallMath.createGridMapper(calibrationPoints, screenCorners, gridDivisions);
      
      calibrationStatus.innerText = "Status: Calibrated ✓";
      calibrationStatus.style.color = "var(--accent-green)";
      
      // Update debug visualizer with H matrix rows
      let text = `Grid: ${gridMapper.divisions} x ${gridMapper.divisions}\n`;
      text += `Angle: X ${gridMapper.angleProfile.angleXDeg.toFixed(1)}°, Y ${gridMapper.angleProfile.angleYDeg.toFixed(1)}°\n`;
      text += `Drift: (${gridMapper.angleProfile.driftX.toFixed(4)}, ${gridMapper.angleProfile.driftY.toFixed(4)})\n`;
      text += `VP Drift: (${gridMapper.angleProfile.vanishingDrift.x.toFixed(4)}, ${gridMapper.angleProfile.vanishingDrift.y.toFixed(4)})\n`;
      text += "Camera dots:\n";
      calibrationPoints.forEach((pt, idx) => {
        text += `  ${idx}: (${pt.x.toFixed(3)}, ${pt.y.toFixed(3)})\n`;
      });
      text += "H = [\n";
      for (let i = 0; i < 3; i++) {
        text += `  [ ${homographyMatrix[i*3].toFixed(4)}, ${homographyMatrix[i*3+1].toFixed(4)}, ${homographyMatrix[i*3+2].toFixed(4)} ]\n`;
      }
      text += "]";
      debugMatrix.innerText = text;
    } catch (e) {
      log("Homography computation error: " + e.message);
      resetCalibration();
    }
  }

  // --- Hand Tracker & Camera Visualizer ---
  async function toggleHandTracking() {
    if (tracker && tracker.isTracking) {
      // Stop tracking
      toggleTrackingBtn.innerHTML = "<span>🚀</span> Start Hand Tracking";
      toggleTrackingBtn.classList.remove("btn-accent");
      toggleTrackingBtn.classList.add("btn-primary");
      
      topStatusBadge.classList.add("inactive");
      topStatusText.innerText = "CV Off";
      topStatusBadge.querySelector(".status-indicator-dot").style.backgroundColor = "var(--accent-red)";
      
      await tracker.stop();
      tracker = null;
      
      // Clear overlay canvas
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      customCursor.style.display = "none";
      log("Computer Vision engine stopped.");
    } else {
      // Start tracking
      toggleTrackingBtn.innerHTML = "<span>⏳</span> Loading CV Model...";
      toggleTrackingBtn.classList.add("btn-accent");
      
      try {
        const distInputEl = document.getElementById('distance-from-screen');
        const distCm = distInputEl && distInputEl.value ? parseFloat(distInputEl.value) : null;

        tracker = new TouchWallTracker({
          videoElement:        webcamFeed,
          pinchThreshold:      0.24,
          pinchFramesRequired: 2,
          pinchVelocityGate:   1.10,
          dwellDuration:       parseInt(clickTriggerMode.value === "dwell" ? 1000 : 99999),
          depthTapThreshold:   calibratedTouchThreshold,
          distanceFromScreen:  distCm,
          onFrame:             handleTrackingFrame
        });
        
        await tracker.start();
        
        toggleTrackingBtn.innerHTML = "<span>🛑</span> Stop Hand Tracking";
        topStatusBadge.classList.remove("inactive");
        topStatusText.innerText = "CV Active";
        topStatusBadge.querySelector(".status-indicator-dot").style.backgroundColor = "var(--accent-green)";
        customCursor.style.display = "block";
        
        log("Webcam started. Loading MediaPipe Models...");
      } catch (err) {
        toggleTrackingBtn.innerHTML = "<span>🚀</span> Start Hand Tracking";
        toggleTrackingBtn.classList.remove("btn-accent");
        log("Failed to start CV: " + err.message);
      }
    }
  }

  // Receives raw hand model coordinates and handles drawing the telemetry/skeletons
  function handleTrackingFrame(data) {
    const { rawX, rawY, landmarks, rawZ, depthSignal } = data;
    
    // Clear last skeleton overlay
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    
    // Compute FPS
    frameCount++;
    const now = performance.now();
    if (now - lastFpsUpdateTime >= 1000) {
      currentFps = Math.round((frameCount * 1000) / (now - lastFpsUpdateTime));
      valFps.innerText = `${currentFps} FPS`;
      frameCount = 0;
      lastFpsUpdateTime = now;
    }

    function drawAutoCalReticles() {
      const colors = ["var(--accent-yellow)", "var(--accent-magenta)", "var(--accent-cyan)", "var(--accent-green)"];
      const names = ["TL", "TR", "BR", "BL"];
      
      for (let i = 0; i < 4; i++) {
        const pt = detectedAutoCorners[i];
        if (pt) {
          const cx = pt.x * overlayCanvas.width;
          const cy = pt.y * overlayCanvas.height;
          
          overlayCtx.beginPath();
          overlayCtx.arc(cx, cy, 12, 0, 2 * Math.PI);
          overlayCtx.strokeStyle = colors[i];
          overlayCtx.lineWidth = 3;
          overlayCtx.stroke();
          
          overlayCtx.beginPath();
          overlayCtx.arc(cx, cy, 2, 0, 2 * Math.PI);
          overlayCtx.fillStyle = colors[i];
          overlayCtx.fill();
          
          overlayCtx.beginPath();
          overlayCtx.moveTo(cx - 18, cy);
          overlayCtx.lineTo(cx + 18, cy);
          overlayCtx.moveTo(cx, cy - 18);
          overlayCtx.lineTo(cx, cy + 18);
          overlayCtx.strokeStyle = colors[i];
          overlayCtx.lineWidth = 1;
          overlayCtx.stroke();
          
          overlayCtx.fillStyle = "#fff";
          overlayCtx.font = "bold 10px Inter";
          overlayCtx.fillText(names[i], cx + 15, cy + 4);
        }
      }
    }

    if (!landmarks) {
      valZ.innerText = "0.00";
      if (isAutoCalibrating) {
        drawAutoCalReticles();
      }
      return;
    }
    
    // Update live Z telemetry
    valZ.innerText = rawZ.toFixed(3);

    // 1. Draw MediaPipe Skeleton on control dock webcam visualizer
    const w = overlayCanvas.width;
    const h = overlayCanvas.height;

    // Helper: translate coordinates to overlay canvas bounds
    function toCanvasCoords(p) {
      return {
        x: p.x * w, // Note: MediaPipe X coordinates map directly to mirrored video bounds
        y: p.y * h
      };
    }

    // Draw skeletal joints connections
    overlayCtx.strokeStyle = "rgba(0, 242, 254, 0.8)";
    overlayCtx.lineWidth = 2;
    
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [9, 10], [10, 11], [11, 12],     // Middle
      [13, 14], [14, 15], [15, 16],    // Ring
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [5, 9], [9, 13], [13, 17]        // Palm joints
    ];
    
    connections.forEach(([s, e]) => {
      const pt1 = toCanvasCoords(landmarks[s]);
      const pt2 = toCanvasCoords(landmarks[e]);
      overlayCtx.beginPath();
      overlayCtx.moveTo(pt1.x, pt1.y);
      overlayCtx.lineTo(pt2.x, pt2.y);
      overlayCtx.stroke();
    });

    // Draw landmark joint dots
    landmarks.forEach((pt, index) => {
      const { x, y } = toCanvasCoords(pt);
      overlayCtx.beginPath();
      overlayCtx.arc(x, y, index === 8 || index === 4 ? 5 : 3, 0, 2 * Math.PI);
      overlayCtx.fillStyle = index === 8 ? "var(--accent-magenta)" : (index === 4 ? "var(--accent-yellow)" : "var(--accent-green)");
      overlayCtx.fill();
    });

    // Draw active track zone box (visual reference bounds)
    overlayCtx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    overlayCtx.strokeRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);

    // 2. PROJECT COORDINATES ONTO THE MAIN PROJECTOR SCREEN
    if (rawX !== null && rawY !== null) {
      
      // If we are actively calibrating, check if user is holding their finger on the corner targets
      if (isCalibrating) {
        // Evaluate corner proximity
        // The calibrationStep is the current corner we want
        const targetPos = screenCorners[calibrationStep];
        
        // Let's project their current index finger to see where it lands on the screen
        // Wait, if we are NOT calibrated, we map linearly as a rough guess:
        const linearProjectedX = rawX * window.innerWidth;
        const linearProjectedY = rawY * window.innerHeight;
        
        const distToTarget = Math.sqrt(
          Math.pow(linearProjectedX - targetPos.x, 2) +
          Math.pow(linearProjectedY - targetPos.y, 2)
        );
        
        // If index finger hovers within 60px of the projected corner target for 1.2 seconds, calibrate!
        if (distToTarget < 60) {
          if (!this.calHoverStartTime) {
            this.calHoverStartTime = performance.now();
          } else if (performance.now() - this.calHoverStartTime > 1200) {
            this.calHoverStartTime = null;
            // Record raw camera coordinate for this step
            recordCalibrationPoint({ x: rawX, y: rawY });
          }
        } else {
          this.calHoverStartTime = null;
        }
      }

      // Compute mapped coordinates using the grid made from the calibrated dots.
      const projectorRect = getProjectorClientRect();
      let projected = {
        x: projectorRect.left + rawX * projectorRect.width,
        y: projectorRect.top + rawY * projectorRect.height
      };
      
      if (gridMapper) {
        const compensated = TouchWallMath.compensateAngleDrift(rawX, rawY, depthSignal || 0, gridMapper, angleDriftStrength);
        projected = TouchWallMath.projectPointGrid(compensated.x, compensated.y, gridMapper);
        lastGridPosition = { u: projected.u, v: projected.v };
      } else if (homographyMatrix) {
        projected = TouchWallMath.projectPoint(rawX, rawY, homographyMatrix);
        lastGridPosition = {
          u: Math.max(0, Math.min(1, projected.x / window.innerWidth)),
          v: Math.max(0, Math.min(1, projected.y / window.innerHeight))
        };
      } else {
        lastGridPosition = { u: rawX, v: rawY };
      }
      
      // Apply low-latency adaptive smoothing. The filter is intentionally
      // light so the cursor stays visually under the fingertip.
      const smoothed = cursorFilter.filter(projected.x, projected.y);
      
      // Update cursor position states
      prevCursorX = cursorX;
      prevCursorY = cursorY;
      
      // Apply manual fine-tuning offsets (resolves parallax and drift)
      const xOffset = document.getElementById("cursor-x-offset") ? parseInt(document.getElementById("cursor-x-offset").value) : 0;
      const yOffset = document.getElementById("cursor-y-offset") ? parseInt(document.getElementById("cursor-y-offset").value) : 0;
      
      cursorX = smoothed.x + xOffset;
      cursorY = smoothed.y + yOffset;

      // Render custom pointer overlay
      customCursor.style.left = `${cursorX}px`;
      customCursor.style.top  = `${cursorY}px`;

      // --- System Cursor Mode: send to cursor bridge ---
      if (systemCursorMode && bridgeOnline) {
        const now = performance.now();
        if (now - lastCursorSendTime >= CURSOR_SEND_INTERVAL_MS) {
          lastCursorSendTime = now;
          const screenPoint = getSystemScreenPoint(cursorX, cursorY);
          fetch('/cursor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(screenPoint)
          }).catch(() => {});
        }
      }

      updateSystemScroll(landmarks);
      
      // 3. EXECUTE APP DRAWING AND GAME HIT INTERACTIONS
      if (isClickDown) {
        forwardActivePointerMove();
        if (currentActiveApp === "canvas") {
          addPointToStroke(cursorX, cursorY);
        } else if (currentActiveApp === "game") {
          checkGameBubblePop(cursorX, cursorY, true); // Active click triggers instant pops
        }
      } else {
        // Even when not clicking, hover dwell can trigger pops
        if (currentActiveApp === "game") {
          checkGameBubblePop(cursorX, cursorY, false);
        }
      }
    }
    
    // Draw auto-calibration overlay reticles even if hand is in frame
    if (isAutoCalibrating) {
      drawAutoCalReticles();
    }
  }

  // --- Synthesize Click Events on DOM ---
  function dispatchIntoCogniPlayFrame(x, y, type) {
    const frame = document.getElementById("cogniplay-frame");
    if (!frame || !frame.contentWindow || !frame.contentDocument) return false;
    const rect = frame.getBoundingClientRect();
    if (x < rect.left || y < rect.top || x > rect.right || y > rect.bottom) return false;

    const fx = x - rect.left;
    const fy = y - rect.top;
    const target = frame.contentDocument.elementFromPoint(fx, fy);
    if (!target) return true;

    const eventInit = {
      clientX: fx,
      clientY: fy,
      bubbles: true,
      cancelable: true,
      pointerId: 77,
      pointerType: "touch",
      isPrimary: true,
      buttons: type === "pointerup" || type === "mouseup" ? 0 : 1,
    };
    if (type.startsWith("pointer")) {
      target.dispatchEvent(new PointerEvent(type, eventInit));
    } else {
      target.dispatchEvent(new MouseEvent(type, eventInit));
    }
    if (type === "mouseup" && target.closest && target.closest("button")) {
      target.closest("button").click();
    }
    return true;
  }

  function simulateMouseClick(x, y, type) {
    // System cursor click is sent before local hit-testing so it can interact
    // with the OS, other apps, and the browser chrome when enabled.
    if (systemCursorMode && bridgeOnline) {
      const screenPoint = getSystemScreenPoint(x, y);
      fetch(type === "mousedown" ? '/cursor/down' : '/cursor/up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(screenPoint)
      }).catch(() => {});
    }

    // Protect control panel buttons for the in-browser synthetic pointer.
    if (x > window.innerWidth - 380) return; 

    const targetEl = document.elementFromPoint(x, y);
    if (!targetEl) return;

    if (currentActiveApp === "puzzles" && targetEl.id === "cogniplay-frame") {
      dispatchIntoCogniPlayFrame(x, y, type === "mousedown" ? "pointerdown" : "pointerup");
      dispatchIntoCogniPlayFrame(x, y, type);
      return;
    }

    if (type === "mousedown") {
      log(`Gesture Down at Screen X:${Math.round(x)}, Y:${Math.round(y)} (Target: <${targetEl.tagName.toLowerCase()}>)`);
      isClickDown = true;
      customCursor.classList.add("clicking");
      if (currentActiveApp === "canvas") startStroke(x, y);

      // Dispatch Pointer & Mouse events
      const pointerDown = new PointerEvent("pointerdown", {
        clientX: x, clientY: y, bubbles: true, cancelable: true
      });
      const mouseDown = new MouseEvent("mousedown", {
        clientX: x, clientY: y, bubbles: true, cancelable: true
      });
      targetEl.dispatchEvent(pointerDown);
      targetEl.dispatchEvent(mouseDown);
      
      // Explicit click triggers for buttons and toggles
      if (targetEl.closest("button") || targetEl.closest(".toggle-switch") || targetEl.closest(".color-swatch") || targetEl.closest(".tab-btn")) {
        targetEl.click();
      }
      
    } else if (type === "mouseup") {
      log(`Gesture Released`);
      isClickDown = false;
      customCursor.classList.remove("clicking");
      if (currentActiveApp === "canvas") endStroke();

      const pointerUp = new PointerEvent("pointerup", {
        clientX: x, clientY: y, bubbles: true, cancelable: true
      });
      const mouseUp = new MouseEvent("mouseup", {
        clientX: x, clientY: y, bubbles: true, cancelable: true
      });
      targetEl.dispatchEvent(pointerUp);
      targetEl.dispatchEvent(mouseUp);
    }
  }

  // Bind custom tracking listeners to trigger synthetic clicks
  window.addEventListener("wallclickdown", (e) => {
    const mode = clickTriggerMode.value;
    const source = e.detail && e.detail.source;
    const isSystemPinch = systemCursorMode && source === "pinch";
    if (!isSystemPinch && ((mode === "pinch" && source !== "pinch") ||
        (mode === "depth" && source !== "depth") ||
        (mode === "dwell" && source !== "dwell"))) {
      return;
    }
    activeClickSource = source;
    simulateMouseClick(cursorX, cursorY, "mousedown");
  });

  window.addEventListener("wallclickup", (e) => {
    if (!activeClickSource) return;
    const source = e.detail && e.detail.source;
    if (source && source !== activeClickSource) return;
    activeClickSource = null;
    simulateMouseClick(cursorX, cursorY, "mouseup");
  });

  window.addEventListener("gestureupdate", (e) => {
    const { type, value, active, threshold } = e.detail;
    
    if (type === "pinch") {
      metricPinchVal.innerText = value.toFixed(3);
      const percentage = Math.min(100, (value / (threshold * 2)) * 100);
      fillPinch.style.width = `${100 - percentage}%`; // Lower distance = higher intensity
      if (active) {
        fillPinch.classList.add("active");
      } else {
        fillPinch.classList.remove("active");
      }
    } else if (type === "depth") {
      metricDepthVal.innerText = value.toFixed(3);
      // Normalized representation
      const targetPercent = Math.min(100, Math.max(0, (value / threshold) * 100));
      fillDepth.style.width = `${targetPercent}%`;
      if (active) {
        fillDepth.classList.add("active");
      } else {
        fillDepth.classList.remove("active");
      }
    }
  });

  function forwardActivePointerMove() {
    if (currentActiveApp === "puzzles" && isClickDown) {
      dispatchIntoCogniPlayFrame(cursorX, cursorY, "pointermove");
      dispatchIntoCogniPlayFrame(cursorX, cursorY, "mousemove");
    }
  }

  window.addEventListener("dwellprogress", (e) => {
    const { progress } = e.detail;
    if (clickTriggerMode.value === "dwell") {
      // 120 is the max stroke dash offset for the circle
      const offset = 120 - (progress * 120);
      dwellRingCircle.style.strokeDashoffset = offset;
    } else {
      dwellRingCircle.style.strokeDashoffset = 120;
    }
  });

  // --- Sub-App 1: Creative Paint whiteboard ---
  function redrawWhiteboard() {
    paintCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
    for (const stroke of whiteboardHistory) {
      if (stroke.type === 'shape') {
        drawVectorShape(stroke);
      } else if (stroke.type === 'text') {
        drawText(stroke);
      } else if (stroke.type === 'flowchart') {
        drawFlowchart(stroke);
      } else {
        drawStroke(stroke);
      }
    }
    if (currentStroke) drawStroke(currentStroke);
  }

  function drawStroke(stroke) {
    if (stroke.points.length === 0) return;
    paintCtx.beginPath();
    // Using destination-out composite mode for eraser
    if (stroke.tool === "eraser") {
      paintCtx.globalCompositeOperation = "destination-out";
      paintCtx.strokeStyle = "rgba(0,0,0,1)";
      paintCtx.lineWidth = stroke.size * 3; // Thicker eraser
    } else {
      paintCtx.globalCompositeOperation = "source-over";
      paintCtx.strokeStyle = stroke.color;
      paintCtx.lineWidth = stroke.size;
    }
    
    paintCtx.globalAlpha = stroke.alpha !== undefined ? stroke.alpha : 1.0;
    paintCtx.lineCap = "round";
    paintCtx.lineJoin = "round";

    if (stroke.points.length < 3) {
      const p = stroke.points[0];
      paintCtx.moveTo(p.x, p.y);
      paintCtx.lineTo(p.x + 0.1, p.y);
      paintCtx.stroke();
      paintCtx.globalAlpha = 1.0;
      paintCtx.globalCompositeOperation = "source-over";
      return;
    }

    paintCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const p1 = stroke.points[i];
      const p2 = stroke.points[i + 1];
      const midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      paintCtx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
    }
    const lastP = stroke.points[stroke.points.length - 1];
    paintCtx.lineTo(lastP.x, lastP.y);
    paintCtx.stroke();
    paintCtx.globalAlpha = 1.0;
    paintCtx.globalCompositeOperation = "source-over";
  }

  function drawText(stroke) {
    paintCtx.font = `bold ${stroke.size}px var(--font-title, sans-serif)`;
    paintCtx.fillStyle = stroke.color;
    const lines = wrapCanvasText(stroke.text + (activeTextStroke === stroke && Date.now() % 1000 < 500 ? "|" : ""), stroke.maxWidth || 520, stroke.size);
    lines.forEach((line, idx) => {
      paintCtx.fillText(line, stroke.x, stroke.y + idx * stroke.size * 1.28);
    });
  }

  function wrapCanvasText(text, maxWidth, fontSize) {
    const rawLines = String(text || "").split("\n");
    const lines = [];
    for (const rawLine of rawLines) {
      const words = rawLine.split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        lines.push("");
        continue;
      }
      let line = "";
      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        if (paintCtx.measureText(testLine).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      }
      lines.push(line);
    }
    return lines.slice(0, Math.max(1, Math.floor((paintCanvas.height - 80) / (fontSize * 1.28))));
  }

  function drawFlowchart(chart) {
    const boxW = chart.boxW;
    const boxH = chart.boxH;
    const gap = chart.gap;
    const x = chart.x;
    let y = chart.y;

    paintCtx.globalCompositeOperation = "source-over";
    paintCtx.globalAlpha = 1;
    paintCtx.strokeStyle = chart.color;
    paintCtx.fillStyle = "rgba(0, 242, 254, 0.06)";
    paintCtx.lineWidth = chart.size;
    paintCtx.font = `bold ${Math.max(16, chart.size * 2.4)}px var(--font-title, sans-serif)`;
    paintCtx.fillStyle = chart.color;
    paintCtx.fillText(chart.title, x, y - 22);

    chart.steps.forEach((step, idx) => {
      const by = y + idx * (boxH + gap);
      paintCtx.beginPath();
      paintCtx.roundRect(x, by, boxW, boxH, 8);
      paintCtx.fillStyle = "rgba(0, 242, 254, 0.06)";
      paintCtx.strokeStyle = chart.color;
      paintCtx.fill();
      paintCtx.stroke();

      paintCtx.fillStyle = chart.color;
      paintCtx.font = `bold ${Math.max(14, chart.size * 1.8)}px var(--font-body, sans-serif)`;
      const lines = wrapCanvasText(step, boxW - 28, Math.max(14, chart.size * 1.8)).slice(0, 2);
      lines.forEach((line, lineIdx) => {
        paintCtx.fillText(line, x + 14, by + 30 + lineIdx * 22);
      });

      if (idx < chart.steps.length - 1) {
        const ax = x + boxW / 2;
        const ay1 = by + boxH + 4;
        const ay2 = by + boxH + gap - 6;
        paintCtx.beginPath();
        paintCtx.moveTo(ax, ay1);
        paintCtx.lineTo(ax, ay2);
        paintCtx.lineTo(ax - 7, ay2 - 8);
        paintCtx.moveTo(ax, ay2);
        paintCtx.lineTo(ax + 7, ay2 - 8);
        paintCtx.stroke();
      }
    });
  }

  function drawVectorShape(shape) {
    paintCtx.beginPath();
    paintCtx.strokeStyle = shape.color;
    paintCtx.lineWidth = shape.size;
    paintCtx.globalAlpha = shape.alpha !== undefined ? shape.alpha : 1.0;
    
    if (shape.shapeData.type === 'circle') {
      paintCtx.arc(shape.shapeData.cx, shape.shapeData.cy, shape.shapeData.r, 0, Math.PI * 2);
    } else if (shape.shapeData.type === 'rectangle') {
      paintCtx.rect(shape.shapeData.x, shape.shapeData.y, shape.shapeData.w, shape.shapeData.h);
    } else if (shape.shapeData.type === 'triangle' || shape.shapeData.type === 'line' || shape.shapeData.type === 'arrow') {
      const pts = shape.shapeData.path || shape.shapeData.points;
      paintCtx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) paintCtx.lineTo(pts[i].x, pts[i].y);
      if (shape.shapeData.type === 'triangle') paintCtx.closePath();
    }
    paintCtx.stroke();
    paintCtx.globalAlpha = 1.0;
  }

  function startStroke(x, y) {
    const rect = paintCanvas.getBoundingClientRect();
    const px = x - rect.left;
    const py = y - rect.top;
    
    if (activeTool === "text") {
      activeTextStroke = {
        type: "text",
        tool: "text",
        color: activeDrawColor,
        size: Math.max(24, brushSize * 4), // Text size scaling
        text: "",
        x: px,
        y: py
      };
      whiteboardHistory.push(activeTextStroke);
      if (!isKeyboardVisible) window.toggleVirtualKeyboard();
      redrawWhiteboard();
      return;
    }

    currentStroke = {
      tool: activeTool,
      color: activeDrawColor,
      size: brushSize,
      points: [{ x: px, y: py }],
      startTime: Date.now()
    };
  }

  function addPointToStroke(x, y) {
    if (!currentStroke) return;
    const rect = paintCanvas.getBoundingClientRect();
    currentStroke.points.push({ x: x - rect.left, y: y - rect.top });
    redrawWhiteboard();
  }

  function endStroke() {
    if (!currentStroke) return;
    
    // Laser pointer decay loop
    if (currentStroke.tool === "laser") {
      let laserStroke = currentStroke;
      const decayDuration = 1000;
      const startT = Date.now();
      
      const animateLaser = () => {
        let elapsed = Date.now() - startT;
        if (elapsed > decayDuration) {
          whiteboardHistory = whiteboardHistory.filter(s => s !== laserStroke);
          redrawWhiteboard();
        } else {
          laserStroke.alpha = 1.0 - (elapsed / decayDuration);
          redrawWhiteboard();
          requestAnimationFrame(animateLaser);
        }
      };
      
      whiteboardHistory.push(laserStroke);
      whiteboardRedoStack = [];
      requestAnimationFrame(animateLaser);
      currentStroke = null;
      return;
    }
    
    if (currentStroke.points.length > 5 && aiShapeAssistEnabled && currentStroke.tool === "brush") {
      // AI Shape Assist evaluation
      if (window.ShapeClassifier) {
        const beautified = window.ShapeClassifier.classifyAndBeautify(currentStroke.points);
        if (beautified) {
          currentStroke.type = 'shape';
          currentStroke.shapeData = beautified;
          log(`AI Shape Assist: Recognized and cleaned ${beautified.type}.`);
        }
      }
    }

    whiteboardHistory.push(currentStroke);
    // limit history to 30
    if (whiteboardHistory.length > 30) whiteboardHistory.shift();
    whiteboardRedoStack = [];
    currentStroke = null;
    redrawWhiteboard();
  }
  
  window.whiteboardUndo = function() {
    if (whiteboardHistory.length > 0) {
      whiteboardRedoStack.push(whiteboardHistory.pop());
      redrawWhiteboard();
    }
  };
  
  window.whiteboardRedo = function() {
    if (whiteboardRedoStack.length > 0) {
      whiteboardHistory.push(whiteboardRedoStack.pop());
      redrawWhiteboard();
    }
  };

  window.whiteboardSetTool = function(toolName, event) {
    activeTool = toolName;
    if (activeTool !== "text") activeTextStroke = null;
    
    if (event && event.currentTarget) {
      document.querySelectorAll(".tool-btn").forEach(btn => btn.classList.remove("active"));
      event.currentTarget.classList.add("active");
    } else {
       // fallback if event not passed (e.g. from inline onclick without event)
       document.querySelectorAll(".tool-btn").forEach(btn => btn.classList.remove("active"));
       const btns = document.querySelectorAll(".tool-btn");
       if(toolName === 'brush' && btns[0]) btns[0].classList.add("active");
       if(toolName === 'eraser' && btns[1]) btns[1].classList.add("active");
       if(toolName === 'laser' && btns[2]) btns[2].classList.add("active");
       if(toolName === 'text' && btns[3]) btns[3].classList.add("active");
    }
    log("Whiteboard tool set to: " + toolName);
  };
  
  window.toggleAiShapeAssist = function(enabled) {
    aiShapeAssistEnabled = enabled;
  };

  window.toggleSystemCursor = function(enabled) {
    systemCursorMode = enabled;
    log(enabled ? "System cursor mode ENABLED — hand controls OS cursor." : "System cursor mode disabled.");
    if (enabled && !bridgeOnline) {
      log("⚠️  Cursor bridge not ready. Make sure Node.js (Terminal) has Accessibility access in System Settings.");
    }
  };

  window.toggleSystemScroll = function(enabled) {
    systemScrollEnabled = enabled;
    if (!enabled) {
      scrollPoseActive = false;
      lastScrollY = null;
      customCursor.classList.remove("scrolling");
    }
    log(enabled ? "System scroll ENABLED — two-finger hand pose scrolls the OS." : "System scroll disabled.");
  };

  window.setGridDivisions = function(value) {
    const parsed = parseInt(value, 10);
    gridDivisions = Math.max(2, Math.min(32, Number.isFinite(parsed) ? parsed : 8));
    if (calibrationPoints.length === 4) {
      computeHomography();
      log(`Calibration grid rebuilt as ${gridDivisions} x ${gridDivisions}.`);
    }
  };

  window.setAngleDriftStrength = function(value) {
    const parsed = parseFloat(value);
    angleDriftStrength = Math.max(-1.5, Math.min(1.5, Number.isFinite(parsed) ? parsed / 100 : 0.35));
    const label = document.getElementById("angle-drift-val");
    if (label) label.innerText = `${Math.round(angleDriftStrength * 100)}%`;
    log(`Angle drift compensation set to ${Math.round(angleDriftStrength * 100)}%.`);
  };

  window.setDistanceFromScreen = function(cm) {
    const val = parseFloat(cm);
    if (tracker) {
      tracker.setDistanceFromScreen(val > 0 ? val : null);
    }
    log(val > 0 ? `Distance from screen set to ${val} cm.` : "Distance from screen: auto (not set).");
  };

  function pushWhiteboardItem(item) {
    whiteboardHistory.push(item);
    if (whiteboardHistory.length > 30) whiteboardHistory.shift();
    whiteboardRedoStack = [];
    redrawWhiteboard();
  }

  function insertAiText(text, title = "Local AI") {
    const fontSize = Math.max(18, brushSize * 2.4);
    pushWhiteboardItem({
      type: "text",
      tool: "text",
      color: activeDrawColor,
      size: fontSize,
      text: `${title}\n${text}`,
      x: 36,
      y: 52,
      maxWidth: Math.max(320, paintCanvas.width - 80)
    });
  }

  function insertAiFlowchart(chart) {
    const stepCount = Math.max(1, chart.steps.length);
    const boxW = Math.min(520, Math.max(300, paintCanvas.width * 0.46));
    const availableH = Math.max(260, paintCanvas.height - 120);
    const gap = 26;
    const boxH = Math.max(56, Math.min(88, (availableH - gap * (stepCount - 1)) / stepCount));
    pushWhiteboardItem({
      type: "flowchart",
      color: activeDrawColor,
      size: Math.max(3, brushSize / 2),
      title: chart.title || "Flowchart",
      steps: chart.steps && chart.steps.length ? chart.steps : ["Start", "Finish"],
      x: Math.max(30, (paintCanvas.width - boxW) / 2),
      y: 82,
      boxW,
      boxH,
      gap
    });
  }

  function insertAiTable(text, title = "Table") {
    const rows = String(text || "")
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean)
      .slice(0, 8);
    insertAiText(rows.length ? rows.join("\n") : "Term | Meaning\nFirst | Main idea\nNext | Detail", title);
  }

  window.triggerLocalAi = async function(prompt, mode) {
    const input = document.getElementById('ai-prompt-input');
    const cleanPrompt = String(prompt || "").trim();
    if (!cleanPrompt || !window.LocalOllamaAssistant) return;

    input.value = mode === "flowchart" ? "Generating local flowchart..." : "Thinking locally...";
    try {
      if (mode === "flowchart") {
        const chart = await window.LocalOllamaAssistant.generateFlowchart(cleanPrompt, "llama3");
        insertAiFlowchart(chart);
        log("Local AI generated flowchart for: " + cleanPrompt);
      } else if (mode === "table" || mode === "wordchart") {
        const text = await window.LocalOllamaAssistant.generateText(
          `${mode === "table" ? "Make a simple table" : "Make a child-friendly word chart"} for: ${cleanPrompt}`,
          "answer",
          "llama3"
        );
        insertAiTable(text, mode === "table" ? "Table" : "Word Chart");
        log(`Local AI generated ${mode} for: ${cleanPrompt}`);
      } else {
        const text = await window.LocalOllamaAssistant.generateText(cleanPrompt, mode, "llama3");
        insertAiText(text, mode === "definition" ? "Definition" : "Local AI");
        log("Local AI generated answer for: " + cleanPrompt);
      }
    } finally {
      input.value = "";
    }
  };
  
  window.triggerAiMagicSketch = async function(prompt) {
    if (!window.MagicSketchGenerator) return;
    const rect = paintCanvas.getBoundingClientRect();
    
    // UI feedback
    const originalPrompt = document.getElementById('ai-prompt-input').value;
    document.getElementById('ai-prompt-input').value = "✨ Generating with Ollama...";
    
    let paths = null;
    if (window.OllamaGenerativeAI) {
      paths = await window.OllamaGenerativeAI.fetchAndParse(prompt, rect.width, rect.height, "llama3");
    }
    
    if (!paths) {
      log("Ollama fallback: Using procedural shapes.");
      paths = window.MagicSketchGenerator.generateSketch(prompt, rect.width, rect.height);
    }
    
    document.getElementById('ai-prompt-input').value = ""; // clear after done
    
    // Draw paths animatedly
    paths.forEach((path, pathIdx) => {
      let stroke = {
        tool: "brush",
        color: activeDrawColor,
        size: brushSize,
        points: [],
        startTime: Date.now()
      };
      whiteboardHistory.push(stroke);
      let pointIdx = 0;
      const drawStep = () => {
        if (pointIdx < path.length) {
          stroke.points.push(path[pointIdx]);
          redrawWhiteboard();
          pointIdx++;
          setTimeout(drawStep, 30); // 30ms between points
        }
      };
      setTimeout(drawStep, pathIdx * 500); // offset each path
    });
    log("AI Magic Sketch executed for: " + prompt);
  };

  // --- Virtual Keyboard ---
  const keyboardLayout = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Back']
  ];
  let isKeyboardVisible = false;
  
  function renderKeyboard() {
    const container = document.getElementById("vk-keys");
    container.innerHTML = "";
    
    // Add close button row
    const topRow = document.createElement("div");
    topRow.className = "vk-row";
    topRow.style.justifyContent = "space-between";
    topRow.innerHTML = `<span style="color: var(--accent-cyan); font-weight: bold; padding-left: 10px;">TouchWall OS Keyboard</span>
                        <button class="vk-key" onclick="toggleVirtualKeyboard()" style="background: rgba(255,0,0,0.2); border-color: red;">Close ❌</button>`;
    container.appendChild(topRow);

    keyboardLayout.forEach(row => {
      const rowDiv = document.createElement("div");
      rowDiv.className = "vk-row";
      row.forEach(key => {
        const btn = document.createElement("button");
        btn.className = "vk-key";
        if (key === "Back") btn.classList.add("wide");
        btn.innerText = key;
        btn.onclick = () => handleKeyPress(key);
        rowDiv.appendChild(btn);
      });
      container.appendChild(rowDiv);
    });

    const spaceRow = document.createElement("div");
    spaceRow.className = "vk-row";
    const spaceBtn = document.createElement("button");
    spaceBtn.className = "vk-key spacebar";
    spaceBtn.innerText = "SPACE";
    spaceBtn.onclick = () => handleKeyPress(" ");
    const clearBtn = document.createElement("button");
    clearBtn.className = "vk-key wide";
    clearBtn.innerText = "Clear";
    clearBtn.onclick = () => handleKeyPress("Clear");
    spaceRow.appendChild(clearBtn);
    spaceRow.appendChild(spaceBtn);
    container.appendChild(spaceRow);
  }

  window.toggleVirtualKeyboard = function() {
    const kb = document.getElementById("virtual-keyboard");
    isKeyboardVisible = !isKeyboardVisible;
    kb.style.display = isKeyboardVisible ? "flex" : "none";
    if (isKeyboardVisible && document.getElementById("vk-keys").children.length === 0) {
      renderKeyboard();
    }
  };

  function handleKeyPress(key) {
    let targetEl = document.activeElement;
    let isInputField = targetEl && (targetEl.tagName === "INPUT" || targetEl.tagName === "TEXTAREA");
    
    let target = isInputField ? targetEl : null;
    let isCanvasText = false;
    
    if (!target) {
      if (activeTextStroke) {
        isCanvasText = true;
      } else {
        target = document.getElementById("ai-prompt-input"); // fallback
      }
    }
    
    if (isCanvasText) {
      if (key === "Back") {
        activeTextStroke.text = activeTextStroke.text.slice(0, -1);
      } else if (key === "Clear") {
        activeTextStroke.text = "";
      } else {
        activeTextStroke.text += (key === "SPACE" ? " " : key);
      }
      redrawWhiteboard();
    } else if (target) {
      if (key === "Back") {
        target.value = target.value.slice(0, -1);
      } else if (key === "Clear") {
        target.value = "";
      } else {
        target.value += (key === "SPACE" ? " " : key);
      }
    }
    log(`Keyboard typed: [${key}]`);
  }

  // Paint color selector triggers
  document.querySelectorAll(".color-swatch").forEach(swatch => {
    swatch.addEventListener("click", (e) => {
      document.querySelector(".color-swatch.active").classList.remove("active");
      swatch.classList.add("active");
      activeDrawColor = swatch.getAttribute("data-color");
      log(`Brush color set to: ${activeDrawColor}`);
    });
  });

  brushSizeInput.addEventListener("input", (e) => {
    brushSize = parseInt(e.target.value);
    brushSizeVal.innerText = `${brushSize}px`;
  });

  clearCanvasBtn.addEventListener("click", () => {
    whiteboardHistory = [];
    whiteboardRedoStack = [];
    redrawWhiteboard();
    log("Whiteboard cleared.");
  });

  const pdfUploadInput = document.getElementById("pdf-upload-input");
  if (pdfUploadInput) {
    pdfUploadInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const viewer = document.getElementById("pdf-viewer");
      viewer.src = url;
      viewer.style.display = "block";
      log(`Loaded PDF for annotation: ${file.name}`);
    });
  }

  // --- Sub-App 2: Physics Popping Game ---
  class Bubble {
    constructor(x, y, radius, dx, dy, color) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.dx = dx;
      this.dy = dy;
      this.color = color;
      this.popped = false;
      this.particles = [];
      this.pulsePhase = Math.random() * Math.PI;
    }

    draw(ctx) {
      if (this.popped) {
        // Draw burst particles
        this.particles.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;
        return;
      }

      // Draw active bubble with pulsing neon glow
      this.pulsePhase += 0.05;
      const pulsingRadius = this.radius + Math.sin(this.pulsePhase) * 3;

      const gradient = ctx.createRadialGradient(
        this.x - pulsingRadius/3, this.y - pulsingRadius/3, pulsingRadius/10,
        this.x, this.y, pulsingRadius
      );
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      gradient.addColorStop(0.2, this.color);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.0)");

      ctx.beginPath();
      ctx.arc(this.x, this.y, pulsingRadius, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      
      // Add neon outline stroke
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fill();
    }

    update(width, height) {
      if (this.popped) {
        // Update burst particles
        this.particles.forEach(p => {
          p.x += p.dx;
          p.y += p.dy;
          p.size *= 0.92;
          p.alpha -= 0.03;
        });
        this.particles = this.particles.filter(p => p.alpha > 0);
        return;
      }

      // Move bubble
      this.x += this.dx;
      this.y += this.dy;

      // Bounce off boundaries
      if (this.x - this.radius < 0) {
        this.x = this.radius;
        this.dx = -this.dx;
      }
      if (this.x + this.radius > width) {
        this.x = width - this.radius;
        this.dx = -this.dx;
      }
      if (this.y - this.radius < 0) {
        this.y = this.radius;
        this.dy = -this.dy;
      }
      if (this.y + this.radius > height) {
        this.y = height - this.radius;
        this.dy = -this.dy;
      }
    }

    pop() {
      this.popped = true;
      // Spawn explosion particles
      const count = 12 + Math.floor(Math.random() * 8);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        this.particles.push({
          x: this.x,
          y: this.y,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 6,
          alpha: 1.0,
          color: this.color
        });
      }
    }
  }

  function spawnBubble() {
    if (!isGameActive) return;
    
    const radius = 35 + Math.random() * 25;
    const x = radius + Math.random() * (gameCanvas.width - radius * 2);
    const y = radius + Math.random() * (gameCanvas.height - radius * 2);
    const dx = (Math.random() - 0.5) * 6;
    const dy = (Math.random() - 0.5) * 6;
    
    const colors = ["var(--accent-magenta)", "var(--accent-cyan)", "var(--accent-yellow)", "var(--accent-green)"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    bubbles.push(new Bubble(x, y, radius, dx, dy, color));
  }

  function startGame() {
    isGameActive = true;
    gameScore = 0;
    gameTimeRemaining = 60;
    bubbles = [];
    
    gameWelcomeScreen.style.display = "none";
    gameScoreVal.innerText = gameScore;
    gameTimerVal.innerText = gameTimeRemaining;

    // Spawn initial bunch
    for (let i = 0; i < 5; i++) spawnBubble();

    // Timer Interval
    gameIntervalId = setInterval(() => {
      gameTimeRemaining--;
      gameTimerVal.innerText = gameTimeRemaining;
      
      // Spawn new bubble occasionally
      if (bubbles.filter(b => !b.popped).length < 8) {
        spawnBubble();
      }

      if (gameTimeRemaining <= 0) {
        endGame();
      }
    }, 1000);

    // Physics Animation Loop
    function animate() {
      if (!isGameActive) return;

      gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

      bubbles.forEach(b => {
        b.update(gameCanvas.width, gameCanvas.height);
        b.draw(gameCtx);
      });

      // Filter out completed particles
      bubbles = bubbles.filter(b => !b.popped || b.particles.length > 0);

      gameAnimationId = requestAnimationFrame(animate);
    }
    animate();
    log("Laser Pop game started! Hover or click bubbles to pop them.");
  }

  function endGame() {
    isGameActive = false;
    clearInterval(gameIntervalId);
    cancelAnimationFrame(gameAnimationId);
    
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    gameWelcomeScreen.style.display = "block";
    gameWelcomeScreen.querySelector("h3").innerText = "Game Over!";
    gameWelcomeScreen.querySelector("p").innerText = `Great job! You popped ${gameScore} laser bubbles! Tap Start to play again.`;
    
    log(`Game completed. Final Score: ${gameScore}`);
  }

  function checkGameBubblePop(cursorX, cursorY, immediateClick) {
    if (!isGameActive) return;

    const rect = gameCanvas.getBoundingClientRect();
    const cx = cursorX - rect.left;
    const cy = cursorY - rect.top;

    bubbles.forEach(b => {
      if (b.popped) return;

      const dist = Math.sqrt(Math.pow(cx - b.x, 2) + Math.pow(cy - b.y, 2));
      
      // If immediateClick (pinch/depth tap) is down, pop instantly!
      // Otherwise, require hover dwell completion (which is handled inside tracker and dispatches simulated clicks)
      if (dist < b.radius + 15) {
        if (immediateClick || clickTriggerMode.value === "dwell") {
          b.pop();
          gameScore += 10;
          gameScoreVal.innerText = gameScore;
          spawnBubble(); // Spawn replacement
        }
      }
    });
  }

  startGameBtn.addEventListener("click", startGame);

  // --- Sub-App 3: Smart Home Controls ---
  document.querySelectorAll(".device-card").forEach(card => {
    const toggle = card.querySelector(".toggle-switch");
    const range = card.querySelector(".device-range");
    const labelVal = card.querySelector(".value-display");

    toggle.addEventListener("click", (e) => {
      e.stopPropagation(); // Avoid double toggling
      card.classList.toggle("on");
      const isOn = card.classList.contains("on");
      log(`Device '${card.querySelector(".device-name").innerText}' toggled ${isOn ? 'ON' : 'OFF'}.`);
    });

    if (range) {
      range.addEventListener("input", (e) => {
        const val = e.target.value;
        const unit = card.id === "device-ac" ? "°C" : "%";
        labelVal.innerText = `${val}${unit}`;
      });
      range.addEventListener("change", (e) => {
        log(`Device '${card.querySelector(".device-name").innerText}' adjusted to ${e.target.value}`);
      });
    }
  });

  // --- Control Panel Handlers ---
  filterAlphaInput.addEventListener("input", (e) => {
    const alpha = parseFloat(e.target.value) / 100;
    alphaVal.innerText = alpha.toFixed(2);
    cursorFilter.updateSettings(alpha, cursorFilter.beta);
  });

  filterBetaInput.addEventListener("input", (e) => {
    const beta = parseFloat(e.target.value) / 100;
    betaVal.innerText = beta.toFixed(2);
    cursorFilter.updateSettings(cursorFilter.alpha, beta);
  });

  clickTriggerMode.addEventListener("change", (e) => {
    const mode = e.target.value;
    log(`Cursor interaction mode set to: ${mode}`);
    
    // Show/hide touch depth calibration button dynamically
    const depthCalContainer = document.getElementById("depth-calibration-container");
    if (depthCalContainer) {
      depthCalContainer.style.display = mode === "depth" ? "block" : "none";
    }

    // Update live tracker sensitivity properties if tracker exists
    if (tracker) {
      if (mode === "dwell") {
        tracker.dwellDuration = 1000;
      } else {
        tracker.dwellDuration = 99999; // effectively bypass
      }
    }
  });

  // --- Cursor Fine-Tuning Offset Sliders ---
  const cursorXOffsetInput = document.getElementById("cursor-x-offset");
  const cursorYOffsetInput = document.getElementById("cursor-y-offset");
  const gridDivisionInput = document.getElementById("grid-division-count");
  const angleDriftInput = document.getElementById("angle-drift-strength");
  const xOffsetVal = document.getElementById("x-offset-val");
  const yOffsetVal = document.getElementById("y-offset-val");
  
  if (cursorXOffsetInput && xOffsetVal) {
    cursorXOffsetInput.addEventListener("input", (e) => {
      xOffsetVal.innerText = `${e.target.value > 0 ? "+" : ""}${e.target.value}px`;
    });
  }
  if (cursorYOffsetInput && yOffsetVal) {
    cursorYOffsetInput.addEventListener("input", (e) => {
      yOffsetVal.innerText = `${e.target.value > 0 ? "+" : ""}${e.target.value}px`;
    });
  }
  if (gridDivisionInput) {
    gridDivisionInput.addEventListener("input", (e) => {
      const label = e.target.previousElementSibling && e.target.previousElementSibling.querySelector(".value-display");
      if (label) label.innerText = `${e.target.value} x ${e.target.value}`;
      window.setGridDivisions(e.target.value);
    });
  }
  if (angleDriftInput) {
    angleDriftInput.addEventListener("input", (e) => {
      window.setAngleDriftStrength(e.target.value);
    });
  }

  // --- Fingertip Touch Plane Calibration Button ---
  const calibrateTouchDepthBtn = document.getElementById("calibrate-touch-depth-btn");
  const touchDepthStatus = document.getElementById("touch-depth-status");
  
  if (calibrateTouchDepthBtn) {
    calibrateTouchDepthBtn.addEventListener("click", () => {
      if (!tracker || !tracker.isTracking) {
        alert("Webcam hand tracking is not active. Please start tracking first!");
        return;
      }
      try {
        const threshold = tracker.calibrateTouchDepth();
        calibratedTouchThreshold = threshold;
        
        if (touchDepthStatus) {
          touchDepthStatus.innerText = `Threshold: ${threshold.toFixed(4)} ✓`;
          touchDepthStatus.style.color = "var(--accent-green)";
        }
        
        log(`Touch Plane calibrated! 3D Extension Threshold: ${threshold.toFixed(4)}`);
      } catch (err) {
        alert("Calibration failed: " + err.message);
        log("Touch calibration failed: " + err.message);
      }
    });
  }

  clearLogsBtn.addEventListener("click", () => {
    logTerminal.innerText = "Logs cleared.";
  });

  const recordSessionBtn = document.getElementById("record-session-btn");
  const uploadSessionBtn = document.getElementById("upload-session-btn");
  const captionsSessionBtn = document.getElementById("captions-session-btn");
  const recordingStatus = document.getElementById("recording-status");
  let sessionRecorder = null;
  let recordedChunks = [];

  if (recordSessionBtn && navigator.mediaDevices?.getDisplayMedia) {
    recordSessionBtn.addEventListener("click", async () => {
      if (sessionRecorder && sessionRecorder.state === "recording") {
        sessionRecorder.stop();
        recordSessionBtn.innerText = "Start Recording";
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        recordedChunks = [];
        sessionRecorder = new MediaRecorder(stream);
        sessionRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) recordedChunks.push(event.data);
        };
        sessionRecorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          recordingStatus.innerHTML = `Recording saved locally. <a href="${url}" download="cogniplay-session.webm">Download session</a>`;
          stream.getTracks().forEach(track => track.stop());
          log("Lecture recording stopped and saved locally.");
        };
        sessionRecorder.start();
        recordSessionBtn.innerText = "Stop Recording";
        recordingStatus.innerText = "Recording session locally...";
        log("Lecture recording started.");
      } catch (error) {
        recordingStatus.innerText = "Recording permission was not granted.";
        log("Recording failed: " + error.message);
      }
    });
  }

  if (uploadSessionBtn) {
    uploadSessionBtn.addEventListener("click", () => {
      recordingStatus.innerText = "Cloud upload is ready to connect. Add Google Drive/S3 credentials on the server to enable automatic upload.";
      log("Cloud upload requested. Credentials are not configured yet.");
    });
  }

  if (captionsSessionBtn) {
    captionsSessionBtn.addEventListener("click", () => {
      recordingStatus.innerText = "Subtitle pipeline placeholder: send recorded audio to Google Speech-to-Text or local Whisper after credentials/model setup.";
      log("Subtitle generation requested. Speech-to-text backend is not configured yet.");
    });
  }

  // --- Navigation App Switcher ---
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelector(".tab-btn.active").classList.remove("active");
      document.querySelector(".app-view.active").classList.remove("active");
      
      btn.classList.add("active");
      const appName = btn.getAttribute("data-app");
      document.getElementById(`app-${appName}`).classList.add("active");
      
      // Cleanup game loops if they navigated away
      if (currentActiveApp === "game" && appName !== "game" && isGameActive) {
        endGame();
      }

      currentActiveApp = appName;
      log(`App switched to: ${appName.toUpperCase()}`);
      
      // Resize standard frames
      setTimeout(resizeCanvases, 50);
    });
  });

  // --- Invert X (Mirroring) Control ---
  const flipXToggle = document.getElementById("flip-x-toggle");
  
  function updateCameraMirroring() {
    const isFlipped = flipXToggle.checked;
    if (isFlipped) {
      webcamFeed.style.transform = "scaleX(-1)";
      overlayCanvas.style.transform = "scaleX(-1)";
    } else {
      webcamFeed.style.transform = "scaleX(1)";
      overlayCanvas.style.transform = "scaleX(1)";
    }
    log(`Camera Mirroring X-Axis: ${isFlipped ? "ENABLED (Mirrored Preview)" : "DISABLED (Normal Preview)"}`);
  }
  
  if (flipXToggle) {
    flipXToggle.addEventListener("change", updateCameraMirroring);
  }

  // --- Live Camera corner click listener for camera-assisted calibration ---
  overlayCanvas.addEventListener("mousedown", (e) => {
    if (!isCalibrating) return;

    const rect = overlayCanvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert to normalized coordinates relative to camera aspect bounds
    let normX = clickX / rect.width;
    let normY = clickY / rect.height;

    // Accounts for active camera mirroring preview
    const isFlippedX = flipXToggle ? flipXToggle.checked : true;
    if (isFlippedX) {
      normX = 1 - normX;
    }

    log(`Camera assisted click: Clicked Canvas X:${clickX.toFixed(0)}, Y:${clickY.toFixed(0)} -> Norm X:${normX.toFixed(3)}, Y:${normY.toFixed(3)}`);
    recordCalibrationPoint({ x: normX, y: normY });
  });

  // Attach button triggers
  const autoCalibrationBtn = document.getElementById("auto-calibration-btn");
  toggleTrackingBtn.addEventListener("click", toggleHandTracking);
  startCalibrationBtn.addEventListener("click", startCalibration);
  if (autoCalibrationBtn) {
    autoCalibrationBtn.addEventListener("click", startAutoCalibration);
  }
  resetCalibrationBtn.addEventListener("click", resetCalibration);
  cancelCalibrationBtn.addEventListener("click", cancelCalibration);
  
  // Connect corner dots
  document.querySelectorAll(".calibration-dot").forEach(dot => {
    dot.addEventListener("click", handleCalibrationClick);
  });

  // --- Initialize ---
  if (flipXToggle) updateCameraMirroring();
  loadSavedCalibration();
  log("TouchWall OS Initialized. Select 'Start Hand Tracking' or align your projector coordinates.");
});
