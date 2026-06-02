/**
 * TouchWall Mathematics Module
 * Handles Homography perspective projection solving and coordinate smoothing filters.
 */

class TouchWallMath {
  /**
   * Solves system of linear equations Ax = B using Gaussian Elimination with partial pivoting.
   * @param {number[][]} A - Coefficients matrix (NxN)
   * @param {number[]} B - Right-hand side vector (N)
   * @returns {number[]} Solutions vector x
   */
  static solveGaussian(A, B) {
    const n = B.length;
    
    // Deep copy matrix and vector to prevent side effects
    const a = A.map(row => [...row]);
    const b = [...B];

    for (let i = 0; i < n; i++) {
      // Find pivot row
      let maxEl = Math.abs(a[i][i]);
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(a[k][i]) > maxEl) {
          maxEl = Math.abs(a[k][i]);
          maxRow = k;
        }
      }

      // Swap maximum row with current row (pivoting)
      if (maxRow !== i) {
        const tempRow = a[i];
        a[i] = a[maxRow];
        a[maxRow] = tempRow;
        
        const tempB = b[i];
        b[i] = b[maxRow];
        b[maxRow] = tempB;
      }

      // Check for singular matrix
      if (Math.abs(a[i][i]) < 1e-12) {
        throw new Error("Matrix is singular or nearly singular (points are likely collinear).");
      }

      // Pivot row elimination
      for (let k = i + 1; k < n; k++) {
        const factor = -a[k][i] / a[i][i];
        for (let j = i; j < n; j++) {
          if (i === j) {
            a[k][j] = 0;
          } else {
            a[k][j] += factor * a[i][j];
          }
        }
        b[k] += factor * b[i];
      }
    }

    // Back substitution
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = b[i] / a[i][i];
      for (let k = i - 1; k >= 0; k--) {
        b[k] -= a[k][i] * x[i];
      }
    }
    return x;
  }

  /**
   * Computes the 3x3 homography matrix that maps coordinates from src points to dst points.
   * Both src and dst should be arrays of 4 objects containing {x, y}.
   * Order: Top-Left (0), Top-Right (1), Bottom-Right (2), Bottom-Left (3)
   * @param {Array<{x:number, y:number}>} src - Points in source space (e.g., Camera coords normalized 0-1)
   * @param {Array<{x:number, y:number}>} dst - Points in destination space (e.g., Projector Screen pixel coords)
   * @returns {number[]} Flattened 3x3 Homography Matrix (9 elements, where last is 1.0)
   */
  static getHomography(src, dst) {
    if (src.length !== 4 || dst.length !== 4) {
      throw new Error("Exactly 4 point correspondences are required for perspective homography.");
    }

    const A = [];
    const B = [];

    for (let i = 0; i < 4; i++) {
      const sx = src[i].x;
      const sy = src[i].y;
      const dx = dst[i].x;
      const dy = dst[i].y;

      // Row 1 for point i
      A.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx]);
      B.push(dx);

      // Row 2 for point i
      A.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy]);
      B.push(dy);
    }

    // Solve for h0 through h7
    const h = this.solveGaussian(A, B);
    
    // Homography matrix is [h0, h1, h2, h3, h4, h5, h6, h7, 1.0]
    return [...h, 1.0];
  }

  /**
   * Projects a single 2D point using a 3x3 homography matrix.
   * @param {number} x - Source x coordinate
   * @param {number} y - Source y coordinate
   * @param {number[]} H - 9-element homography matrix
   * @returns {{x: number, y: number}} Projected point coordinates
   */
  static projectPoint(x, y, H) {
    if (!H || H.length !== 9) {
      return { x, y }; // Return identical point if no calibration is loaded
    }

    const w = H[6] * x + H[7] * y + H[8];
    
    // Guard against division by zero
    if (Math.abs(w) < 1e-10) {
      return { x: 0, y: 0 };
    }

    const px = (H[0] * x + H[1] * y + H[2]) / w;
    const py = (H[3] * x + H[4] * y + H[5]) / w;

    return { x: px, y: py };
  }

  static bilinearPoint(tl, tr, br, bl, u, v) {
    const topX = tl.x + (tr.x - tl.x) * u;
    const topY = tl.y + (tr.y - tl.y) * u;
    const bottomX = bl.x + (br.x - bl.x) * u;
    const bottomY = bl.y + (br.y - bl.y) * u;
    return {
      x: topX + (bottomX - topX) * v,
      y: topY + (bottomY - topY) * v
    };
  }

  static inverseBilinear(point, tl, tr, br, bl) {
    let u = 0.5;
    let v = 0.5;

    for (let i = 0; i < 12; i++) {
      const mapped = this.bilinearPoint(tl, tr, br, bl, u, v);
      const fx = mapped.x - point.x;
      const fy = mapped.y - point.y;
      if (Math.abs(fx) + Math.abs(fy) < 1e-6) break;

      const du = {
        x: (tr.x - tl.x) * (1 - v) + (br.x - bl.x) * v,
        y: (tr.y - tl.y) * (1 - v) + (br.y - bl.y) * v
      };
      const dv = {
        x: (bl.x - tl.x) * (1 - u) + (br.x - tr.x) * u,
        y: (bl.y - tl.y) * (1 - u) + (br.y - tr.y) * u
      };

      const det = du.x * dv.y - du.y * dv.x;
      if (Math.abs(det) < 1e-9) break;

      const stepU = (fx * dv.y - fy * dv.x) / det;
      const stepV = (du.x * fy - du.y * fx) / det;
      u = Math.max(0, Math.min(1, u - stepU));
      v = Math.max(0, Math.min(1, v - stepV));
    }

    return { u, v };
  }

  static createGridMapper(srcCorners, dstCorners, divisions = 8) {
    if (srcCorners.length !== 4 || dstCorners.length !== 4) {
      throw new Error("Exactly 4 source and destination corners are required for grid mapping.");
    }

    const gridSize = Math.max(2, Math.min(32, Math.round(divisions)));
    const srcGrid = [];
    const dstGrid = [];

    for (let row = 0; row <= gridSize; row++) {
      const v = row / gridSize;
      const srcRow = [];
      const dstRow = [];
      for (let col = 0; col <= gridSize; col++) {
        const u = col / gridSize;
        srcRow.push(this.bilinearPoint(srcCorners[0], srcCorners[1], srcCorners[2], srcCorners[3], u, v));
        dstRow.push(this.bilinearPoint(dstCorners[0], dstCorners[1], dstCorners[2], dstCorners[3], u, v));
      }
      srcGrid.push(srcRow);
      dstGrid.push(dstRow);
    }

    return {
      divisions: gridSize,
      srcCorners,
      dstCorners,
      srcGrid,
      dstGrid,
      angleProfile: this.estimateCameraAngleProfile(srcCorners)
    };
  }

  static estimateCameraAngleProfile(corners) {
    const [tl, tr, br, bl] = corners;
    const center = this.bilinearPoint(tl, tr, br, bl, 0.5, 0.5);
    const topMid = { x: (tl.x + tr.x) / 2, y: (tl.y + tr.y) / 2 };
    const bottomMid = { x: (bl.x + br.x) / 2, y: (bl.y + br.y) / 2 };
    const leftMid = { x: (tl.x + bl.x) / 2, y: (tl.y + bl.y) / 2 };
    const rightMid = { x: (tr.x + br.x) / 2, y: (tr.y + br.y) / 2 };

    const topWidth = this.distance(tl, tr);
    const bottomWidth = this.distance(bl, br);
    const leftHeight = this.distance(tl, bl);
    const rightHeight = this.distance(tr, br);

    const verticalLean = bottomMid.x - topMid.x;
    const horizontalLean = rightMid.y - leftMid.y;
    const yaw = (leftHeight - rightHeight) / (leftHeight + rightHeight + 1e-6);
    const pitch = (topWidth - bottomWidth) / (topWidth + bottomWidth + 1e-6);

    // Normalized drift vector in camera coordinates. This estimates which way
    // a fingertip appears to slide when it is in front of the calibrated plane.
    const driftX = verticalLean * 0.70 + yaw * 0.18;
    const driftY = horizontalLean * 0.70 + pitch * 0.18;
    const horizontalVp = this.lineIntersection(tl, tr, bl, br);
    const verticalVp = this.lineIntersection(tl, bl, tr, br);
    const vanishingDrift = this.estimateVanishingDrift(center, horizontalVp, verticalVp, yaw, pitch);

    return {
      driftX,
      driftY,
      yaw,
      pitch,
      angleXDeg: Math.atan(yaw) * 180 / Math.PI,
      angleYDeg: Math.atan(pitch) * 180 / Math.PI,
      center,
      horizontalVp,
      verticalVp,
      vanishingDrift
    };
  }

  static distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  static lineIntersection(a, b, c, d) {
    const a1 = b.y - a.y;
    const b1 = a.x - b.x;
    const c1 = a1 * a.x + b1 * a.y;

    const a2 = d.y - c.y;
    const b2 = c.x - d.x;
    const c2 = a2 * c.x + b2 * c.y;

    const det = a1 * b2 - a2 * b1;
    if (Math.abs(det) < 1e-9) return null;

    return {
      x: (b2 * c1 - b1 * c2) / det,
      y: (a1 * c2 - a2 * c1) / det
    };
  }

  static estimateVanishingDrift(center, horizontalVp, verticalVp, yaw, pitch) {
    let x = 0;
    let y = 0;

    if (horizontalVp && Number.isFinite(horizontalVp.x) && Number.isFinite(horizontalVp.y)) {
      const vx = horizontalVp.x - center.x;
      const vy = horizontalVp.y - center.y;
      const len = Math.sqrt(vx * vx + vy * vy) || 1;
      x += (vx / len) * Math.min(0.35, Math.abs(yaw) * 1.8);
      y += (vy / len) * Math.min(0.35, Math.abs(yaw) * 1.8);
    }

    if (verticalVp && Number.isFinite(verticalVp.x) && Number.isFinite(verticalVp.y)) {
      const vx = verticalVp.x - center.x;
      const vy = verticalVp.y - center.y;
      const len = Math.sqrt(vx * vx + vy * vy) || 1;
      x += (vx / len) * Math.min(0.35, Math.abs(pitch) * 1.8);
      y += (vy / len) * Math.min(0.35, Math.abs(pitch) * 1.8);
    }

    return { x, y };
  }

  static compensateAngleDrift(x, y, depthSignal, mapper, strength = 0.35) {
    if (!mapper || !mapper.angleProfile || !Number.isFinite(depthSignal)) {
      return { x, y };
    }

    const profile = mapper.angleProfile;
    const depth = Math.max(-0.35, Math.min(0.35, depthSignal));
    const gain = Math.max(-2, Math.min(2, strength));
    const radialX = x - profile.center.x;
    const radialY = y - profile.center.y;
    const radialScale = Math.min(1, Math.sqrt(radialX * radialX + radialY * radialY) * 3.0);
    const driftX = profile.vanishingDrift.x + profile.driftX * radialScale;
    const driftY = profile.vanishingDrift.y + profile.driftY * radialScale;

    return {
      x: Math.max(0, Math.min(1, x - driftX * depth * gain)),
      y: Math.max(0, Math.min(1, y - driftY * depth * gain))
    };
  }

  static projectPointGrid(x, y, mapper) {
    if (!mapper) return { x, y, u: x, v: y };

    const uv = this.inverseBilinear(
      { x, y },
      mapper.srcCorners[0],
      mapper.srcCorners[1],
      mapper.srcCorners[2],
      mapper.srcCorners[3]
    );

    const scaledU = uv.u * mapper.divisions;
    const scaledV = uv.v * mapper.divisions;
    const col = Math.min(mapper.divisions - 1, Math.max(0, Math.floor(scaledU)));
    const row = Math.min(mapper.divisions - 1, Math.max(0, Math.floor(scaledV)));
    const localU = scaledU - col;
    const localV = scaledV - row;

    const dstCell = {
      tl: mapper.dstGrid[row][col],
      tr: mapper.dstGrid[row][col + 1],
      br: mapper.dstGrid[row + 1][col + 1],
      bl: mapper.dstGrid[row + 1][col]
    };
    const projected = this.bilinearPoint(dstCell.tl, dstCell.tr, dstCell.br, dstCell.bl, localU, localV);

    return {
      x: projected.x,
      y: projected.y,
      u: uv.u,
      v: uv.v,
      row,
      col
    };
  }
}

/**
 * Double Exponential Smoothing Filter (Holt's Linear Trend Filter)
 * Designed to remove high-frequency hand tremors while maintaining excellent responsiveness during rapid movements.
 */
class DoubleExponentialFilter {
  /**
   * Create a filter instance
   * @param {number} alpha - Data smoothing factor [0-1]. Lower = smoother, higher = lower latency.
   * @param {number} beta - Trend smoothing factor [0-1]. Controls reactivity to velocity/inertia.
   */
  constructor(alpha = 0.35, beta = 0.15) {
    this.alpha = alpha;
    this.beta = beta;
    this.reset();
  }

  reset() {
    this.initialized = false;
    this.sX = 0; // Smoothed level X
    this.sY = 0; // Smoothed level Y
    this.bX = 0; // Smoothed trend X
    this.bY = 0; // Smoothed trend Y
  }

  /**
   * Filter and smooth an incoming coordinate point.
   * @param {number} x - Raw X input
   * @param {number} y - Raw Y input
   * @returns {{x: number, y: number}} Smoothed output coordinates
   */
  filter(x, y) {
    if (!this.initialized) {
      this.sX = x;
      this.sY = y;
      this.bX = 0;
      this.bY = 0;
      this.initialized = true;
      return { x, y };
    }

    const prevSX = this.sX;
    const prevSY = this.sY;

    // 1. Smooth the level (current state estimation)
    this.sX = this.alpha * x + (1 - this.alpha) * (prevSX + this.bX);
    this.sY = this.alpha * y + (1 - this.alpha) * (prevSY + this.bY);

    // 2. Smooth the trend (velocity estimation)
    this.bX = this.beta * (this.sX - prevSX) + (1 - this.beta) * this.bX;
    this.bY = this.beta * (this.sY - prevSY) + (1 - this.beta) * this.bY;

    // The output is the smoothed level plus the immediate trend/velocity
    return {
      x: this.sX + this.bX,
      y: this.sY + this.bY
    };
  }

  updateSettings(alpha, beta) {
    this.alpha = Math.max(0, Math.min(1, alpha));
    this.beta = Math.max(0, Math.min(1, beta));
  }
}

/**
 * One Euro Filter
 * A state-of-the-art adaptive filter designed specifically for high-accuracy human interaction.
 * Lowers latency during fast hand movements (dynamically increasing alpha to 1.0) and
 * maximizes smoothing during stationary hovers (dynamic low alpha), keeping the cursor perfectly under the hand.
 */
class OneEuroFilter {
  constructor(minCutoff = 0.8, beta = 0.05, dCutoff = 1.0) {
    this.minCutoff = minCutoff; // lower = smoother when slow
    this.beta = beta;           // higher = faster catch-up when moving
    this.dCutoff = dCutoff;     // smoothing of raw derivative speed
    this.reset();
  }

  reset() {
    this.initialized = false;
    this.xPrev = 0;
    this.yPrev = 0;
    this.dxPrev = 0;
    this.dyPrev = 0;
  }

  filter(x, y, dt = 0.016) {
    if (!this.initialized) {
      this.xPrev = x;
      this.yPrev = y;
      this.dxPrev = 0;
      this.dyPrev = 0;
      this.initialized = true;
      return { x, y };
    }

    // Calculate derivatives (instant speed)
    const dx = (x - this.xPrev) / dt;
    const dy = (y - this.yPrev) / dt;

    // Smooth speed using low pass filter
    const alphaD = 1 / (1 + (1 / (2 * Math.PI * this.dCutoff * dt)));
    const dxSmoothed = alphaD * dx + (1 - alphaD) * this.dxPrev;
    const dySmoothed = alphaD * dy + (1 - alphaD) * this.dyPrev;
    this.dxPrev = dxSmoothed;
    this.dyPrev = dySmoothed;

    const speed = Math.sqrt(dxSmoothed * dxSmoothed + dySmoothed * dySmoothed);

    // Compute adaptive cutoffs and alphas
    const cutoffX = this.minCutoff + this.beta * speed;
    const alpha = 1 / (1 + (1 / (2 * Math.PI * cutoffX * dt)));

    // Filter signals
    const xFiltered = alpha * x + (1 - alpha) * this.xPrev;
    const yFiltered = alpha * y + (1 - alpha) * this.yPrev;

    this.xPrev = xFiltered;
    this.yPrev = yFiltered;

    return { x: xFiltered, y: yFiltered };
  }

  updateSettings(minCutoff, beta) {
    this.minCutoff = Math.max(0.01, minCutoff);
    this.beta = Math.max(0.0001, beta);
  }
}

/**
 * One Euro Filter (1-Dimensional)
 * Same adaptive algorithm as OneEuroFilter but operates on a single scalar value.
 * Used to independently filter each landmark's x, y, and z coordinates.
 */
class OneEuroFilter1D {
  /**
   * @param {number} minCutoff - Minimum cutoff frequency. Lower = smoother when stationary.
   * @param {number} beta      - Speed coefficient. Higher = lower latency when moving fast.
   * @param {number} dCutoff  - Cutoff for derivative filter.
   */
  constructor(minCutoff = 1.5, beta = 0.1, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta      = beta;
    this.dCutoff   = dCutoff;
    this.prev      = null;
    this.dPrev     = 0;
  }

  reset() {
    this.prev  = null;
    this.dPrev = 0;
  }

  /**
   * Filter a single value.
   * @param {number} x  - New raw input.
   * @param {number} dt - Time delta in seconds since last frame (default 1/60s).
   * @returns {number} Smoothed value.
   */
  filter(x, dt = 0.016) {
    if (this.prev === null) {
      this.prev = x;
      return x;
    }

    // First-order derivative
    const dx       = (x - this.prev) / dt;
    const alphaD   = this._alpha(this.dCutoff, dt);
    const dSmooth  = alphaD * dx + (1 - alphaD) * this.dPrev;
    this.dPrev     = dSmooth;

    // Adaptive cutoff based on speed
    const speed  = Math.abs(dSmooth);
    const cutoff = this.minCutoff + this.beta * speed;
    const alpha  = this._alpha(cutoff, dt);

    const result = alpha * x + (1 - alpha) * this.prev;
    this.prev = result;
    return result;
  }

  _alpha(cutoff, dt) {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }
}

// Export modules for web application usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = { TouchWallMath, DoubleExponentialFilter, OneEuroFilter, OneEuroFilter1D };
} else {
  window.TouchWallMath = TouchWallMath;
  window.DoubleExponentialFilter = DoubleExponentialFilter;
  window.OneEuroFilter = OneEuroFilter;
  window.OneEuroFilter1D = OneEuroFilter1D;
}
