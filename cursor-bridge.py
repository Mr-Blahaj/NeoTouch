#!/usr/bin/env python3
"""
TouchWall System Cursor Bridge
Moves the macOS system cursor using CoreGraphics via ctypes.
No pip install required — uses macOS built-in frameworks.

Listens to commands on stdin in the format:
  M,x,y       — Move cursor to (x, y)
  D,x,y       — Left mouse button down at (x, y)
  U,x,y       — Left mouse button up at (x, y)
  SC,x,y      — Scroll (x = horizontal delta, y = vertical delta)
  Q           — Quit

Coordinates are in macOS logical screen pixels (top-left origin).

IMPORTANT: The application running this script (Terminal or Node.js) MUST have
Accessibility access in System Settings → Privacy & Security → Accessibility.
"""

import sys
import ctypes

# ---------------------------------------------------------------------------
# Load macOS frameworks
# ---------------------------------------------------------------------------
try:
    CG = ctypes.CDLL("/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics")
    CF = ctypes.CDLL("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation")
except OSError as e:
    sys.stderr.write(f"[cursor-bridge] Failed to load CoreGraphics: {e}\n")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Type definitions
# ---------------------------------------------------------------------------
class CGPoint(ctypes.Structure):
    _fields_ = [("x", ctypes.c_double), ("y", ctypes.c_double)]

# CGEventRef is opaque, represent as void*
CGEventRef = ctypes.c_void_p

# CGEventType constants
kCGEventLeftMouseDown   = 1
kCGEventLeftMouseUp     = 2
kCGEventLeftMouseDragged = 6
kCGEventMouseMoved      = 5
kCGEventScrollWheel     = 22

# CGMouseButton constants
kCGMouseButtonLeft = 0

# CGEventTapLocation
kCGHIDEventTap = 0

# CGScrollEventUnit
kCGScrollEventUnitPixel = 1

# ---------------------------------------------------------------------------
# Function signatures
# ---------------------------------------------------------------------------
CG.CGEventCreateMouseEvent.restype  = CGEventRef
CG.CGEventCreateMouseEvent.argtypes = [
    ctypes.c_void_p,   # source (NULL)
    ctypes.c_uint32,   # mouseType
    CGPoint,           # mouseCursorPosition
    ctypes.c_uint32    # mouseButton
]

CG.CGEventCreateScrollWheelEvent.restype  = CGEventRef
CG.CGEventCreateScrollWheelEvent.argtypes = [
    ctypes.c_void_p,  # source
    ctypes.c_uint32,  # units
    ctypes.c_uint32,  # wheelCount
    ctypes.c_int32,   # wheel1
]

CG.CGEventPost.restype  = None
CG.CGEventPost.argtypes = [ctypes.c_uint32, CGEventRef]

CF.CFRelease.restype  = None
CF.CFRelease.argtypes = [ctypes.c_void_p]

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------
mouse_is_down = False

def post_mouse_event(event_type, x, y):
    pt = CGPoint(float(x), float(y))
    event = CG.CGEventCreateMouseEvent(None, event_type, pt, kCGMouseButtonLeft)
    if event:
        CG.CGEventPost(kCGHIDEventTap, event)
        CF.CFRelease(event)

def post_scroll_event(dx, dy):
    # Scroll vertical = wheel1, horizontal = wheel2
    event = CG.CGEventCreateScrollWheelEvent(
        None, kCGScrollEventUnitPixel, 2,
        ctypes.c_int32(int(-dy)),   # negative: scroll down moves content up
        ctypes.c_int32(int(dx))
    )
    if event:
        CG.CGEventPost(kCGHIDEventTap, event)
        CF.CFRelease(event)

# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------
sys.stdout.write("CURSOR_BRIDGE_READY\n")
sys.stdout.flush()

for raw_line in sys.stdin:
    line = raw_line.strip()
    if not line:
        continue
    parts = line.split(",")
    cmd = parts[0].upper()

    try:
        if cmd == "M" and len(parts) >= 3:
            event_type = kCGEventLeftMouseDragged if mouse_is_down else kCGEventMouseMoved
            post_mouse_event(event_type, float(parts[1]), float(parts[2]))
        elif cmd == "D" and len(parts) >= 3:
            mouse_is_down = True
            post_mouse_event(kCGEventLeftMouseDown, float(parts[1]), float(parts[2]))
        elif cmd == "U" and len(parts) >= 3:
            post_mouse_event(kCGEventLeftMouseUp, float(parts[1]), float(parts[2]))
            mouse_is_down = False
        elif cmd == "SC" and len(parts) >= 3:
            post_scroll_event(float(parts[1]), float(parts[2]))
        elif cmd == "Q":
            break
    except Exception as e:
        sys.stderr.write(f"[cursor-bridge] Error processing '{line}': {e}\n")
        sys.stderr.flush()
