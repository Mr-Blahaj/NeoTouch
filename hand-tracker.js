/**
 * TouchWall Hand Tracker Engine v3
 *
 * Interfaces with Classic Google MediaPipe Hands API.
 *
 * Major improvements over v2:
 *  1. Per-landmark OneEuroFilter1D smoothing — eliminates jitter at the source
 *     before any gesture calculations, giving every downstream algorithm clean data.
 *  2. Velocity-gated pinch — prevents accidental pinch triggers when the hand
 *     is moving fast. Real pinch gestures always occur while nearly stationary.
 *  3. Temporal pinch hysteresis counter — pinch must be detected across several
 *     consecutive frames before it fires, kills single-frame glitch triggers.
 *  4. Improved depth / Z-axis perception — uses the full hand plane to compute
 *     the actual push-forward depth rather than a single fingertip distance.
 *  5. Optional `distanceFromScreen` parameter — scales depth thresholds so the
 *     same gesture works whether you're 50 cm or 3 m from the projection surface.
 *  6. Stable pointer position — uses a blend of index finger orientation vector
 *     (projected from MCP→tip direction) for steadier aim when pointing.
 *  7. Actual frame dt tracking — filters run with real time deltas so their
 *     frequency response is frame-rate-independent.
 */

class TouchWallTracker {
  constructor(options = {}) {
    this.videoElement = options.videoElement || null;
    this.onFrame      = options.onFrame || (() => {});

    // -----------------------------------------------------------------------
    // Sensitivity thresholds
    // -----------------------------------------------------------------------
    this.pinchThreshold        = options.pinchThreshold        ?? 0.24;  // Scale-normalised ratio
    this.pinchReleaseThreshold = this.pinchThreshold * 1.4;              // Wider hysteresis band
    this.pinchFramesRequired   = options.pinchFramesRequired   ?? 2;     // Frames needed to confirm pinch
    this.pinchVelocityGate     = options.pinchVelocityGate     ?? 1.10;  // Max normalised velocity to allow pinch

    this.dwellDuration         = options.dwellDuration         ?? 1000;  // ms
    this.dwellRadius           = options.dwellRadius           ?? 20;    // px
    this.depthTapThreshold     = options.depthTapThreshold     ?? 0.14;  // Depth-click extension threshold

    // Optional: physical distance (cm) from the user to the projection surface.
    // When set, depth thresholds are scaled so the gesture feels the same regardless of range.
    this.distanceFromScreen    = options.distanceFromScreen    ?? null;  // cm, null = auto
    this.referenceDistance     = 100;                                    // cm (calibration baseline)

    // -----------------------------------------------------------------------
    // Per-landmark OneEuroFilter1D instances — 21 landmarks × {x, y, z}
    // Z needs more smoothing (much noisier) so it uses a lower minCutoff.
    // -----------------------------------------------------------------------
    this.landmarkFilters = Array.from({ length: 21 }, () => ({
      x: new OneEuroFilter1D(2.0, 0.15, 1.0),
      y: new OneEuroFilter1D(2.0, 0.15, 1.0),
      z: new OneEuroFilter1D(0.8, 0.05, 1.0)
    }));

    // -----------------------------------------------------------------------
    // Pinch state
    // -----------------------------------------------------------------------
    this.isPinching        = false;
    this.pinchFrameCount   = 0;    // Consecutive frames where pinch distance < threshold
    this.pinchReleaseCount = 0;    // Consecutive frames where pinch > release threshold

    // -----------------------------------------------------------------------
    // Velocity tracking (using wrist landmark, normalised coords)
    // -----------------------------------------------------------------------
    this.prevWristX   = null;
    this.prevWristY   = null;
    this.handVelocity = 0;         // Smoothed, scale-normalised velocity

    // -----------------------------------------------------------------------
    // Dwell / depth / general state
    // -----------------------------------------------------------------------
    this.isDwellTicking   = false;
    this.dwellStartTime   = 0;
    this.dwellAnchorPoint = { x: 0, y: 0 };
    this.dwellTriggered   = false;

    this.lastLandmarks    = null;
    this.isDepthClicking  = false;
    this.depthFrameCount  = 0;
    this.depthReleaseCount = 0;
    this.depthBaseline    = null;
    this.depthSmoothed    = 0;
    this.isTracking       = false;
    this.hands            = null;
    this.camera           = null;

    // Frame timing
    this.lastFrameTime    = null;
  }

  // =========================================================================
  // Lifecycle
  // =========================================================================

  async start() {
    if (this.isTracking) return;

    try {
      if (!window.Hands || !window.Camera) {
        throw new Error("Classic MediaPipe Hands or Camera scripts not loaded from CDN.");
      }

      this.hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      this.hands.setOptions({
        maxNumHands:            1,
        modelComplexity:        1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence:  0.65
      });

      this.hands.onResults((results) => {
        if (this.isTracking) this.processTrackingResults(results);
      });

      this.camera = new window.Camera(this.videoElement, {
        onFrame: async () => {
          if (this.isTracking && this.hands && this.videoElement) {
            try { await this.hands.send({ image: this.videoElement }); }
            catch (err) { console.error("Frame processing error:", err); }
          }
        },
        width: 640,
        height: 480
      });

      await this.camera.start();
      this.isTracking = true;
      this.dispatchEvent("trackerstatechange", { status: "active" });
    } catch (error) {
      console.error("TouchWall Tracker failed to initialise:", error);
      this.dispatchEvent("trackerstatechange", { status: "error", error: error.message });
      throw error;
    }
  }

  async stop() {
    this.isTracking = false;

    if (this.camera) {
      try { await this.camera.stop(); } catch (e) { console.warn("Camera stop warning:", e); }
      this.camera = null;
    }
    if (this.hands) {
      try { await this.hands.close(); } catch (e) { console.warn("Hands close warning:", e); }
      this.hands = null;
    }

    this.isPinching       = false;
    this.pinchFrameCount  = 0;
    this.isDwellTicking   = false;
    this.dwellTriggered   = false;
    this.isDepthClicking  = false;
    this.depthFrameCount  = 0;
    this.depthReleaseCount = 0;
    this.depthBaseline    = null;
    this.depthSmoothed    = 0;
    this.lastFrameTime    = null;

    this.dispatchEvent("trackerstatechange", { status: "inactive" });
  }

  // =========================================================================
  // Main frame processing
  // =========================================================================

  processTrackingResults(results) {
    // Compute per-frame dt in seconds (clamped to reasonable range)
    const now = performance.now();
    const dt  = this.lastFrameTime
      ? Math.min(Math.max((now - this.lastFrameTime) / 1000, 0.005), 0.1)
      : 0.033;
    this.lastFrameTime = now;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const rawLandmarks = results.multiHandLandmarks[0];
      this.lastLandmarks = rawLandmarks;

      // ------------------------------------------------------------------
      // 1. Per-landmark filtering — apply OneEuroFilter1D to every landmark
      //    x, y, z independently. This is the foundation that makes all
      //    downstream calculations stable.
      // ------------------------------------------------------------------
      const lm = rawLandmarks.map((pt, i) => ({
        x: this.landmarkFilters[i].x.filter(pt.x, dt),
        y: this.landmarkFilters[i].y.filter(pt.y, dt),
        z: this.landmarkFilters[i].z.filter(pt.z, dt)
      }));
      this.lastLandmarks = lm;

      // ------------------------------------------------------------------
      // 2. Velocity — use wrist landmark (0) to measure gross hand speed.
      //    Velocity is scale-normalised using hand size (wrist→middle MCP).
      // ------------------------------------------------------------------
      const handScale = this.get3DDistance(lm[0], lm[9]) || 0.01;
      this._updateVelocity(lm[0], handScale, dt);

      // ------------------------------------------------------------------
      // 3. Stable pointer position — project the index finger ray forward
      //    by blending the fingertip with the direction from MCP→tip.
      //    This compensates for MediaPipe's slight "behind-fingertip" bias.
      // ------------------------------------------------------------------
      const isFlippedX = document.getElementById("flip-x-toggle")
        ? document.getElementById("flip-x-toggle").checked
        : true;

      const { rawX, rawY } = this._computePointerPosition(lm, isFlippedX);

      // Dispatch smoothed frame data
      this.onFrame({
        rawX,
        rawY,
        landmarks: lm,           // smoothed landmarks
        rawZ: lm[8].z,
        depthSignal: this.depthSmoothed,
        handVelocity: this.handVelocity
      });

      // ------------------------------------------------------------------
      // 4. Gesture evaluation (on smoothed data)
      // ------------------------------------------------------------------
      this.evaluatePinch(lm, handScale);
      this.evaluateDepthClick(lm, handScale);
      this.evaluateDwell(rawX, rawY);

    } else {
      // Hand lost — clear all gesture states
      if (this.isPinching)      this.triggerClickRelease("pinch");
      if (this.isDepthClicking) this.triggerDepthClickRelease();
      this.cancelDwell();
      this.pinchFrameCount  = 0;
      this.depthFrameCount  = 0;
      this.depthReleaseCount = 0;
      this.depthBaseline    = null;
      this.handVelocity     = 0;
      this.prevWristX       = null;
      this.prevWristY       = null;
      this.onFrame({ rawX: null, rawY: null, landmarks: null, rawZ: null });
    }
  }

  // =========================================================================
  // Stable pointer computation
  // =========================================================================

  /**
   * Computes a stable screen-space pointer from the index finger.
   * Projects the fingertip slightly further along the MCP→tip direction
   * to account for MediaPipe's knuckle-biased Z model.
   */
  _computePointerPosition(lm, isFlippedX) {
    const mcp = lm[5]; // Index finger MCP (knuckle)
    const tip = lm[8]; // Index finger tip

    const pip = lm[6]; // Index finger PIP

    // Keep the pointer directly under the fingertip. Projection made the cursor
    // float ahead and amplified parallax when the camera was off-axis.
    const PROJ = 0.0;
    const dirX = (tip.x - mcp.x) * 0.65 + (tip.x - pip.x) * 0.35;
    const dirY = (tip.y - mcp.y) * 0.65 + (tip.y - pip.y) * 0.35;
    const px   = Math.max(0, Math.min(1, tip.x + PROJ * dirX));
    const py   = Math.max(0, Math.min(1, tip.y + PROJ * dirY));

    return {
      rawX: isFlippedX ? (1 - px) : px,
      rawY: py
    };
  }

  // =========================================================================
  // Velocity tracking
  // =========================================================================

  _updateVelocity(wrist, handScale, dt) {
    if (this.prevWristX === null) {
      this.prevWristX = wrist.x;
      this.prevWristY = wrist.y;
      this.handVelocity = 0;
      return;
    }

    const dx = (wrist.x - this.prevWristX) / dt;
    const dy = (wrist.y - this.prevWristY) / dt;
    const rawV = Math.sqrt(dx * dx + dy * dy) / (handScale || 0.01); // scale-normalised

    // Smooth velocity with a simple exponential filter (fast rise, slower decay)
    const velAlpha = rawV > this.handVelocity ? 0.6 : 0.2;
    this.handVelocity = velAlpha * rawV + (1 - velAlpha) * this.handVelocity;

    this.prevWristX = wrist.x;
    this.prevWristY = wrist.y;
  }

  // =========================================================================
  // Gesture: Pinch (velocity-gated + frame-count confirmation)
  // =========================================================================

  evaluatePinch(lm, handScale) {
    const thumbTip = lm[4];
    const indexTip = lm[8];

    const dist           = this.get3DDistance(thumbTip, indexTip);
    const normalizedDist = dist / (handScale || 0.01);

    if (!this.isPinching) {
      // GATE: reject pinch when hand is moving fast
      if (this.handVelocity > this.pinchVelocityGate) {
        this.pinchFrameCount = 0;
      } else if (normalizedDist < this.pinchThreshold) {
        this.pinchFrameCount++;
        if (this.pinchFrameCount >= this.pinchFramesRequired) {
          this.isPinching      = true;
          this.pinchFrameCount = 0;
          this.triggerClickDown("pinch");
        }
      } else {
        this.pinchFrameCount = 0;
      }
    } else {
      // Require several consecutive frames above release threshold before releasing
      if (normalizedDist > this.pinchReleaseThreshold) {
        this.pinchReleaseCount++;
        if (this.pinchReleaseCount >= 2) {
          this.pinchReleaseCount = 0;
          this.triggerClickRelease("pinch");
        }
      } else {
        this.pinchReleaseCount = 0;
      }
    }

    this.dispatchEvent("gestureupdate", {
      type:      "pinch",
      value:     normalizedDist,
      active:    this.isPinching,
      threshold: this.pinchThreshold,
      velocity:  this.handVelocity
    });
  }

  // =========================================================================
  // Gesture: Depth-tap / push-forward click
  // =========================================================================

  /**
   * Detects a forward Z-push (touching the projection surface).
   *
   * Instead of raw tip-to-knuckle Euclidean distance, we:
   *   1. Measure the hand's palm normal (wrist → middle finger MCP direction in Z)
   *   2. Project the index fingertip's Z offset along that normal
   *   3. Apply the optional distanceFromScreen scale correction
   *
   * This makes depth clicks feel the same whether the user is close or far.
   */
  evaluateDepthClick(lm, handScale) {
    const indexTip = lm[8];
    const indexMCP = lm[5];
    const middleMCP = lm[9];
    const wrist = lm[0];

    // MediaPipe's z axis is noisy and camera-relative. Use a blended signal:
    // tip-to-knuckle z extension plus fingertip extension against the palm center.
    // In MediaPipe Hands, values usually become more negative as a point moves
    // closer to the camera, so invert the deltas to make "forward push" positive.
    const palmCenterZ = (wrist.z + indexMCP.z + middleMCP.z) / 3;
    const fingerDepth = (indexMCP.z - indexTip.z) / (handScale || 0.01);
    const palmDepth = (palmCenterZ - indexTip.z) / (handScale || 0.01);
    const rawDepthNorm = fingerDepth * 0.65 + palmDepth * 0.35;

    if (this.depthBaseline === null || !Number.isFinite(this.depthBaseline)) {
      this.depthBaseline = rawDepthNorm;
    } else if (!this.isDepthClicking && this.handVelocity < 0.20) {
      // Slow baseline drift handles lighting/camera shifts without eating pushes.
      this.depthBaseline = this.depthBaseline * 0.985 + rawDepthNorm * 0.015;
    }

    const depthNorm = rawDepthNorm - this.depthBaseline;
    this.depthSmoothed = this.depthSmoothed * 0.65 + depthNorm * 0.35;

    // Optional distance-from-screen scaling:
    // Further away → Z changes feel smaller → lower effective threshold
    const distScale = this.distanceFromScreen
      ? (this.referenceDistance / this.distanceFromScreen)
      : 1.0;

    const adjustedThreshold = this.depthTapThreshold * distScale;
    const releaseThreshold = adjustedThreshold * 0.55;

    if (!this.isDepthClicking) {
      if (this.depthSmoothed > adjustedThreshold && this.handVelocity < 0.75) {
        this.depthFrameCount++;
      } else {
        this.depthFrameCount = 0;
      }

      if (this.depthFrameCount >= 2) {
        this.depthFrameCount = 0;
        this.isDepthClicking = true;
        this.triggerDepthClickDown();
      }
    } else {
      if (this.depthSmoothed < releaseThreshold) {
        this.depthReleaseCount++;
      } else {
        this.depthReleaseCount = 0;
      }

      if (this.depthReleaseCount >= 2) {
        this.depthReleaseCount = 0;
        this.triggerDepthClickRelease();
      }
    }

    this.dispatchEvent("gestureupdate", {
      type:            "depth",
      value:           this.depthSmoothed,
      active:          this.isDepthClicking,
      threshold:       adjustedThreshold,
      distanceScale:   distScale
    });
  }

  // =========================================================================
  // Gesture: Hover Dwell
  // =========================================================================

  evaluateDwell(rawX, rawY) {
    const pxX = rawX * window.innerWidth;
    const pxY = rawY * window.innerHeight;

    if (!this.isDwellTicking) {
      this.isDwellTicking   = true;
      this.dwellStartTime   = performance.now();
      this.dwellAnchorPoint = { x: pxX, y: pxY };
      this.dwellTriggered   = false;
    } else {
      const dx   = pxX - this.dwellAnchorPoint.x;
      const dy   = pxY - this.dwellAnchorPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > this.dwellRadius) {
        this.dwellStartTime   = performance.now();
        this.dwellAnchorPoint = { x: pxX, y: pxY };
        this.dwellTriggered   = false;
        this.dispatchEvent("dwellprogress", { progress: 0 });
      } else {
        const timePassed = performance.now() - this.dwellStartTime;
        const progress   = Math.min(1.0, timePassed / this.dwellDuration);
        this.dispatchEvent("dwellprogress", { progress });

        if (progress >= 1.0 && !this.dwellTriggered) {
          this.dwellTriggered = true;
          this.triggerClickDown("dwell");
          setTimeout(() => {
            this.triggerClickRelease("dwell");
            this.cancelDwell();
          }, 150);
        }
      }
    }
  }

  cancelDwell() {
    this.isDwellTicking = false;
    this.dwellTriggered = false;
    this.dispatchEvent("dwellprogress", { progress: 0 });
  }

  // =========================================================================
  // Depth calibration
  // =========================================================================

  calibrateTouchDepth() {
    if (!this.lastLandmarks) {
      throw new Error("No hand detected. Please place your hand in front of the camera.");
    }
    const lm       = this.lastLandmarks;
    const handScale = this.get3DDistance(lm[0], lm[9]) || 0.01;
    const palmCenterZ = (lm[0].z + lm[5].z + lm[9].z) / 3;
    const fingerDepth = (lm[5].z - lm[8].z) / handScale;
    const palmDepth = (palmCenterZ - lm[8].z) / handScale;
    const depthNorm = fingerDepth * 0.65 + palmDepth * 0.35;

    this.depthBaseline = 0;
    this.depthSmoothed = 0;
    this.depthTapThreshold = Math.max(0.035, depthNorm * 0.72);
    return this.depthTapThreshold;
  }

  // =========================================================================
  // Utility
  // =========================================================================

  get3DDistance(p1, p2) {
    return Math.sqrt(
      (p1.x - p2.x) ** 2 +
      (p1.y - p2.y) ** 2 +
      (p1.z - p2.z) ** 2
    );
  }

  /**
   * Update the optional physical distance from screen (in cm) at runtime.
   */
  setDistanceFromScreen(cm) {
    this.distanceFromScreen = cm > 0 ? cm : null;
  }

  triggerClickDown(source) {
    this.dispatchEvent("wallclickdown", { source });
  }

  triggerClickRelease(source = "pinch") {
    this.isPinching = false;
    this.dispatchEvent("wallclickup", { source });
  }

  triggerDepthClickDown() {
    this.dispatchEvent("wallclickdown", { source: "depth" });
  }

  triggerDepthClickRelease() {
    this.isDepthClicking = false;
    this.dispatchEvent("wallclickup", { source: "depth" });
  }

  dispatchEvent(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

// Export
if (typeof module !== "undefined" && module.exports) {
  module.exports = { TouchWallTracker };
} else {
  window.TouchWallTracker = TouchWallTracker;
}
