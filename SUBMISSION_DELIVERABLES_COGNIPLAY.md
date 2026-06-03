# CogniPlay Studio Submission Deliverables

## 1. Solution Title

**CogniPlay Studio: Any Wall. Any Child. Infinite Learning.**

Short challenge-specific version:

**CogniPlay Studio: A Low-Cost AI Smart Learning Wall for Play-Based Early Childhood Education**

One-line pitch:

**CogniPlay Studio turns any projector or TV into an AI-assisted smart board using only a USB webcam, helping Anganwadi workers and ECCE educators deliver developmentally appropriate play-based learning for children aged 3-6.**

## 2. Presentation Deck

Final submission deck:

[CogniPlay_Studio_Submission_Deck.pptx](/Users/rajivkhanna/Downloads/NeoTouch/CogniPlay_Studio_Submission_Deck.pptx)

Source deck supplied:

`/Users/rajivkhanna/Library/Containers/net.whatsapp.WhatsApp/Data/tmp/documents/55EFD45F-040D-43D0-937D-356D74ED440B/CogniPlay_Studio_v3.pptx`

Deck structure:

1. Title: Any Wall. Any Child. Infinite Learning.
2. Problem: smart classrooms are expensive and learning analytics are disconnected.
3. Solution: webcam + projector + CogniPlay software.
4. How it works: webcam, calibration, gesture interaction, adaptive learning.
5. TouchWall CV engine.
6. AI whiteboard engine.
7. CogniPlay puzzle engine.
8. Adaptive scoring.
9. Learning DNA.
10. Recording and subtitles.
11. Parent dashboard.
12. Teacher dashboard.
13. User experience.
14. Technology.
15. Build status.
16. Market opportunity.
17. Competitive landscape.
18. Business model.
19. Go-to-market.
20. ARR trajectory.
21. Risks and mitigations.
22. Team.
23. Prototype demo guide.
24. Ask.
25. Closing.

Recommended deck title for submission portal:

**CogniPlay Studio - AI Smart Learning Wall for Early Childhood Play-Based Learning**

## 3. Clickable Prototype

### Local Clickable Prototype URL

The prototype is running locally at:

[http://localhost:3000/](http://localhost:3000/)

Direct CogniPlay route:

[http://localhost:3000/cogniplay/](http://localhost:3000/cogniplay/)

Useful direct routes:

- Landing / game entry: [http://localhost:3000/cogniplay/](http://localhost:3000/cogniplay/)
- Learner setup: [http://localhost:3000/cogniplay/age-select](http://localhost:3000/cogniplay/age-select)
- Home World: [http://localhost:3000/cogniplay/worlds](http://localhost:3000/cogniplay/worlds)
- Puzzle play: [http://localhost:3000/cogniplay/play](http://localhost:3000/cogniplay/play)
- Drawing Studio: [http://localhost:3000/cogniplay/studio](http://localhost:3000/cogniplay/studio)
- Parent dashboard: [http://localhost:3000/cogniplay/parent](http://localhost:3000/cogniplay/parent)
- Teacher dashboard: [http://localhost:3000/cogniplay/teacher](http://localhost:3000/cogniplay/teacher)

### How to Run

From the project root:

```bash
cd /Users/rajivkhanna/Downloads/NeoTouch
node server.js
```

The latest CogniPlay build has already been generated with:

```bash
cd /Users/rajivkhanna/Downloads/NeoTouch/CogniPlay/cogniplay
npm run build
```

### Prototype Demo Flow for Judges

1. Open [http://localhost:3000/](http://localhost:3000/).
2. Click **Start Hand Tracking** if demonstrating hardware interaction.
3. Show the **CV Active** badge and camera preview.
4. In **Puzzle Playground**, click **Continue Playing** or create a learner.
5. Go to **Home World**.
6. Open **Shape Island** or **Pattern Room**.
7. Demonstrate drag/drop puzzle interaction.
8. Return to top nav and open **Whiteboard**.
9. Type a topic and click **Flowchart** or **Ask**.
10. Open **Recording** and show live subtitle controls.
11. Open **Parent Dashboard**.
12. Open **Teacher Dashboard**.

## 4. Video Walkthrough

### Video Deliverable Status

`ffmpeg` is not installed on this machine, so I prepared a ready-to-record walkthrough script and shot list rather than exporting a synthetic MP4. The product-testing screenshots are available here and can be used as B-roll or inserted into the final edit:

[pdf_extracted_images](/Users/rajivkhanna/Downloads/NeoTouch/pdf_extracted_images)

Contact sheet:

[contact-sheet.jpg](/Users/rajivkhanna/Downloads/NeoTouch/pdf_extracted_images/contact-sheet.jpg)

### Recommended Video Title

**CogniPlay Studio Walkthrough - AI Smart Learning Wall for Early Childhood Education**

### Recommended Length

3 to 4 minutes.

### Walkthrough Script

**0:00-0:20 - Opening**

"This is CogniPlay Studio, a low-cost AI smart learning wall for early childhood education. It turns any projector or TV into an interactive smart board using only a USB webcam. The goal is to help Anganwadi workers and ECCE educators deliver high-quality play-based learning every day."

Show:

- Landing screen
- CV Active badge
- right-side camera preview

**0:20-0:50 - Problem and Setup**

"Many early childhood centres cannot afford dedicated smart boards, and frontline workers often need simple support to run engaging, developmentally appropriate activities. CogniPlay uses existing hardware: a display, a webcam, and software. The teacher starts hand tracking, calibrates the wall, and the display becomes interactive."

Show:

- Start/stop hand tracking
- calibration panel
- camera preview

**0:50-1:30 - Child Play Flow**

"Children enter a calm play world designed for ages 3 to 6. They choose activities such as Shape Island, Pattern Room, Memory Train, and Drawing Studio. The activities use drag and drop, tracing, matching, sorting, and memory play, so learning happens through movement rather than worksheets."

Show:

- Home World
- Puzzle Groups
- sorting puzzle
- pattern puzzle
- memory puzzle
- trace/maze if available

**1:30-2:05 - AI Whiteboard and Teacher Support**

"Teachers can switch to the whiteboard at any time. The whiteboard supports drawing, highlighting, undo and redo, eraser, laser pointer, and AI shape assist. The teacher can also ask local AI to create a flowchart, definition, explanation, or quick teaching note on the spot."

Show:

- Whiteboard
- AI Shape Assist
- generated flowchart
- Ask AI or definition flow

**2:05-2:35 - Inclusion: Recording and Live Subtitles**

"For inclusion and continuity, CogniPlay includes session recording with camera picture-in-picture and optional local live subtitles using Whisper or whisper.cpp. This helps children with hearing barriers, supports parent follow-up, and lets absent children review lessons later."

Show:

- Recording tab
- Start Recording
- Start Live Subtitles
- subtitle preview area

**2:35-3:10 - Parent and Teacher Insights**

"As children play, CogniPlay builds a local Learning DNA profile across cognitive dimensions such as memory, attention, spatial reasoning, persistence, and pattern recognition. Parents see plain-language strengths, growth areas, weekly activity, achievements, and activities to try at home. Teachers see class-level heatmaps, score distribution, students needing attention, and recommended interventions."

Show:

- Learning DNA
- Parent Dashboard
- Teacher Dashboard
- heatmap and alerts

**3:10-3:40 - AI and Responsible Scale**

"The AI is designed to support educators, not replace them. Local AI can generate teaching aids and subtitles, while future AI recommendations will remain teacher-reviewed. Because the hardware requirement is only a USB webcam and an existing display, the system can scale to low-resource classrooms, migrant communities, and Anganwadi centres."

Show:

- deck or prototype closing
- hardware requirement
- challenge alignment

**3:40-4:00 - Closing**

"CogniPlay Studio makes smart learning walls accessible: any wall, any child, infinite learning."

Show:

- final title slide or landing page

### Shot List

| Shot | Screen / Asset | Purpose |
|---|---|---|
| 1 | Landing with CV Active | Establish working prototype |
| 2 | Camera preview and setup dock | Show real wall/projection testing |
| 3 | Home World | Show child navigation |
| 4 | Sorting puzzle | Show drag/drop interaction |
| 5 | Pattern puzzle | Show play-based cognitive learning |
| 6 | Whiteboard blank | Show teacher tool |
| 7 | AI-generated flowchart | Show AI teaching support |
| 8 | Recording tab | Show session capture and subtitles |
| 9 | Learning DNA | Show adaptive profile |
| 10 | Parent Dashboard | Show caregiver support |
| 11 | Teacher Dashboard | Show intervention potential |
| 12 | Closing slide | Reinforce title and challenge fit |

### Recording Notes

Use the local prototype at [http://localhost:3000/](http://localhost:3000/) for screen recording.

Recommended recording tool:

- macOS QuickTime Player screen recording
- OBS
- Loom
- Zoom local recording

Recommended voiceover style:

- clear
- teacher-friendly
- not too technical
- emphasize low-cost implementation and inclusion

## Submission Checklist

| Deliverable | File / Link |
|---|---|
| Solution title | CogniPlay Studio: Any Wall. Any Child. Infinite Learning. |
| Presentation deck | [CogniPlay_Studio_Submission_Deck.pptx](/Users/rajivkhanna/Downloads/NeoTouch/CogniPlay_Studio_Submission_Deck.pptx) |
| Clickable prototype | [http://localhost:3000/](http://localhost:3000/) |
| Direct app route | [http://localhost:3000/cogniplay/](http://localhost:3000/cogniplay/) |
| Video walkthrough script | This document, section 4 |
| Screenshot evidence | [pdf_extracted_images](/Users/rajivkhanna/Downloads/NeoTouch/pdf_extracted_images) |

