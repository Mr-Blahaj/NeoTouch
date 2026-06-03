# CogniPlay Studio PPT Claim Verification Report

Date: 2026-06-03  
Deck reviewed: `/Users/rajivkhanna/Downloads/NeoTouch/CogniPlay_Studio_Submission_Deck.pptx`  
Codebase reviewed: `/Users/rajivkhanna/Downloads/NeoTouch`

## Executive Verdict

The deck is directionally truthful and the core prototype is real: the product does include a webcam-based smartboard layer, MediaPipe hand tracking, a React CogniPlay puzzle app, adaptive scoring, whiteboard AI assistance, live subtitle plumbing, recording, parent/teacher dashboard screens, and local-first architecture.

However, several claims should be corrected before submission because they are currently **partial, mock/demo, dependency-gated, or roadmap** rather than fully implemented.

Most important corrections:

| Area | Current Truth | Recommended Deck Language |
|---|---|---|
| Teacher dashboard | UI exists, but uses hardcoded `MOCK_STUDENTS` data. | "Teacher dashboard prototype with mock classroom analytics; real classroom sync planned." |
| Parent dashboard | UI exists and reads some local learner data, but weekly chart/home tips are not fully data/AI-driven. | "Parent dashboard prototype showing local progress, strengths, growth areas, badges, and suggested home activities." |
| AI puzzle generation | Currently disabled; `generatePuzzleAI()` returns procedural puzzles immediately. | "Procedural adaptive puzzles today; Ollama-based AI puzzle generation scaffolded for future enablement." |
| AI hints | Implemented through local Ollama with fallback text. | "Optional local Ollama hints with graceful fallback." |
| Auto shape correction | Implemented as geometric/rule-based classification, not LLM AI. | "Offline shape recognition and beautification." |
| Live subtitles | Implemented, but requires local Whisper/whisper.cpp installation and model path. | "Local Whisper subtitle pipeline implemented; deployment requires model setup." |
| Cloud upload | Not implemented; button says credentials must be connected. | "Local recording implemented; cloud upload integration planned." |
| OS-wide smartboard | System cursor bridge and native overlay exist; gesture-based undo/redo/window switching is not fully present in current code. | "Semi-implemented OS cursor/overlay bridge; advanced OS gestures are roadmap/refinement." |
| "15 categories" | 15 category enum/labels exist, but current generator maps them into 8 simplified preschool templates. | "15 learning category labels powered by 8 play templates in the current prototype." |
| Market/traction claims | Some market claims need citations; financials and ARR are projections. | Label as "projected" or "assumption"; cite every market number. |

## Evidence-Based Verification

### Strongly Supported By Code

| Claim | Status | Evidence |
|---|---:|---|
| Webcam-based hand tracking exists | True | `hand-tracker.js` uses MediaPipe Hands, smoothing, pinch logic, depth estimates, and calibration. |
| Root smartboard host exists | True | `index.html`, `app.js`, `style.css`, `server.js`. |
| CogniPlay React prototype exists | True | `CogniPlay/cogniplay` Vite/React/TypeScript app. |
| CogniPlay can be opened inside host shell | True | `app.js` opens `/cogniplay/` in app/window mode. |
| Whiteboard has shape beautification | True, but rule-based | `app.js` calls `window.ShapeClassifier.classifyAndBeautify(...)`; `ai-engine.js` defines `ShapeClassifier`. |
| Local Ollama whiteboard assistant exists | True | `app.js` has `triggerLocalAi(...)`; `ai-engine.js` has `LocalOllamaAssistant`. |
| Flowcharts/definitions/answers/tables/word charts are supported | True as local AI/procedural assistant modes | `app.js` modes include `flowchart`, `definition`, `answer`, `table`, `wordchart`. |
| Session recording exists | True | `app.js` uses `getDisplayMedia`, camera PiP, canvas capture, `MediaRecorder`, local download. |
| Caption burn-in on recording exists | True when captions active | `app.js` draws `liveCaptionText` onto recording canvas. |
| Local subtitle endpoint exists | True, setup-dependent | `server.js` exposes `/caption/status` and `/caption/local`. |
| macOS cursor bridge exists | True | `server.js` exposes `/cursor`, `/cursor/down`, `/cursor/up`, `/cursor/scroll`, `/cursor/status`; `cursor-bridge.py` handles OS cursor control. |
| Native overlay endpoint exists | True | `server.js` exposes `/overlay/start`; `system-overlay.swift` and compiled `.cogniplay-overlay` exist. |
| Adaptive IRT scoring exists | True prototype | `AdaptiveEngine.ts` implements 3PL probability, theta update, next difficulty, exposure control. |
| Seven cognitive dimensions exist | True | `types.ts` defines pattern recognition, spatial intelligence, logical reasoning, working memory, attention control, persistence, learning speed. |
| Rewards exist | True | `RewardEngine.ts` implements XP, stars, badges, worlds. |
| No production backend/auth/database is built | True | Persistence is local/browser-based; backend is local prototype server. |

### Partial Or Needs Softer Wording

| Claim | Status | Why |
|---|---:|---|
| "Works across the entire OS" | Partial | Cursor bridge and overlay exist, but full OS-wide gesture workflows are not complete. |
| "Undo/redo, switch windows using gestures" | Partial / not current | Current code supports cursor movement/click/scroll. Advanced hotkeys/window switching are not clearly implemented in current `app.js`/`server.js`. |
| "AI adapts difficulty live" | Partly true, terminology issue | Difficulty adapts through IRT/statistical logic, not LLM AI. |
| "AI-generated puzzles" | Not currently true | `generatePuzzleAI()` immediately returns procedural generator output; Ollama code below is unreachable. |
| "15 puzzle categories" | Partial | 15 enum categories exist, but the current preschool generator maps them to 8 templates. |
| "5 interaction types" | Partial | Type system has 6 interaction strings, but current prototype mainly uses select, drag/drop, trace maze, and zoom/pan support. |
| "Teacher recommended actions use AI" | Not currently true | Teacher dashboard recommendations are hardcoded demo strings. |
| "Parent home recommendations use AI" | Not currently true | Parent recommendations are deterministic/static, not LLM-generated. |
| "Cloud upload" | Roadmap | Upload button only displays "ready to connect" message. |
| "Zero latency AI" | Overstated | Ollama/Whisper are local but still have runtime latency and hardware dependency. |
| "Item difficulty calibrated from pilot data" | Unsupported | IRT parameters are generated from difficulty; no pilot calibration dataset found. |
| "No PII stored today" | Needs nuance | No cloud PII is stored, but localStorage stores player name/profile/history. |

## Slide-By-Slide Audit

| Slide | Verdict | Notes |
|---:|---|---|
| 1 | Mostly true | Good title and architecture framing. Change "AI puzzle generation" to "adaptive procedural puzzles + AI hint scaffold." |
| 2 | Needs citations | Problem framing is good. Claims about smartboard cost, 90% of schools, and projector/webcam penetration need sources or softer wording. |
| 3 | Mostly true with AI caveat | Webcam + MediaPipe + IRT + 7D profile are real. "Zero latency local AI" and puzzle AI need correction. |
| 4 | Partial | Four-point calibration, embedded app, pinch/drag/trace are real. "Under 3 minutes" is unverified. "AI adapts difficulty" should be "IRT adapts difficulty." |
| 5 | True | Hand tracking pipeline is well supported by code. |
| 6 | Mostly true | Whiteboard copilot exists. Shape assist is geometric/rule-based, not LLM. Ollama output depends on local model availability. |
| 7 | Partial | Preschool puzzle gameplay is real, but "15 categories" overstates distinct active puzzle mechanics. |
| 8 | Mostly true | 3PL IRT math exists. Remove "calibrated from pilot data" unless actual pilot data is added. |
| 9 | Mostly true prototype | 7D learner profile exists. Use "learning speed" rather than "processing speed." Persistence signal may be weak if retry counting is not fully wired. |
| 10 | Partial | Recording and local subtitles exist. Cloud upload is not implemented. Whisper must be installed. |
| 11 | Partial | Parent dashboard exists. Some charts/activities are mock or deterministic, not fully real-time/AI-generated. |
| 12 | Partial/demo | Teacher dashboard is visual and impressive, but currently hardcoded mock classroom data. |
| 13 | Mostly true as intended flow | Journey is credible, but session logs/screen time/class sync should be marked future unless implemented. |
| 14 | Mostly true | Tech stack and "no backend/auth/db yet" are accurate. Avoid exact "MediaPipe Hands v3" unless that is your internal version, not an official package claim. |
| 15 | Mostly true with roadmap labels | Good build-vs-roadmap split. Make sure "AI puzzle generation" stays in roadmap/enhancement, not built list. |
| 16 | Needs citations/positioning | Market categories are plausible; cite EdTech/AI education/interactive display market reports. "Open-source engine" is only true if repo is actually public. |
| 17 | Needs softer competitive wording | Avoid "only" and absolute competitive claims unless backed by evidence. |
| 18 | Proposed only | Business model is a plan, not implemented traction. Label clearly as proposed. |
| 19 | Proposed only | GTM is future strategy. "Open-source core" needs publication proof. |
| 20 | Projection only | ARR trajectory is hypothetical. Label as model/projection, not traction. |
| 21 | Mostly good | Risk list is honest. Change "No PII stored today" to "No cloud PII stored; prototype uses local browser storage." |
| 22 | Needs founder validation | Team roles cannot be verified from code. |
| 23 | Mostly true but URL correction | Current integrated demo should use `http://localhost:3000/` and `http://localhost:3000/cogniplay/`. `localhost:5173` only applies to Vite dev mode. |
| 24 | Proposed only | Ask, pilot goals, and timeline are strategic assumptions. Ensure dates are internally consistent. |
| 25 | Needs link validation | Website/GitHub/email should be real or marked placeholders. |

## Functionality Mentioned In Deck: Truth Table

| Functionality | Deck Claim Safe? | Actual State |
|---|---:|---|
| Turn projector/TV into smartboard using webcam | Yes | Implemented prototype. Requires computer + display/projector/TV + webcam. |
| Hand tracking gestures | Yes, with refinement | Implemented for pointer/pinch/drag style interactions. |
| Gesture undo/redo/window switching | Not fully safe | Mention as planned/refinement unless current demo proves it. |
| Works across whole OS | Partly safe | Cursor bridge and overlay support exist; full OS-wide workflow is semi-implemented. |
| AI flowcharts/definitions/answers on whiteboard | Yes | Implemented with local Ollama/procedural fallback. |
| Live lecture subtitles | Partly safe | Implemented pipeline, but needs Whisper installed/configured. |
| Auto record lecture | Yes | Local screen + camera recording implemented. |
| Auto upload lecture to cloud | No | Not implemented. |
| Drag/drop play-based games | Yes | Implemented. |
| Patterns/shapes/memory/counting/maze style games | Yes | Implemented templates exist. |
| More categories to add/refine | Yes | Roadmap claim is appropriate. |
| Points/stars/badges | Yes | Implemented. |
| Sticker shop/mentors/customization economy | No | Not implemented yet. |
| Parent portal | Partly safe | Prototype exists; not production data pipeline. |
| Teacher dashboard | Partly safe | Prototype exists with mock data. |
| Class heatmap/intervention list | Partly safe | UI exists; hardcoded demo data/actions. |
| AI intervention recommendations | Not current | Static recommendations today. |

## Things The Deck Should Mention More Clearly

1. **Hackathon challenge alignment**
   The deck should explicitly name the target challenge: Early Childhood 3-6, play-based early learning quality, Anganwadi workers, ECCE educators, multilingual and low-resource settings.

2. **Hardware requirement**
   Say: "Uses a USB webcam and existing display/projector/TV; no dedicated smartboard hardware required." This is stronger and more accurate than "no hardware."

3. **Local-first and privacy posture**
   The strongest responsible AI angle is local-first operation: Ollama runs locally, Whisper can run locally, and there is no production cloud database yet. But be precise: the browser stores learner names/progress in localStorage.

4. **Teacher-in-the-loop**
   Add that dashboards are decision support, not diagnosis. The system flags possible support needs but does not label children medically or make final decisions.

5. **Prototype honesty**
   Judges usually reward honest scoping. Add a small "Prototype Status" slide: implemented, semi-implemented, roadmap.

6. **Multilingual roadmap**
   Live captions and local-language support are central to the challenge, but the current deck should explain the plan for Hindi/regional languages and local ECCE content packs.

7. **Evidence from live product testing**
   Include screenshots from the tested PDF/product demo: CV active, webcam tracking, puzzle screen, whiteboard AI flowchart, recording/subtitles, parent dashboard, teacher dashboard.

8. **Accessibility and inclusion**
   Mention subtitles, large shared display, low-cost setup, local language roadmap, offline mode, and support for educators with limited technical training.

9. **What is AI vs non-AI**
   Separate the AI layer into:
   - Computer vision: hand tracking.
   - Statistical adaptation: IRT.
   - Local LLM: hints, whiteboard answers/flowcharts.
   - Local speech AI: Whisper captions.
   - Rule-based assist: shape beautification.

10. **Current limitations**
    The deck should say that backend, auth, cloud sync, real classroom roster management, consent workflows, and production analytics are future implementation items.

## Recommended Exact Wording Fixes

| Replace This | With This |
|---|---|
| "Zero-latency local AI" | "Local AI with no cloud dependency; latency depends on device/model." |
| "AI-generated puzzles" | "Adaptive procedural puzzles today; AI generation scaffolded for future use." |
| "AI adapts difficulty live" | "IRT-based adaptive engine adjusts difficulty after each attempt." |
| "Teacher dashboard shows real classroom stats" | "Teacher dashboard prototype shows classroom analytics using demo data; real roster sync planned." |
| "Auto upload to cloud" | "Local recording implemented; cloud upload integration planned." |
| "No PII stored today" | "No cloud PII stored in the prototype; learner profile data is stored locally in the browser." |
| "15 fully implemented puzzle categories" | "15 learning category labels mapped to 8 preschool play templates in the current prototype." |
| "Works across the entire OS" | "Includes macOS cursor/overlay bridge; broader OS gesture workflows are being refined." |
| "Item difficulty calibrated from pilot data" | "Item difficulty generated from prototype difficulty parameters; pilot calibration planned." |

## Market Claim Notes

The broad market framing is plausible, but numbers need citations. Useful external evidence found:

- Grand View Research reports the global digital education market at USD 26.01B in 2024 and projected USD 133.73B by 2030.
- Grand View Research reports the global AI in education market projected to reach USD 32.27B by 2030.
- Fortune Business Insights reports the global interactive display market at USD 54.54B in 2025, projected to USD 125.48B by 2034.

Do not use uncited claims such as "300x cheaper," "out of reach for 90% of global schools," or "1.5B children aged 3-12" unless you add reliable sources. Safer wording: "Dedicated interactive boards remain costly for many low-resource schools; CogniPlay reduces hardware requirements by using a webcam plus existing display."

## Final Submission Readiness Score

| Category | Score | Reason |
|---|---:|---|
| Product truthfulness | 7.5/10 | Core demo is real; a few features need honest status labels. |
| Technical credibility | 8/10 | Strong prototype architecture with CV, local server, React app, IRT, Ollama/Whisper integrations. |
| Hackathon alignment | 7/10 | Needs stronger Early Childhood 3-6, Anganwadi/ECCE, multilingual, and inclusion framing. |
| Investor defensibility | 6.5/10 | Good concept, but traction/business projections need to be clearly labeled as assumptions. |
| Responsible AI readiness | 7/10 | Local-first posture is strong; needs clearer consent, child data, non-diagnostic framing, and language support. |

## Bottom Line

The presentation is usable, but it should be revised before submission. The safest story is:

CogniPlay Studio is a working local-first prototype that converts existing displays into interactive learning surfaces using webcam hand tracking, then layers an adaptive play-based early learning app on top. It includes whiteboard AI, local subtitle infrastructure, recording, parent views, and teacher analytics prototypes. The next build phase should connect real classroom data, cloud upload, consent/auth, multilingual content, production AI puzzle generation, and validated intervention recommendations.

