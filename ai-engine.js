/**
 * TouchWall AI Engine
 * Includes AI Shape Assist (Offline Stroke Beautification) 
 * and AI Magic Sketch Copilot (Procedural Vector Drawing)
 */

class ShapeClassifier {
  /**
   * Evaluates a drawn stroke (array of points) and attempts to beautify it 
   * into a perfect geometric shape (circle, square, triangle, line, arrow).
   * Returns the beautified shape data or null if it's too messy.
   */
  static classifyAndBeautify(points) {
    if (points.length < 10) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let totalLength = 0;
    
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
      
      if (i > 0) {
        const prev = points[i-1];
        totalLength += Math.sqrt(Math.pow(p.x - prev.x, 2) + Math.pow(p.y - prev.y, 2));
      }
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const boundingBoxPerimeter = (width + height) * 2;
    const boundingBoxArea = width * height;
    const strokeAreaRatio = totalLength / (boundingBoxPerimeter + 0.01);
    
    const startP = points[0];
    const endP = points[points.length - 1];
    const startEndDist = Math.sqrt(Math.pow(endP.x - startP.x, 2) + Math.pow(endP.y - startP.y, 2));
    const isClosed = startEndDist < (width + height) * 0.15;

    // Detect and correct straight/intentional lines, including diagonal lines.
    // Uses perpendicular error instead of only bounding-box aspect ratio, so
    // a slightly shaky diagonal stroke still becomes a crisp line.
    const lineFit = this.fitLine(points, startP, endP, totalLength);
    if (lineFit && !isClosed) {
      return lineFit;
    }

    if (isClosed) {
      // Circle detection: Area is close to bounding box area * (PI/4), aspect ratio is ~1
      const aspectRatio = Math.max(width, height) / (Math.min(width, height) + 0.01);
      if (aspectRatio > 0.7 && aspectRatio < 1.3) {
        // Could be a circle or a square
        if (strokeAreaRatio > 0.75 && strokeAreaRatio < 0.95) {
          return {
            type: 'circle',
            cx: minX + width/2,
            cy: minY + height/2,
            r: (width + height) / 4
          };
        } else if (strokeAreaRatio >= 0.95 && strokeAreaRatio < 1.2) {
          return {
            type: 'rectangle',
            x: minX,
            y: minY,
            w: width,
            h: height
          };
        }
      }
      
      // Rectangle detection
      if (strokeAreaRatio >= 0.9 && strokeAreaRatio < 1.2 && aspectRatio >= 1.3) {
        return {
          type: 'rectangle',
          x: minX,
          y: minY,
          w: width,
          h: height
        };
      }
      
      // Triangle detection
      if (strokeAreaRatio < 0.9 && strokeAreaRatio > 0.6) {
        return {
          type: 'triangle',
          points: [
            {x: minX + width/2, y: minY},
            {x: maxX, y: maxY},
            {x: minX, y: maxY}
          ]
        };
      }
    }

    return null; // Not recognized
  }

  static fitLine(points, startP, endP, totalLength) {
    const dx = endP.x - startP.x;
    const dy = endP.y - startP.y;
    const chord = Math.sqrt(dx * dx + dy * dy);
    if (chord < 28 || totalLength <= 0) return null;

    let maxError = 0;
    let errorSum = 0;
    for (const p of points) {
      const err = Math.abs(dy * p.x - dx * p.y + endP.x * startP.y - endP.y * startP.x) / chord;
      maxError = Math.max(maxError, err);
      errorSum += err;
    }

    const avgError = errorSum / points.length;
    const wobbleRatio = totalLength / chord;
    const straightEnough = avgError < Math.max(5, chord * 0.045) &&
      maxError < Math.max(14, chord * 0.12) &&
      wobbleRatio < 1.45;

    if (!straightEnough) return null;

    const snapped = this.snapLine(startP, endP);
    return {
      type: 'line',
      path: snapped
    };
  }

  static snapLine(startP, endP) {
    const dx = endP.x - startP.x;
    const dy = endP.y - startP.y;
    const angle = Math.atan2(dy, dx);
    const snapStep = Math.PI / 4; // horizontal, vertical, and diagonals
    const snappedAngle = Math.round(angle / snapStep) * snapStep;
    const angleDelta = Math.abs(Math.atan2(Math.sin(angle - snappedAngle), Math.cos(angle - snappedAngle)));

    if (angleDelta > Math.PI / 36) {
      return [{ x: startP.x, y: startP.y }, { x: endP.x, y: endP.y }];
    }

    const length = Math.sqrt(dx * dx + dy * dy);
    const cx = (startP.x + endP.x) / 2;
    const cy = (startP.y + endP.y) / 2;
    const halfX = Math.cos(snappedAngle) * length / 2;
    const halfY = Math.sin(snappedAngle) * length / 2;

    return [
      { x: cx - halfX, y: cy - halfY },
      { x: cx + halfX, y: cy + halfY }
    ];
  }
}

class MagicSketchGenerator {
  /**
   * Generates a predefined vector illustration based on the text prompt
   * Returns an array of paths, where each path is an array of {x, y} coordinates.
   */
  static generateSketch(prompt, canvasWidth, canvasHeight) {
    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;
    const scale = Math.min(canvasWidth, canvasHeight) * 0.3;
    const paths = [];
    
    prompt = prompt.toLowerCase();

    if (prompt.includes("rocket") || prompt.includes("space")) {
      // Draw Rocket
      paths.push(this.makeCircle(cx, cy - scale*0.2, scale*0.2)); // Window
      paths.push([
        {x: cx, y: cy - scale}, 
        {x: cx + scale*0.4, y: cy - scale*0.2},
        {x: cx + scale*0.4, y: cy + scale*0.6},
        {x: cx - scale*0.4, y: cy + scale*0.6},
        {x: cx - scale*0.4, y: cy - scale*0.2},
        {x: cx, y: cy - scale}
      ]); // Body
      paths.push([
        {x: cx - scale*0.4, y: cy + scale*0.2},
        {x: cx - scale*0.8, y: cy + scale*0.8},
        {x: cx - scale*0.4, y: cy + scale*0.6}
      ]); // Left Fin
      paths.push([
        {x: cx + scale*0.4, y: cy + scale*0.2},
        {x: cx + scale*0.8, y: cy + scale*0.8},
        {x: cx + scale*0.4, y: cy + scale*0.6}
      ]); // Right Fin
      paths.push([
        {x: cx - scale*0.2, y: cy + scale*0.6},
        {x: cx, y: cy + scale*1.2},
        {x: cx + scale*0.2, y: cy + scale*0.6}
      ]); // Flame
    } 
    else if (prompt.includes("atom") || prompt.includes("science")) {
      paths.push(this.makeCircle(cx, cy, scale*0.1)); // Nucleus
      paths.push(this.makeEllipse(cx, cy, scale, scale*0.3, 0)); // Orbit 1
      paths.push(this.makeEllipse(cx, cy, scale, scale*0.3, Math.PI / 3)); // Orbit 2
      paths.push(this.makeEllipse(cx, cy, scale, scale*0.3, -Math.PI / 3)); // Orbit 3
    }
    else if (prompt.includes("flowchart") || prompt.includes("architecture")) {
      // Draw a simple flowchart
      paths.push(this.makeRect(cx - scale*0.8, cy - scale*0.8, scale*0.6, scale*0.4));
      paths.push(this.makeRect(cx + scale*0.2, cy - scale*0.8, scale*0.6, scale*0.4));
      paths.push(this.makeRect(cx - scale*0.3, cy + scale*0.2, scale*0.6, scale*0.4));
      
      // Arrows
      paths.push([
        {x: cx - scale*0.5, y: cy - scale*0.4},
        {x: cx - scale*0.5, y: cy - scale*0.1},
        {x: cx, y: cy - scale*0.1},
        {x: cx, y: cy + scale*0.2}
      ]);
      paths.push([
        {x: cx + scale*0.5, y: cy - scale*0.4},
        {x: cx + scale*0.5, y: cy - scale*0.1},
        {x: cx, y: cy - scale*0.1}
      ]);
      paths.push([
        {x: cx - 10, y: cy + scale*0.2 - 10},
        {x: cx, y: cy + scale*0.2},
        {x: cx + 10, y: cy + scale*0.2 - 10}
      ]);
    }
    else {
      // Default: Star
      paths.push([
        {x: cx, y: cy - scale},
        {x: cx + scale*0.3, y: cy - scale*0.3},
        {x: cx + scale, y: cy - scale*0.3},
        {x: cx + scale*0.4, y: cy + scale*0.2},
        {x: cx + scale*0.6, y: cy + scale},
        {x: cx, y: cy + scale*0.5},
        {x: cx - scale*0.6, y: cy + scale},
        {x: cx - scale*0.4, y: cy + scale*0.2},
        {x: cx - scale, y: cy - scale*0.3},
        {x: cx - scale*0.3, y: cy - scale*0.3},
        {x: cx, y: cy - scale}
      ]);
    }

    return paths;
  }

  static makeCircle(cx, cy, r) {
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      pts.push({ x: cx + Math.cos(angle)*r, y: cy + Math.sin(angle)*r });
    }
    return pts;
  }
  
  static makeEllipse(cx, cy, rx, ry, rotation) {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const x = Math.cos(angle)*rx;
      const y = Math.sin(angle)*ry;
      const rotX = cx + x * Math.cos(rotation) - y * Math.sin(rotation);
      const rotY = cy + x * Math.sin(rotation) + y * Math.cos(rotation);
      pts.push({ x: rotX, y: rotY });
    }
    return pts;
  }
  
  static makeRect(x, y, w, h) {
    return [
      {x: x, y: y},
      {x: x+w, y: y},
      {x: x+w, y: y+h},
      {x: x, y: y+h},
      {x: x, y: y}
    ];
  }
}

class OllamaGenerativeAI {
  /**
   * Fetches SVG from local Ollama and parses it into coordinates.
   */
  static async fetchAndParse(prompt, canvasWidth, canvasHeight, model = "llama3") {
    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model,
          prompt: `You are an expert SVG generator. Generate a simple, minimalist, single-color continuous SVG illustration of: ${prompt}. 
ONLY output the raw <svg> code containing <path> elements. Do NOT output any markdown blocks (like \`\`\`svg), text, or explanations. Just the raw XML. Make sure the viewBox is 0 0 100 100.`,
          stream: false
        })
      });

      if (!response.ok) throw new Error("Ollama endpoint not accessible or returned error.");
      const data = await response.json();
      const rawSvg = data.response;

      return this.parseSVGToPaths(rawSvg, canvasWidth, canvasHeight);
    } catch (e) {
      console.warn("Ollama AI Generator failed or not reachable. Falling back to procedural sketches. Error:", e);
      return null;
    }
  }

  static parseSVGToPaths(svgString, canvasWidth, canvasHeight) {
    // Strip out markdown if the LLM leaked it
    const cleanSvg = svgString.replace(/```xml|```svg|```/g, "").trim();
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanSvg, "image/svg+xml");
    
    // Find all paths
    const pathNodes = doc.querySelectorAll("path");
    if (pathNodes.length === 0) return null;

    const paths = [];
    const scale = Math.min(canvasWidth, canvasHeight) * 0.005; 
    // Assuming viewBox 100x100, so scale by 0.005 gets roughly half the canvas size
    const offsetX = canvasWidth / 2 - (50 * scale);
    const offsetY = canvasHeight / 2 - (50 * scale);

    // We attach an invisible SVG to the DOM to ensure getPointAtLength works
    const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    tempSvg.style.display = "none";
    document.body.appendChild(tempSvg);

    for (const pathNode of pathNodes) {
      const clonedPath = pathNode.cloneNode(true);
      tempSvg.appendChild(clonedPath);
      
      const length = clonedPath.getTotalLength();
      if (length === 0) continue;

      const pts = [];
      const numSamples = Math.max(20, Math.floor(length / 2)); // sample every 2 units roughly
      
      for (let i = 0; i <= numSamples; i++) {
        const pt = clonedPath.getPointAtLength((i / numSamples) * length);
        pts.push({
          x: pt.x * scale + offsetX,
          y: pt.y * scale + offsetY
        });
      }
      
      if (pts.length > 0) {
        paths.push(pts);
      }
    }
    
    document.body.removeChild(tempSvg);
    return paths.length > 0 ? paths : null;
  }
}

class LocalOllamaAssistant {
  static async generateText(prompt, mode = "answer", model = "llama3") {
    const systemPrompt = mode === "definition"
      ? `Give a concise, classroom-friendly definition and 2-3 key points for: ${prompt}`
      : `Answer this clearly and concisely for a whiteboard. Use short lines and no markdown tables: ${prompt}`;

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: systemPrompt,
          stream: false
        })
      });
      if (!response.ok) throw new Error("Ollama endpoint not accessible or returned error.");
      const data = await response.json();
      return (data.response || "").replace(/```[\s\S]*?```/g, "").trim();
    } catch (e) {
      console.warn("Local Ollama text generation failed. Using offline fallback. Error:", e);
      return this.fallbackText(prompt, mode);
    }
  }

  static async generateFlowchart(prompt, model = "llama3") {
    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: `Create a simple flowchart for: ${prompt}
Return ONLY valid JSON in this exact format:
{"title":"Short title","steps":["Step 1","Step 2","Step 3","Step 4"]}
Use 3 to 6 short steps. No markdown.`,
          stream: false
        })
      });
      if (!response.ok) throw new Error("Ollama endpoint not accessible or returned error.");
      const data = await response.json();
      const raw = (data.response || "").trim();
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}");
      if (jsonStart < 0 || jsonEnd < jsonStart) throw new Error("No JSON object in model response.");
      const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
      return {
        title: String(parsed.title || "Flowchart").slice(0, 64),
        steps: Array.isArray(parsed.steps) ? parsed.steps.map(s => String(s).slice(0, 80)).slice(0, 6) : []
      };
    } catch (e) {
      console.warn("Local Ollama flowchart generation failed. Using offline fallback. Error:", e);
      return this.fallbackFlowchart(prompt);
    }
  }

  static fallbackText(prompt, mode) {
    const clean = String(prompt || "this topic").trim();
    if (mode === "definition") {
      return `${clean}\n\nDefinition: a key idea or process to explain on the board.\n\nKey points:\n- What it is\n- Why it matters\n- A simple example`;
    }
    return `${clean}\n\nLocal AI is not running, so I made a starter note:\n- Break the topic into parts\n- Add the main facts or steps\n- Use the flowchart tool for process-style answers`;
  }

  static fallbackFlowchart(prompt) {
    const clean = String(prompt || "Process").trim();
    return {
      title: clean.slice(0, 64),
      steps: ["Start", "Identify the goal", "Process the information", "Check the result", "Finish"]
    };
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ShapeClassifier, MagicSketchGenerator, OllamaGenerativeAI, LocalOllamaAssistant };
} else {
  window.ShapeClassifier = ShapeClassifier;
  window.MagicSketchGenerator = MagicSketchGenerator;
  window.OllamaGenerativeAI = OllamaGenerativeAI;
  window.LocalOllamaAssistant = LocalOllamaAssistant;
}
