const pptxgen = require("/Users/rajivkhanna/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs");
const path = require("path");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "CogniPlay Studio";
pptx.company = "CogniPlay Studio";
pptx.subject = "Rubric-aligned project presentation";
pptx.title = "CogniPlay Studio - AI Smart Learning Wall";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-US"
};
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";
pptx.margin = 0;

const C = {
  ink: "142018",
  muted: "5D6F66",
  pale: "F5FBF7",
  cream: "FFFDF7",
  white: "FFFFFF",
  line: "D9E3DC",
  green: "0B8F5A",
  green2: "00C47A",
  amber: "D28A00",
  blue: "2563EB",
  rose: "D94662",
  dark: "111915",
  soft: "EDF9F2"
};

const root = "/Users/rajivkhanna/Downloads/NeoTouch";
const img = (name) => path.join(root, "pdf_extracted_images", name);
const out = path.join(root, "CogniPlay_Studio_Rubric_Submission_Deck.pptx");

function addBg(slide, title, kicker = "", rubric = "") {
  slide.background = { color: C.cream };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: C.green2 }, line: { color: C.green2 } });
  slide.addText(kicker.toUpperCase(), { x: 0.48, y: 0.32, w: 4.8, h: 0.25, fontFace: "Aptos", fontSize: 8.5, bold: true, color: C.green, charSpace: 1.2, margin: 0 });
  slide.addText(title, { x: 0.48, y: 0.62, w: 6.4, h: 0.78, fontFace: "Aptos Display", fontSize: 25, bold: true, color: C.ink, margin: 0, fit: "shrink" });
  slide.addText("CogniPlay Studio | Early Childhood 3-6", { x: 0.48, y: 7.05, w: 4.8, h: 0.22, fontSize: 7.5, color: C.muted, margin: 0 });
  if (rubric) slide.addText(rubric, { x: 10.1, y: 7.05, w: 2.75, h: 0.22, fontSize: 7.5, color: C.muted, align: "right", margin: 0 });
}

function text(slide, value, x, y, w, h, opts = {}) {
  slide.addText(value, {
    x, y, w, h,
    fontFace: opts.fontFace || "Aptos",
    fontSize: opts.fontSize || 12,
    bold: opts.bold || false,
    italic: opts.italic || false,
    color: opts.color || C.ink,
    breakLine: opts.breakLine || false,
    margin: opts.margin ?? 0.05,
    fit: opts.fit || "shrink",
    valign: opts.valign || "top",
    align: opts.align || "left",
    bullet: opts.bullet,
    paraSpaceAfterPt: opts.paraSpaceAfterPt
  });
}

function image(slide, file, x, y, w, h, contain = false) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: C.white }, line: { color: C.line, width: 1 } });
  slide.addImage({ path: file, x: x + 0.03, y: y + 0.03, w: w - 0.06, h: h - 0.06 });
}

function card(slide, x, y, w, h, title, body, tone = "green") {
  const accent = tone === "blue" ? C.blue : tone === "amber" ? C.amber : tone === "rose" ? C.rose : C.green;
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.06, fill: { color: C.white }, line: { color: C.line, width: 1 } });
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.06, h, fill: { color: accent }, line: { color: accent } });
  text(slide, title, x + 0.18, y + 0.16, w - 0.3, 0.24, { fontSize: 10, bold: true, color: accent });
  text(slide, body, x + 0.18, y + 0.48, w - 0.3, h - 0.58, { fontSize: 9.5, color: C.muted });
}

function metric(slide, x, y, w, h, value, label, source) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: C.white }, line: { color: C.line, width: 1 } });
  text(slide, value, x + 0.16, y + 0.14, w - 0.3, 0.34, { fontSize: 19, bold: true, color: C.green });
  text(slide, label, x + 0.16, y + 0.56, w - 0.3, 0.36, { fontSize: 9.5, bold: true, color: C.ink });
  text(slide, source, x + 0.16, y + 0.98, w - 0.3, 0.26, { fontSize: 7, color: C.muted });
}

function pill(slide, x, y, label, tone = "green", w = 1.55) {
  const color = tone === "amber" ? C.amber : tone === "blue" ? C.blue : tone === "rose" ? C.rose : C.green;
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.32, rectRadius: 0.06, fill: { color: "FFFFFF", transparency: 5 }, line: { color, width: 1 } });
  text(slide, label, x + 0.08, y + 0.08, w - 0.16, 0.12, { fontSize: 7.3, bold: true, color, align: "center", margin: 0 });
}

function processArrow(slide, x1, y1, x2, y2, label) {
  slide.addShape(pptx.ShapeType.line, { x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: { color: C.green, width: 1.3, beginArrowType: "none", endArrowType: "triangle" } });
  if (label) text(slide, label, (x1 + x2) / 2 - 0.55, (y1 + y2) / 2 - 0.14, 1.1, 0.22, { fontSize: 7.2, color: C.green, align: "center" });
}

function node(slide, x, y, w, h, title, body, tone = "green") {
  const accent = tone === "blue" ? C.blue : tone === "amber" ? C.amber : tone === "rose" ? C.rose : C.green;
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.06, fill: { color: C.white }, line: { color: accent, width: 1.2 } });
  text(slide, title, x + 0.12, y + 0.12, w - 0.24, 0.22, { fontSize: 8.8, bold: true, color: accent, align: "center" });
  text(slide, body, x + 0.12, y + 0.4, w - 0.24, h - 0.46, { fontSize: 7.2, color: C.muted, align: "center" });
}

// 1 Title
{
  const s = pptx.addSlide();
  s.background = { color: C.dark };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: C.green2 }, line: { color: C.green2 } });
  text(s, "CogniPlay Studio", 0.56, 0.82, 5.3, 0.7, { fontFace: "Aptos Display", fontSize: 30, bold: true, color: C.white });
  text(s, "Low-cost AI smart learning wall for play-based early childhood education", 0.56, 1.68, 5.2, 0.82, { fontSize: 16, color: "DDEEE5" });
  text(s, "Challenge: Early Childhood (3-6) | Quality of play-based early learning", 0.56, 2.66, 5.7, 0.32, { fontSize: 10, color: C.green2, bold: true });
  card(s, 0.56, 3.4, 2.55, 1.38, "Hardware", "Good USB webcam + extension cable + existing display/projector/TV.", "green");
  card(s, 3.28, 3.4, 2.55, 1.38, "Core promise", "Any wall becomes a smart board for movement-based play, drawing, and teacher support.", "blue");
  card(s, 6.35, 0.9, 2.65, 1.25, "Built evidence", "CV host, whiteboard, games, recording, parent and teacher dashboard screens.", "green");
  card(s, 9.35, 0.9, 2.65, 1.25, "Truthful scope", "Implemented, semi-implemented, and roadmap features are separated.", "blue");
  card(s, 6.35, 2.65, 2.65, 1.25, "AI stack", "MediaPipe, Ollama llama3, Whisper, IRT, future insights.", "amber");
  card(s, 9.35, 2.65, 2.65, 1.25, "Prototype", "Clickable browser prototype maps all 10 requested features.", "green");
  text(s, "Rubric-aligned deck created from code audit + product evidence", 6.45, 6.15, 5.6, 0.32, { fontSize: 9.5, color: "DDEEE5" });
  text(s, "Prototype: /clickable-prototype/ | Local app: localhost:3000/cogniplay", 6.45, 6.5, 5.9, 0.24, { fontSize: 8.3, color: "A9BDB3" });
}

// 2 Problem
{
  const s = pptx.addSlide();
  addBg(s, "Problem statement and evidence", "Rubric 15% - problem framing", "Problem evidence");
  text(s, "Chosen problem", 0.55, 1.54, 2.4, 0.26, { fontSize: 10, color: C.green, bold: true });
  text(s, "Early childhood settings often struggle to deliver high-quality, developmentally appropriate, play-based learning consistently across contexts.", 0.55, 1.88, 5.8, 0.86, { fontSize: 16, bold: true, color: C.ink });
  card(s, 0.55, 3.0, 2.85, 1.35, "Not just a screen problem", "Frontline workers need simple daily support for playful, guided, locally relevant activities.", "green");
  card(s, 3.62, 3.0, 2.85, 1.35, "Continuity gap", "Parents and educators rarely get plain-language visibility into strengths, growth areas, and next steps.", "amber");
  metric(s, 6.9, 1.55, 2.0, 1.42, "1.37M", "Anganwadi centres", "UNICEF India");
  metric(s, 9.15, 1.55, 2.0, 1.42, "Play", "Core pedagogy", "NCF Foundational Stage 2022");
  metric(s, 11.4, 1.55, 1.65, 1.42, "3-6", "Target ages", "Challenge brief");
  text(s, "Evidence base used in this deck", 6.9, 3.42, 2.4, 0.28, { fontSize: 10, color: C.green, bold: true });
  text(s, "UNICEF India: Anganwadi platform and early childhood learning. NCF Foundational Stage: guided play and learning through play. NIPUN Bharat: foundational learning and educator support. Nurturing Care Framework: early learning as a core developmental input.", 6.9, 3.84, 5.8, 1.3, { fontSize: 11, color: C.muted });
  card(s, 6.9, 5.48, 5.8, 0.82, "Founder framing", "The real need is a low-cost, facilitator-friendly learning surface that supports movement, language, drawing, storytelling, and adaptive play.", "blue");
}

// 3 Target users
{
  const s = pptx.addSlide();
  addBg(s, "Target users and context", "User understanding", "Problem + equity");
  const xs = [0.55, 3.05, 5.55, 8.05, 10.55];
  const titles = ["Children 3-6", "Anganwadi workers", "ECCE educators", "Parents", "Vulnerable learners"];
  const bodies = [
    "Need visual, tactile, forgiving, low-text play.",
    "Need ready-to-use activities without complex setup.",
    "Need consistent content and classroom visibility.",
    "Need plain-language progress and things to try at home.",
    "Need low-cost, local-language, portable continuity."
  ];
  const tones = ["green", "blue", "green", "amber", "rose"];
  titles.forEach((t, i) => card(s, xs[i], 1.5, 2.18, 1.62, t, bodies[i], tones[i]));
  text(s, "Context constraints", 0.55, 3.55, 2.8, 0.3, { fontSize: 12, color: C.green, bold: true });
  const constraints = [
    "Low-resource centres may have a TV/projector but not an interactive board.",
    "Large-group teaching needs wall-scale interaction, not only individual tablets.",
    "Frontline workers need practical facilitation support, not more dashboards.",
    "Multilingual and low-connectivity settings require local-first design.",
    "Insights must be supportive and non-diagnostic."
  ];
  constraints.forEach((b, i) => text(s, b, 0.75, 4.03 + i * 0.38, 5.65, 0.26, { fontSize: 11, color: C.muted, bullet: { type: "bullet" } }));
  image(s, img("page-02-image-01.jpg"), 6.85, 3.42, 5.45, 2.65, true);
  text(s, "Product context: Home World activity selection is already implemented as a calm, playable child entry point.", 6.85, 6.22, 5.4, 0.42, { fontSize: 10, color: C.muted });
}

// 4 Solution overview
{
  const s = pptx.addSlide();
  addBg(s, "Solution overview", "Solution design", "Prototype 15%");
  text(s, "CogniPlay Studio converts existing classroom displays into AI-assisted smart learning walls using only a webcam and software.", 0.55, 1.46, 6.1, 0.82, { fontSize: 18, bold: true });
  const y = 2.7;
  node(s, 0.65, y, 1.68, 1.0, "Webcam", "USB camera captures hand", "green");
  node(s, 2.75, y, 1.68, 1.0, "CV", "MediaPipe hand tracking", "green");
  node(s, 4.85, y, 1.68, 1.0, "Wall", "Calibrated projected surface", "blue");
  node(s, 6.95, y, 1.68, 1.0, "Play", "Puzzles, drawing, whiteboard", "blue");
  node(s, 9.05, y, 1.68, 1.0, "AI", "Teacher support + subtitles", "amber");
  node(s, 11.15, y, 1.68, 1.0, "Insights", "Parent + teacher views", "green");
  [2.33, 4.43, 6.53, 8.63, 10.73].forEach((x) => processArrow(s, x, y + 0.5, x + 0.38, y + 0.5));
  card(s, 0.65, 4.65, 3.1, 1.12, "Built in code", "Hand tracking, calibration, whiteboard, local AI assistant, puzzle loop, adaptive scoring, rewards, dashboards.", "green");
  card(s, 4.05, 4.65, 3.1, 1.12, "Semi-implemented", "OS-wide bridge, live subtitles, recording/cloud workflow, parent/teacher analytics with prototype data.", "amber");
  card(s, 7.45, 4.65, 3.1, 1.12, "Roadmap", "Auth, database, real rosters, cloud sync, multilingual packs, AI recommendations, item calibration.", "blue");
  pill(s, 10.9, 4.72, "Clickable prototype built", "green", 1.8);
  text(s, "Prototype path: /Users/rajivkhanna/Downloads/NeoTouch/clickable-prototype/index.html", 7.45, 5.78, 4.5, 0.24, { fontSize: 7.8, color: C.muted });
}

// 5 Key flows
{
  const s = pptx.addSlide();
  addBg(s, "Key user flows", "Solution design", "Prototype 15%");
  const flows = [
    ["Teacher setup", "Start tracking -> calibrate wall -> launch CogniPlay or whiteboard -> run activity"],
    ["Child play", "Choose world -> drag/trace/match/draw -> get feedback -> earn XP/badges -> next adaptive puzzle"],
    ["Teacher support", "Ask AI on whiteboard -> generate definition/flowchart -> annotate -> record/subtitle session"],
    ["Parent follow-up", "View score, strengths, growth areas, weekly activity, achievements, and home activities"],
    ["Class intervention", "Review heatmap -> flag support needs -> teacher-reviewed recommended actions"]
  ];
  flows.forEach((f, i) => card(s, 0.6, 1.45 + i * 1.02, 5.55, 0.82, f[0], f[1], i % 2 ? "blue" : "green"));
  image(s, img("page-04-image-01.jpg"), 6.6, 1.38, 2.9, 1.65, true);
  image(s, img("page-09-image-01.jpg"), 9.78, 1.38, 2.9, 1.65, true);
  image(s, img("page-18-image-01.jpg"), 6.6, 3.52, 2.9, 1.65, true);
  image(s, img("page-21-image-01.jpg"), 9.78, 3.52, 2.9, 1.65, true);
  text(s, "Evidence screenshots: drag/drop puzzle, AI whiteboard, parent dashboard, and teacher intervention dashboard.", 6.6, 5.56, 5.9, 0.44, { fontSize: 10, color: C.muted });
}

// 6 Why AI
{
  const s = pptx.addSlide();
  addBg(s, "Why AI is necessary", "AI approach", "AI 25%");
  text(s, "Without AI or intelligent adaptation, the product collapses into a projected worksheet or a normal whiteboard.", 0.55, 1.45, 6.1, 0.62, { fontSize: 18, bold: true });
  const rows = [
    ["Teaching support", "Frontline workers still need to manually create explanations, diagrams, and local examples.", "Ollama generates flowcharts, definitions, and Ask AI responses at the whiteboard."],
    ["Inclusion", "Children with hearing barriers or absent children lose continuity.", "Whisper subtitles and caption burn-in support access and review."],
    ["Personalization", "One-size puzzles bore advanced learners and frustrate struggling learners.", "IRT adapts difficulty from attempt history; future AI can generate validated puzzle variants."],
    ["Early support", "Teachers see scores too late or not at all.", "Future AI insights can summarize patterns and suggest teacher-reviewed interventions."]
  ];
  rows.forEach((r, i) => {
    const y = 2.48 + i * 0.86;
    text(s, r[0], 0.7, y, 1.65, 0.28, { fontSize: 10.5, bold: true, color: C.green });
    text(s, r[1], 2.4, y, 3.85, 0.36, { fontSize: 9.2, color: C.muted });
    text(s, r[2], 6.55, y, 5.6, 0.36, { fontSize: 9.2, color: C.ink });
  });
  card(s, 0.7, 6.05, 11.8, 0.58, "Important truth", "Not every intelligent layer is an LLM: hand tracking is computer vision, shape assist is geometry/rules, adaptation is statistical IRT, and content support uses local LLMs.", "amber");
}

// 7 AI methodology
{
  const s = pptx.addSlide();
  addBg(s, "AI methodology: model choice, data, evaluation", "AI technical feasibility", "AI 25%");
  const items = [
    ["Computer vision", "MediaPipe Hands", "Webcam frames; 21 hand landmarks", "Accuracy, latency, false pinch rate, classroom lighting robustness", "Implemented"],
    ["Whiteboard AI", "Ollama llama3", "Teacher prompt text", "Age appropriateness, factuality, useful diagrams, local-language quality", "Mostly built"],
    ["Subtitles", "Whisper / whisper.cpp", "Audio chunks", "Word error rate by language, delay, device performance", "Semi-built"],
    ["Adaptive learning", "3PL IRT + procedural templates", "Attempt correctness, time, hints, retries", "Engagement, difficulty fit, item calibration after pilots", "Built"],
    ["Insights", "Future local/cloud LLM with guardrails", "Aggregated profile and class patterns", "Explainability, teacher acceptance, non-diagnostic safety", "Planned"]
  ];
  const widths = [1.7, 1.8, 2.4, 3.3, 1.1];
  const x0 = 0.48;
  let x = x0;
  ["Layer", "Model", "Data", "Evaluation plan", "Status"].forEach((h, i) => { text(s, h, x, 1.38, widths[i], 0.22, { fontSize: 8.5, bold: true, color: C.green }); x += widths[i] + 0.18; });
  items.forEach((row, r) => {
    x = x0;
    const y = 1.78 + r * 0.82;
    slideRow(s, x0, y - 0.08, 12.15, 0.68, r % 2 === 0 ? "FFFFFF" : "F7FBF8");
    row.forEach((val, i) => { text(s, val, x, y, widths[i], 0.45, { fontSize: 8.2, color: i === 4 ? (val === "Planned" ? C.blue : val.includes("Semi") ? C.amber : C.ink) : C.muted, bold: i === 0 || i === 4 }); x += widths[i] + 0.18; });
  });
  text(s, "Current data posture: local browser state for prototype profiles; real learner data, consent, retention rules, and secure backend are Phase 2.", 0.55, 6.24, 11.6, 0.34, { fontSize: 10, color: C.muted });
}

function slideRow(slide, x, y, w, h, fill) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.03, fill: { color: fill }, line: { color: C.line, transparency: 35 } });
}

// 8 Architecture
{
  const s = pptx.addSlide();
  addBg(s, "System architecture", "High-level diagram", "AI + feasibility");
  node(s, 0.7, 1.35, 1.6, 0.85, "User", "Child / teacher", "green");
  node(s, 2.9, 1.35, 1.8, 0.85, "Display", "Projector / TV", "green");
  node(s, 5.2, 1.35, 1.8, 0.85, "Host shell", "HTML/CSS/JS", "blue");
  node(s, 7.5, 1.35, 1.8, 0.85, "React app", "CogniPlay", "blue");
  node(s, 10.0, 1.35, 1.8, 0.85, "Dashboards", "Parent / teacher", "green");
  processArrow(s, 2.32, 1.78, 2.85, 1.78);
  processArrow(s, 4.72, 1.78, 5.15, 1.78);
  processArrow(s, 7.22, 1.78, 7.45, 1.78);
  processArrow(s, 9.35, 1.78, 9.95, 1.78);
  node(s, 1.55, 3.05, 1.75, 0.9, "Webcam", "USB camera", "green");
  node(s, 3.95, 3.05, 1.95, 0.9, "CV layer", "MediaPipe + filters", "green");
  node(s, 6.35, 3.05, 1.95, 0.9, "Gesture layer", "Pointer / click / drag", "amber");
  node(s, 8.75, 3.05, 1.95, 0.9, "OS bridge", "Python + CoreGraphics", "amber");
  processArrow(s, 3.32, 3.5, 3.9, 3.5);
  processArrow(s, 5.92, 3.5, 6.3, 3.5);
  processArrow(s, 8.32, 3.5, 8.7, 3.5);
  node(s, 1.2, 5.08, 1.75, 0.86, "Local AI", "Ollama llama3", "blue");
  node(s, 3.5, 5.08, 1.75, 0.86, "Speech AI", "Whisper local", "blue");
  node(s, 5.8, 5.08, 1.75, 0.86, "Scoring", "IRT + EMA", "green");
  node(s, 8.1, 5.08, 1.75, 0.86, "Storage", "localStorage now", "amber");
  node(s, 10.4, 5.08, 1.75, 0.86, "Phase 2", "Auth + DB + sync", "rose");
  processArrow(s, 2.98, 5.51, 3.45, 5.51);
  processArrow(s, 5.28, 5.51, 5.75, 5.51);
  processArrow(s, 7.58, 5.51, 8.05, 5.51);
  processArrow(s, 9.88, 5.51, 10.35, 5.51);
  text(s, "Code evidence: app.js, hand-tracker.js, server.js, ai-engine.js, CogniPlay/cogniplay/src/engine, parent/teacher dashboard pages.", 0.7, 6.58, 11.7, 0.28, { fontSize: 9, color: C.muted });
}

// 9 Prototype
{
  const s = pptx.addSlide();
  addBg(s, "Clickable prototype and real product evidence", "Prototype quality", "Prototype 15%");
  image(s, img("page-01-image-01.jpg"), 0.6, 1.38, 3.9, 2.1, true);
  image(s, img("page-08-image-01.jpg"), 4.78, 1.38, 3.9, 2.1, true);
  image(s, img("page-18-image-01.jpg"), 8.96, 1.38, 3.0, 2.1, true);
  image(s, img("page-21-image-01.jpg"), 0.6, 4.08, 3.9, 2.1, true);
  card(s, 4.78, 4.08, 3.9, 1.0, "Clickable prototype", "Browser prototype maps all 10 features, hardware, AI used, implementation status, and code evidence.", "green");
  card(s, 8.96, 4.08, 3.0, 1.0, "Prototype URL", "clickable-prototype/index.html\nLocal server path supported.", "blue");
  text(s, "Quality bar: the prototype is not only slides; it is a clickable feature map that judges can navigate by user journey or by feature.", 4.78, 5.45, 7.1, 0.54, { fontSize: 12, bold: true, color: C.ink });
  text(s, "Evidence shown: CV active shell, whiteboard/AI tools, parent dashboard, teacher mode and intervention UI.", 4.78, 6.13, 7.1, 0.3, { fontSize: 9.5, color: C.muted });
}

// 10 Real world readiness
{
  const s = pptx.addSlide();
  addBg(s, "Real-world readiness", "Offline, low connectivity, devices, languages", "Equity 20%");
  const readiness = [
    ["Offline use", "Host app, whiteboard, procedural puzzles, local profiles, and Ollama/Whisper options can run locally."],
    ["Low connectivity", "Core learning loop should not depend on cloud. Cloud sync becomes optional when available."],
    ["Entry-level devices", "Needs testing on low-end laptops; use small Whisper models, model selection, and fallback modes."],
    ["Regional languages", "Roadmap: Hindi/regional prompts, subtitle models, local examples, parent reports, and content packs."],
    ["Hardware", "Good USB webcam, extension cable, and existing display/projector/TV. No dedicated smartboard required."]
  ];
  readiness.forEach((r, i) => card(s, 0.65 + (i % 2) * 6.15, 1.4 + Math.floor(i / 2) * 1.45, 5.65, 1.08, r[0], r[1], i === 3 ? "amber" : "green"));
  image(s, img("page-10-image-01.jpg"), 6.8, 5.0, 5.25, 1.22, true);
  text(s, "Implementation caveat: live subtitles depend on Whisper/whisper.cpp installation; cloud upload, auth, database, and real rosters are Phase 2.", 0.65, 6.22, 11.3, 0.32, { fontSize: 10, color: C.muted });
}

// 11 Responsible AI
{
  const s = pptx.addSlide();
  addBg(s, "Equity, inclusion, Responsible AI and language", "Responsible AI", "Equity 20%");
  card(s, 0.65, 1.42, 3.0, 1.35, "Inclusion", "Live subtitles, recording review, large shared display, low-text child UI, and future local-language content.", "green");
  card(s, 3.95, 1.42, 3.0, 1.35, "Child data", "Prototype stores learner profile locally. Phase 2 needs consent, retention, deletion, encryption, and role-based access.", "amber");
  card(s, 7.25, 1.42, 3.0, 1.35, "Human review", "Interventions must be teacher-reviewed and non-diagnostic. AI supports educators; it does not label children.", "blue");
  card(s, 10.55, 1.42, 2.25, 1.35, "Language", "Regional language prompts, captions, reports, and content packs are required for scale.", "rose");
  text(s, "Guardrails to implement", 0.65, 3.46, 2.5, 0.3, { fontSize: 12, color: C.green, bold: true });
  const guards = ["Child-safe prompt templates and blocked content categories", "No medical diagnosis or fixed ability labels", "Teacher-facing explanations for recommendations", "Opt-in recording and explicit caregiver/school consent", "Local-first mode with secure cloud sync only when configured", "Bias review across languages, disability, gender, and socio-economic context"];
  guards.forEach((g, i) => text(s, g, 0.95 + (i % 2) * 6.05, 4.0 + Math.floor(i / 2) * 0.55, 5.45, 0.26, { fontSize: 10.5, color: C.muted, bullet: { type: "bullet" } }));
  text(s, "Responsible AI message for judges: CogniPlay uses AI for accessibility, teacher support, and pattern recognition. Decisions remain with adults.", 0.65, 6.45, 11.4, 0.28, { fontSize: 10.5, bold: true, color: C.ink });
}

// 12 Impact
{
  const s = pptx.addSlide();
  addBg(s, "Impact and scale potential", "Innovation + scale", "Impact 10%");
  text(s, "Impact hypothesis", 0.6, 1.45, 2.4, 0.28, { fontSize: 11, bold: true, color: C.green });
  text(s, "If teachers can run engaging play activities with existing classroom hardware, more children can access quality early learning and more adults can see what support each child needs.", 0.6, 1.84, 6.2, 0.86, { fontSize: 17, bold: true });
  const impact = [
    ["Learning quality", "More daily play-based activities: shapes, patterns, memory, counting, tracing, drawing."],
    ["Teacher support", "On-the-spot explanations, flowcharts, subtitles, recording, and dashboard cues."],
    ["Parent continuity", "Plain-language strengths, growth areas, weekly activity, achievements, and home ideas."],
    ["Scale", "Software-first model can reuse existing screens and a low-cost webcam."],
    ["Access", "Local-first mode supports low-connectivity centres and mobile/vulnerable communities."]
  ];
  impact.forEach((r, i) => card(s, 7.1, 1.35 + i * 1.02, 5.3, 0.76, r[0], r[1], i % 2 ? "blue" : "green"));
  pill(s, 0.6, 4.0, "Originality: wall-scale + AI + adaptive ECCE play", "green", 3.3);
  pill(s, 0.6, 4.48, "Not a tablet app. Not a hardware board.", "blue", 3.0);
  pill(s, 0.6, 4.96, "Local-first, teacher-in-loop design", "amber", 2.7);
}

// 13 Phase 2 plan
{
  const s = pptx.addSlide();
  addBg(s, "Implementation plan: Phase 2 milestones", "Milestones, dependencies, risks, scope", "Plan 5%");
  const phases = [
    ["0-4 weeks", "Pilot hardening", "Gesture tuning, calibration wizard, Whisper setup check, content QA, clickable prototype polish."],
    ["4-8 weeks", "Secure data layer", "Supabase/Firebase, auth, consent, role permissions, real learner and classroom rosters."],
    ["8-12 weeks", "AI and language", "Validated AI puzzle generation, teacher-reviewed insights, Hindi/regional prompt packs, parent report localization."],
    ["12-16 weeks", "Pilot deployment", "5 pilot sites, device testing, educator training, efficacy and engagement metrics."]
  ];
  phases.forEach((p, i) => {
    const x = 0.65 + i * 3.12;
    card(s, x, 1.48, 2.75, 2.05, p[0], `${p[1]}\n${p[2]}`, i < 2 ? "green" : "blue");
    if (i < phases.length - 1) processArrow(s, x + 2.78, 2.5, x + 3.05, 2.5);
  });
  text(s, "Dependencies", 0.65, 4.25, 2.0, 0.28, { fontSize: 11, bold: true, color: C.green });
  ["Webcam/display access", "Local model/device capacity", "School consent and child data policy", "Educator co-design partners", "Regional language review"].forEach((d, i) => text(s, d, 0.9, 4.68 + i * 0.32, 3.5, 0.24, { fontSize: 9.4, color: C.muted, bullet: { type: "bullet" } }));
  text(s, "Risks and scope control", 5.4, 4.25, 2.5, 0.28, { fontSize: 11, bold: true, color: C.green });
  ["Do not claim diagnostic screening", "Keep AI puzzle generation behind validation", "Cloud upload after consent/auth", "Teacher dashboard real data after backend", "Pilot before impact claims"].forEach((d, i) => text(s, d, 5.65, 4.68 + i * 0.32, 3.6, 0.24, { fontSize: 9.4, color: C.muted, bullet: { type: "bullet" } }));
  card(s, 9.9, 4.28, 2.6, 1.75, "Phase 2 success metric", "A teacher can run a 20-minute play session, capture subtitles/recording, and review child/class insights with consented real data.", "amber");
}

// 14 Team
{
  const s = pptx.addSlide();
  addBg(s, "Team composition and skills", "Team", "Implementation");
  const team = [
    ["Full-stack / product engineer", "React, TypeScript, Vite, Node server, routing, clickable prototype, dashboards"],
    ["Computer vision engineer", "MediaPipe Hands, homography, calibration, filtering, gesture reliability, OS bridge"],
    ["AI / ML engineer", "Ollama, Whisper, IRT, cognitive scoring, schema validation, evaluation, Responsible AI"],
    ["ECCE / UX designer", "Play-based pedagogy, child UX, Anganwadi workflows, language, accessibility"],
    ["Pilot / partnerships lead", "School onboarding, consent, training, field data collection, stakeholder reporting"]
  ];
  team.forEach((m, i) => card(s, 0.65 + (i % 3) * 4.1, 1.42 + Math.floor(i / 3) * 1.85, 3.65, 1.25, m[0], m[1], i % 2 ? "blue" : "green"));
  text(s, "Current codebase already demonstrates the engineering spine: CV host, local server, React puzzle app, adaptive engine, AI assistant, subtitles route, recording UI, and analytics screens.", 0.65, 5.5, 11.7, 0.46, { fontSize: 13, bold: true, color: C.ink });
  text(s, "Needed for Phase 2: early childhood domain review, language reviewers, school data/privacy advisor, and pilot implementation support.", 0.65, 6.15, 11.3, 0.32, { fontSize: 10, color: C.muted });
}

// 15 Rubric close
{
  const s = pptx.addSlide();
  addBg(s, "Rubric fit and ask", "Closing", "Total 100%");
  const rubrics = [
    ["Problem framing", "15%", "ECCE challenge, Anganwadi context, evidence sources, user needs."],
    ["AI feasibility", "25%", "MediaPipe, Ollama, Whisper, IRT, evaluation plan, current code evidence."],
    ["Innovation", "10%", "Software-first smart learning wall combining CV, AI support, and adaptive play."],
    ["Prototype", "15%", "Working app plus browser clickable prototype mapped to all 10 features."],
    ["Impact", "10%", "Low-cost hardware path and parent/teacher continuity."],
    ["Equity / Responsible AI", "20%", "Local-first, subtitles, language roadmap, consent, teacher review."],
    ["Implementation", "5%", "Phase 2 milestones, dependencies, risks, and scope control."]
  ];
  rubrics.forEach((r, i) => {
    const x = 0.65 + (i % 2) * 6.2;
    const y = 1.42 + Math.floor(i / 2) * 1.0;
    card(s, x, y, 5.6, 0.72, `${r[0]} (${r[1]})`, r[2], i % 2 ? "blue" : "green");
  });
  text(s, "CogniPlay Studio: Any wall. Any child. Infinite learning.", 0.72, 6.08, 8.4, 0.42, { fontSize: 20, bold: true, color: C.ink });
  text(s, "Next ask: pilot partners, ECCE content review, and support to turn the verified prototype into a consented classroom deployment.", 0.72, 6.55, 10.8, 0.28, { fontSize: 10.5, color: C.muted });
}

pptx.writeFile({ fileName: out });
