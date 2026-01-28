# 🎯 Auto-Panning Feature - Select Tool

## ✨ What's New?

**Automatic edge-based panning** is now enabled for the **Select Tool**! No need to hold spacebar anymore.

## 🚀 How It Works

### When You're in Select Mode:
1. Click the **Select Tool** (pointer icon - first tool in toolbar)
2. Move your cursor near any edge of the screen
3. **Canvas automatically pans** in that direction!
4. Move cursor away from edge to stop panning

### Edge Detection Zones:
- **Left Edge** (50px from left) → Canvas pans RIGHT
- **Right Edge** (50px from right) → Canvas pans LEFT  
- **Top Edge** (50px from top) → Canvas pans DOWN
- **Bottom Edge** (50px from bottom) → Canvas pans UP

## 📖 Usage Example

```
Scenario: You want to navigate a large diagram

1. Click Select Tool (pointer icon)
2. Move cursor to LEFT edge of screen
3. Canvas automatically pans to the right
4. You can now see content that was off-screen to the left
5. Move cursor away from edge to stop
6. Move cursor to RIGHT edge
7. Canvas pans to the left
8. Continue navigating your entire canvas!
```

## 🎮 Complete Navigation Options

### Option 1: Auto-Pan (NEW!) ⭐
**When:** Select Tool is active  
**How:** Move cursor near screen edges  
**Best for:** Smooth, continuous navigation

### Option 2: Spacebar + Drag
**When:** Any tool  
**How:** Hold SPACEBAR + drag  
**Best for:** Quick repositioning

### Option 3: Middle Mouse Button
**When:** Any tool  
**How:** Middle click + drag  
**Best for:** Power users

### Option 4: Zoom
**When:** Any tool  
**How:** Mouse wheel scroll  
**Best for:** Seeing big picture or details

## 💡 Pro Tips

### Tip 1: Combine with Zoom
```
1. Zoom out to see overview
2. Switch to Select Tool
3. Move cursor to edge to pan to area of interest
4. Zoom in to see details
```

### Tip 2: Navigate While Selecting
```
1. Select Tool active
2. Click and select an object
3. Move cursor to edge while dragging
4. Canvas pans automatically while you move the object!
```

### Tip 3: Quick Edge Navigation
```
Move cursor in circular motion near edges to pan around quickly
```

## 🎯 When to Use Each Method

| Situation | Best Method |
|-----------|-------------|
| **Browsing/Navigating** | Auto-Pan (Select Tool + edges) |
| **Quick Reposition** | Spacebar + Drag |
| **While Drawing** | Spacebar + Drag |
| **Power User** | Middle Mouse Button |
| **See Overview** | Zoom Out |

## ⚙️ Technical Details

- **Edge Threshold:** 50 pixels from screen edge
- **Pan Speed:** 5 pixels per frame
- **Smooth Animation:** Uses requestAnimationFrame
- **Auto-Stop:** Stops when cursor moves away from edges
- **Tool-Specific:** Only works in Select mode

## 🔄 How It Differs from Spacebar Panning

| Feature | Auto-Pan (Select Tool) | Spacebar Pan |
|---------|----------------------|--------------|
| **Activation** | Automatic at edges | Hold spacebar |
| **Tool Required** | Select Tool only | Works with any tool |
| **Hands-Free** | Yes | No (hold key) |
| **Speed** | Continuous, smooth | Manual control |
| **Best For** | Navigation | Precise positioning |

## 🎨 Workflow Examples

### Example 1: Large Mind Map Navigation
```
1. Click Select Tool
2. Start in center of your mind map
3. Move cursor to RIGHT edge
4. Canvas pans left, revealing right side of map
5. Move cursor to BOTTOM edge  
6. Canvas pans up, revealing bottom of map
7. Navigate entire map without clicking!
```

### Example 2: Moving Objects Across Canvas
```
1. Select Tool active
2. Click object to select it
3. Start dragging object
4. Move cursor to edge while dragging
5. Canvas pans automatically
6. Continue dragging object to new location
7. Release when done
```

### Example 3: Reviewing Team Work
```
1. Select Tool active
2. Move cursor to TOP-LEFT corner
3. Canvas pans to show top-left area
4. Move cursor to TOP-RIGHT corner
5. Canvas pans to show top-right area
6. Continue touring the canvas
```

## 🐛 Troubleshooting

### Auto-pan not working?
✅ Make sure Select Tool is active (pointer icon)  
✅ Move cursor within 50px of screen edge  
✅ Make sure you're not in text editing mode (press ESC)

### Panning too fast?
✅ Move cursor slightly away from edge to slow down  
✅ Or use Spacebar + Drag for manual control

### Panning in wrong direction?
✅ This is intentional! When cursor is on LEFT edge, canvas pans RIGHT to reveal content on the left  
✅ Think of it as "pushing" the canvas away from the edge

## 🎓 Quick Reference

| Cursor Position | Canvas Movement | What You See |
|----------------|-----------------|--------------|
| **Left Edge** | Pans Right → | Content from the left |
| **Right Edge** | ← Pans Left | Content from the right |
| **Top Edge** | Pans Down ↓ | Content from above |
| **Bottom Edge** | ↑ Pans Up | Content from below |

## 🚀 Try It Now!

1. Open your board: http://localhost:5173
2. Click **Select Tool** (first icon - pointer)
3. Move your cursor to the **left edge** of the screen
4. Watch the canvas pan automatically!
5. Try all four edges
6. Combine with zoom for powerful navigation

---

**Enjoy effortless navigation! 🎨✨**

*No more holding spacebar - just move your cursor to the edges!*
