import AppKit
import Foundation

final class Stroke {
    let path = NSBezierPath()
    let color: NSColor
    let width: CGFloat
    let laser: Bool
    let eraser: Bool

    init(color: NSColor, width: CGFloat, laser: Bool = false, eraser: Bool = false) {
        self.color = color
        self.width = width
        self.laser = laser
        self.eraser = eraser
        self.path.lineCapStyle = .round
        self.path.lineJoinStyle = .round
        self.path.lineWidth = width
    }
}

final class OverlayView: NSView {
    var tool = "brush"
    var color = NSColor.black
    var width: CGFloat = 6
    var strokes: [Stroke] = []
    var redo: [Stroke] = []
    private var activeStroke: Stroke?

    override var acceptsFirstResponder: Bool { true }

    override func draw(_ dirtyRect: NSRect) {
        NSColor.clear.setFill()
        dirtyRect.fill()
        for stroke in strokes {
            NSGraphicsContext.current?.compositingOperation = stroke.eraser ? .clear : .sourceOver
            stroke.color.setStroke()
            stroke.path.stroke()
        }
        if let activeStroke {
            NSGraphicsContext.current?.compositingOperation = activeStroke.eraser ? .clear : .sourceOver
            activeStroke.color.setStroke()
            activeStroke.path.stroke()
        }
        NSGraphicsContext.current?.compositingOperation = .sourceOver
    }

    override func mouseDown(with event: NSEvent) {
        let point = convert(event.locationInWindow, from: nil)
        let strokeColor = tool == "eraser" ? NSColor.black : (tool == "laser" ? NSColor.systemRed : color)
        let strokeWidth = tool == "eraser" ? width * 5 : width
        let stroke = Stroke(color: strokeColor, width: strokeWidth, laser: tool == "laser", eraser: tool == "eraser")
        stroke.path.move(to: point)
        activeStroke = stroke
    }

    override func mouseDragged(with event: NSEvent) {
        guard let activeStroke else { return }
        activeStroke.path.line(to: convert(event.locationInWindow, from: nil))
        needsDisplay = true
    }

    override func mouseUp(with event: NSEvent) {
        guard let activeStroke else { return }
        activeStroke.path.line(to: convert(event.locationInWindow, from: nil))
        if activeStroke.laser {
            strokes.append(activeStroke)
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { [weak self, weak activeStroke] in
                guard let self, let activeStroke else { return }
                self.strokes.removeAll { $0 === activeStroke }
                self.needsDisplay = true
            }
        } else {
            strokes.append(activeStroke)
            redo.removeAll()
        }
        self.activeStroke = nil
        needsDisplay = true
    }

    func addText(_ text: String) {
        let stroke = Stroke(color: color, width: 1)
        let paragraph = NSMutableParagraphStyle()
        paragraph.lineBreakMode = .byWordWrapping
        let attrs: [NSAttributedString.Key: Any] = [
            .font: NSFont.boldSystemFont(ofSize: 28),
            .foregroundColor: color,
            .paragraphStyle: paragraph,
        ]
        let box = NSRect(x: 140, y: bounds.height - 230, width: 760, height: 180)
        strokes.append(stroke)
        needsDisplay = true
        let layer = CATextLayer()
        layer.string = NSAttributedString(string: text, attributes: attrs)
        layer.frame = box
        layer.isWrapped = true
        layer.contentsScale = NSScreen.main?.backingScaleFactor ?? 2
        wantsLayer = true
        self.layer?.addSublayer(layer)
    }

    func clear() {
        strokes.removeAll()
        redo.removeAll()
        layer?.sublayers?.removeAll()
        needsDisplay = true
    }

    func undo() {
        guard let last = strokes.popLast() else { return }
        redo.append(last)
        needsDisplay = true
    }

    func redoStroke() {
        guard let last = redo.popLast() else { return }
        strokes.append(last)
        needsDisplay = true
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    private var overlayWindow: NSWindow!
    private var toolbarWindow: NSPanel!
    private let overlayView = OverlayView()
    private var drawingEnabled = true
    private var drawToggleButton: NSButton?
    private let colors: [(String, NSColor)] = [
        ("Black", .black),
        ("Green", NSColor(calibratedRed: 0.19, green: 0.36, blue: 0.32, alpha: 1)),
        ("Clay", NSColor(calibratedRed: 0.73, green: 0.42, blue: 0.37, alpha: 1)),
        ("Gold", NSColor(calibratedRed: 0.68, green: 0.54, blue: 0.35, alpha: 1)),
        ("Blue", NSColor(calibratedRed: 0.62, green: 0.78, blue: 0.76, alpha: 1)),
    ]

    func applicationDidFinishLaunching(_ notification: Notification) {
        let screenFrame = NSScreen.main?.frame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
        overlayWindow = NSWindow(contentRect: screenFrame, styleMask: [.borderless], backing: .buffered, defer: false)
        overlayWindow.level = .screenSaver
        overlayWindow.backgroundColor = .clear
        overlayWindow.isOpaque = false
        overlayWindow.hasShadow = false
        overlayWindow.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        overlayWindow.contentView = overlayView
        overlayWindow.ignoresMouseEvents = false
        overlayWindow.makeKeyAndOrderFront(nil)

        toolbarWindow = NSPanel(contentRect: NSRect(x: 90, y: screenFrame.height - 86, width: 860, height: 58), styleMask: [.titled, .nonactivatingPanel], backing: .buffered, defer: false)
        toolbarWindow.level = .screenSaver
        toolbarWindow.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        toolbarWindow.title = "CogniPlay Tools"
        toolbarWindow.contentView = buildToolbar()
        toolbarWindow.orderFrontRegardless()

        print("COGNIPLAY_SWIFT_OVERLAY_READY")
        fflush(stdout)
    }

    private func buildToolbar() -> NSView {
        let view = NSView(frame: NSRect(x: 0, y: 0, width: 860, height: 58))
        view.wantsLayer = true
        view.layer?.backgroundColor = NSColor(calibratedRed: 1, green: 0.99, blue: 0.98, alpha: 0.96).cgColor

        let stack = NSStackView(frame: NSRect(x: 8, y: 7, width: 844, height: 44))
        stack.orientation = .horizontal
        stack.spacing = 6
        stack.alignment = .centerY
        stack.distribution = .gravityAreas

        let drawToggle = button("Pass") { [weak self] in self?.toggleDrawingMode() }
        drawToggleButton = drawToggle
        stack.addArrangedSubview(drawToggle)

        for (title, tool) in [("Brush", "brush"), ("Eraser", "eraser"), ("Laser", "laser")] {
            stack.addArrangedSubview(button(title) { [weak self] in self?.overlayView.tool = tool })
        }

        for (_, color) in colors {
            let swatch = NSButton(frame: NSRect(x: 0, y: 0, width: 28, height: 28))
            swatch.bezelStyle = .texturedRounded
            swatch.wantsLayer = true
            swatch.layer?.backgroundColor = color.cgColor
            swatch.target = self
            swatch.action = #selector(colorButton(_:))
            swatch.identifier = NSUserInterfaceItemIdentifier(rawValue: "\(colors.firstIndex { $0.1 == color } ?? 0)")
            stack.addArrangedSubview(swatch)
        }

        let slider = NSSlider(value: 6, minValue: 2, maxValue: 30, target: self, action: #selector(sizeChanged(_:)))
        slider.frame = NSRect(x: 0, y: 0, width: 90, height: 24)
        stack.addArrangedSubview(slider)

        stack.addArrangedSubview(button("Keyboard") { [weak self] in self?.sendKeyboardText() })
        stack.addArrangedSubview(button("Chat llama3") { [weak self] in self?.chat() })
        stack.addArrangedSubview(button("Undo") { [weak self] in self?.overlayView.undo() })
        stack.addArrangedSubview(button("Redo") { [weak self] in self?.overlayView.redoStroke() })
        stack.addArrangedSubview(button("Clear") { [weak self] in self?.overlayView.clear() })
        stack.addArrangedSubview(button("Close") { NSApp.terminate(nil) })

        view.addSubview(stack)
        return view
    }

    private func toggleDrawingMode() {
        drawingEnabled.toggle()
        overlayWindow.ignoresMouseEvents = !drawingEnabled
        drawToggleButton?.title = drawingEnabled ? "Pass" : "Draw"
        if drawingEnabled {
            overlayWindow.orderFrontRegardless()
        }
    }

    private func button(_ title: String, action: @escaping () -> Void) -> NSButton {
        let button = ClosureButton(title: title, target: nil, action: nil)
        button.bezelStyle = .rounded
        button.onClick = action
        return button
    }

    @objc private func colorButton(_ sender: NSButton) {
        let index = Int(sender.identifier?.rawValue ?? "0") ?? 0
        overlayView.color = colors[max(0, min(index, colors.count - 1))].1
    }

    @objc private func sizeChanged(_ sender: NSSlider) {
        overlayView.width = CGFloat(sender.doubleValue)
    }

    private func prompt(_ title: String, _ message: String) -> String? {
        let alert = NSAlert()
        alert.messageText = title
        alert.informativeText = message
        let input = NSTextField(frame: NSRect(x: 0, y: 0, width: 460, height: 24))
        alert.accessoryView = input
        alert.addButton(withTitle: "OK")
        alert.addButton(withTitle: "Cancel")
        return alert.runModal() == .alertFirstButtonReturn ? input.stringValue : nil
    }

    private func sendKeyboardText() {
        guard let text = prompt("Keyboard", "Text to type into the active app:"), !text.isEmpty else { return }
        let escaped = text.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"")
        let task = Process()
        task.launchPath = "/usr/bin/osascript"
        task.arguments = ["-e", "tell application \"System Events\" to keystroke \"\(escaped)\""]
        try? task.run()
    }

    private func chat() {
        guard let prompt = prompt("llama3 Chat", "Ask, define, table, word chart, or flowchart:"), !prompt.isEmpty else { return }
        let mode = prompt.localizedCaseInsensitiveContains("table") ? "table" :
            prompt.localizedCaseInsensitiveContains("word") ? "word chart" :
            prompt.localizedCaseInsensitiveContains("flow") ? "flowchart" : "answer"
        let output = askOllama(prompt: prompt, mode: mode) ?? "llama3 is not reachable yet. Start Ollama with llama3, then ask again.\n\n\(prompt)"
        overlayView.addText("llama3: \(mode)\n\n\(prompt)\n\n\(output)")
    }

    private func askOllama(prompt: String, mode: String) -> String? {
        guard let url = URL(string: "http://localhost:11434/api/generate") else { return nil }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let fullPrompt = "Answer for a teacher using a 3-5 year old cognitive playground. Keep it concise, formatted, visual, and classroom-friendly. Mode: \(mode). Prompt: \(prompt)"
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["model": "llama3", "prompt": fullPrompt, "stream": false])
        let semaphore = DispatchSemaphore(value: 0)
        var result: String?
        URLSession.shared.dataTask(with: req) { data, _, _ in
            if let data,
               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let response = json["response"] as? String {
                result = response
            }
            semaphore.signal()
        }.resume()
        _ = semaphore.wait(timeout: .now() + 45)
        return result
    }
}

final class ClosureButton: NSButton {
    var onClick: (() -> Void)?
    override func mouseDown(with event: NSEvent) {
        super.mouseDown(with: event)
        onClick?()
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.accessory)
app.run()
