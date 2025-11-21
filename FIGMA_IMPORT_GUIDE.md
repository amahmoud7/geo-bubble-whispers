# Step-by-Step Guide: Import Lo App into Figma (Most Accurate Method)

## Prerequisites

1. Figma desktop app or web access
2. Files from this repo:
   - `figma-tokens-studio.json` (Design tokens)
   - `WIREFRAME_SPECIFICATIONS.md` (Reference specs)

## Phase 1: Setup Design System (30 minutes)

### Step 1: Install Tokens Studio Plugin

1. Open Figma
2. Go to **Resources** (Shift + I) or **Plugins → Browse plugins**
3. Search for **"Tokens Studio for Figma"** (formerly Figma Tokens)
4. Click **Install**

### Step 2: Import Design Tokens

1. Create a new Figma file named **"Lo App Design System"**
2. Run **Tokens Studio** plugin
3. Click **Settings** (gear icon)
4. Click **Import**
5. Select **JSON** tab
6. Upload `figma-tokens-studio.json`
7. Click **Import**

**Result:** You now have:
- ✅ Color styles (primary/electric-blue, gray/400, etc.)
- ✅ Text styles (h1, h2, body-base, etc.)
- ✅ Spacing tokens
- ✅ Border radius values
- ✅ Shadow effects

### Step 3: Verify Import

Check these in Figma:
- **Local styles** panel should show all colors
- **Text styles** should show h1-h4, body variants
- Try applying a color to a rectangle
- Try applying a text style to a text layer

---

## Phase 2: Setup Frames & Artboards (15 minutes)

### Step 4: Create Device Frames

1. Press **F** (Frame tool)
2. Choose from presets:
   - **iPhone 14 Pro** (393 × 852)
   - **iPhone 14 Pro Max** (430 × 932)
3. Or create custom: **360 × 800** (Android generic)

### Step 5: Setup Page Structure

Create these pages in your Figma file:

```
📄 Cover & Index
📄 Design System
   └─ Colors
   └─ Typography
   └─ Spacing & Layout
   └─ Components
📄 Wireframes - Mobile
   └─ Landing
   └─ Auth
   └─ Home/Map
   └─ Explore
   └─ Profile
   └─ Inbox
   └─ Chat
   └─ Settings
   └─ Modals
📄 User Flows
📄 Prototypes
```

---

## Phase 3: Build Core Components (60 minutes)

### Step 6: Create Button Component

**Primary Button:**
```
1. Rectangle:
   - Width: 200px (flexible)
   - Height: 48px (fixed)
   - Fill: colors/primary/electric-blue
   - Corner radius: 20px (xl)
   - Shadow: md

2. Text:
   - "Button Text"
   - Style: body-base (14px)
   - Weight: Semibold (600)
   - Color: White
   - Center aligned

3. Auto-layout:
   - Horizontal
   - Padding: 16px horizontal, 0px vertical
   - Spacing: 8px (for icon support)
   - Hug contents (horizontal)
   - Fixed height: 48px

4. Create component (Ctrl/Cmd + Alt + K)
5. Name: "Button/Primary"

6. Create variants:
   - Default
   - Hover (90% opacity)
   - Pressed (scale 0.96)
   - Disabled (40% opacity)
```

**Secondary Button:**
```
Same as primary, but:
- Fill: Transparent
- Stroke: 2px, colors/primary/electric-blue
- Text color: colors/primary/electric-blue
Name: "Button/Secondary"
```

### Step 7: Create Input Component

```
1. Rectangle:
   - Width: 343px (iPhone padding)
   - Height: 48px
   - Fill: White
   - Corner radius: 20px (xl)
   - Stroke: 1px, colors/gray/200

2. Placeholder text:
   - "Enter text..."
   - Style: body-base
   - Color: colors/gray/400
   - Left padding: 16px

3. Auto-layout:
   - Horizontal
   - Padding: 12px (horizontal), 16px (vertical)
   - Fixed height: 48px

4. Create component: "Input/Default"

5. Create variants:
   - Default
   - Focus (2px ring, electric-blue with 50% opacity)
   - Error (border: semantic/error)
   - Disabled (gray background)
```

### Step 8: Create Card Component

```
1. Frame:
   - Width: 343px
   - Height: Auto
   - Fill: White
   - Corner radius: 32px (3xl)
   - Shadow: sm
   - Stroke: 1px, colors/gray/100

2. Auto-layout:
   - Vertical
   - Padding: 24px
   - Spacing: 16px

3. Content (add as children):
   - Title (h3 text style)
   - Body text (body-base)
   - Optional button

4. Create component: "Card/Default"

5. Create variant "Card/Elevated" with lg shadow
```

### Step 9: Create Bottom Navigation

```
1. Frame:
   - Width: 393px (iPhone 14 Pro width)
   - Height: 72px + safe-area
   - Fill: colors/primary/midnight with 95% opacity
   - Apply backdrop blur effect

2. Create 5 nav items using auto-layout:

   Nav Item structure:
   - Icon (20px, from Lucide icons or rectangles as placeholders)
   - Label (body-xsmall, 11px)
   - Vertical auto-layout
   - Spacing: 4px

   Items: Home, Discover, Create (64px circle), Inbox, Profile

3. Horizontal auto-layout:
   - Distribute space evenly
   - Padding: 16px horizontal, 12px vertical
   - Height: 72px

4. Create component: "Navigation/Bottom"

5. Create variants for active/inactive states
```

### Step 10: Create Avatar Component

```
1. Circle:
   - Size: 48px (create variants for all sizes)
   - Fill: colors/gray/200
   - Image placeholder or initial letter

2. Optional stroke: 2px white

3. Online indicator (nested component):
   - Circle: 12px
   - Fill: semantic/success
   - Position: bottom-right
   - Stroke: 2px white

4. Create component: "Avatar/md"

5. Create size variants:
   - xs (24px)
   - sm (32px)
   - md (48px)
   - lg (64px)
   - xl (96px)
   - 2xl (128px)
```

---

## Phase 4: Build Pages (2-3 hours)

### Step 11: Home/Map Page

Follow `WIREFRAME_SPECIFICATIONS.md` Section 3.

**Key Elements:**
```
1. Background:
   - Gradient from colors/gray/50 to white
   - Or placeholder for Google Maps

2. Header (Absolute position, top):
   - Logo badge (32px circle, white bg)
   - App name "Lo" (h2 style)
   - Right toggles (Spectacles, Events)
   - Auto-layout: horizontal, space-between

3. Search Bar (below header):
   - Use Input component
   - Height: 48px
   - Icon: Search (left, 20px)
   - Shadow: lg
   - Backdrop blur

4. Map placeholder:
   - Rectangle: Full screen
   - Fill: Light gray or map screenshot
   - Add map markers as circles with shadows

5. Floating action buttons (right side):
   - 3 circular buttons (48px)
   - Stack vertically
   - Position: 96px from bottom, 16px from right

6. Bottom Navigation:
   - Use component created earlier
   - Position: Fixed to bottom
```

### Step 12: Explore Page

Follow `WIREFRAME_SPECIFICATIONS.md` Section 4.

**Key Sections:**
```
1. Top Bar:
   - Back button (icon button component)
   - Title: "Explore" (h3)
   - Subtitle: "discover" (body-small, gray)

2. Search Section:
   - Card with gradient background (teal/5 to blue-50)
   - Rounded: 3xl
   - Title + subtitle + search input

3. Filter Pills:
   - Create chip component:
     * Height: 40px
     * Rounded: full
     * Padding: 12px 20px
     * Selected: teal bg
     * Unselected: gray/100 bg
   - Horizontal scroll

4. Events Grid:
   - 2-column grid on mobile
   - Each card:
     * Gradient header (192px)
     * Live badge (top-left)
     * Content section (108px)
     * Event title (h4, 2 lines max)

5. Posts Grid:
   - 1-column on mobile
   - Use Card component
   - Location icon + text
```

### Step 13: Profile Page

Follow `WIREFRAME_SPECIFICATIONS.md` Section 5.

**Header Card:**
```
1. Frame:
   - Rounded: 3xl
   - Gradient: slate-900 → slate-800 → slate-900
   - Padding: 24px
   - Height: Auto

2. Overlay (radial gradient):
   - Position: absolute
   - Top: 0
   - Teal glow effect (40% opacity)

3. Layout:
   - Avatar (96px, bottom-left)
   - Camera button (36px circle, absolute)
   - Name + username (beside avatar)
   - Stats cards (right side, glass effect)

4. Stats cards:
   - Width: 64px
   - Height: 56px
   - Rounded: 2xl
   - Fill: white with 10% opacity
   - Number (lg, bold)
   - Label (xsmall, uppercase, tracked)
```

**Posts Grid:**
```
1. Grid layout:
   - 3 columns
   - 1px gap
   - Aspect ratio: 1:1

2. Each post card:
   - Rounded: 2xl
   - Image or text placeholder
   - Video badge (bottom-right for videos)
```

### Step 14: Inbox Page

Follow `WIREFRAME_SPECIFICATIONS.md` Section 6.

**Conversation List Item:**
```
1. Frame:
   - Width: Full (343px)
   - Height: 80px
   - Padding: 16px
   - Border bottom: 1px gray/100

2. Layout (horizontal auto-layout):
   - Avatar (48px) with online indicator
   - Content (center):
     * Name (body-base, semibold)
     * Last message (body-base, gray, 1 line clamp)
   - Right column:
     * Timestamp (body-small, gray)
     * Unread badge (16px circle, electric-blue)

3. Hover state: gray/50 background
```

### Step 15: Create Lo Modal

Follow `WIREFRAME_SPECIFICATIONS.md` Section 9.

**Bottom Sheet:**
```
1. Frame:
   - Width: 393px (device width)
   - Height: 88% viewport
   - Rounded top: 32px
   - Fill: colors/primary/midnight
   - Shadow: 2xl

2. Header:
   - Height: 64px
   - Title: "New Lo" (left)
   - Post button (right, electric-blue text)
   - Border bottom: gray/800

3. Content area:
   - Textarea (140px min-height)
   - Fill: gray/800
   - Rounded: 2xl
   - Char counter (280 limit)

4. Action buttons (stack):
   - Photo/Video
   - Location
   - Mood
   Each: 56px height, gray/800 bg, icon + label

5. Location map (expanded):
   - 224px height
   - Rounded: 2xl
   - Map placeholder
   - Done button

6. Footer:
   - Post button (56px, full width, rounded-full)
   - Electric-blue background
   - Shadow: xl
```

---

## Phase 5: Add Interactions (30 minutes)

### Step 16: Create Prototype Links

**Bottom Navigation:**
```
1. Select Home tab → Link to Home frame
2. Select Discover tab → Link to Explore frame
3. Select Create button → Open Create Lo Modal
4. Select Inbox tab → Link to Inbox frame
5. Select Profile tab → Link to Profile frame
```

**Buttons & Interactions:**
```
1. Back buttons → Navigate back
2. Cards → Open detail views
3. Modal close → Close overlay
4. Tabs → Switch between content
```

**Transition Settings:**
```
- Type: Slide
- Direction: Left/Right for pages
- Duration: 300ms
- Easing: Ease in/out
- Modal: Slide up (250ms)
```

### Step 17: Add Hover States

For each interactive element:
```
1. Create variant with "State: Hover"
2. Change: Opacity 90% or shadow elevation
3. Set interaction: While hovering → Change to variant
```

---

## Phase 6: Polish & Export (30 minutes)

### Step 18: Add Real Content

Replace placeholders with:
1. **Icons:** Download Lucide icons as SVG, import to Figma
2. **Images:** Use Unsplash plugin for realistic photos
3. **Text:** Use Content Reel plugin for realistic names, messages
4. **Avatars:** Use UI Faces or similar for profile pictures

### Step 19: Create Variants for States

For each component:
```
- Default
- Hover
- Active/Pressed
- Disabled
- Loading (if applicable)
```

### Step 20: Document Everything

Add annotations:
```
1. Use text notes for spacing
2. Add measurement lines (plugins: Redlines, Measure)
3. Create a "Developer Handoff" page with:
   - Color codes
   - Font sizes
   - Spacing values
   - Component names
```

---

## Tips for Maximum Accuracy

### 1. Take Screenshots from Running App
```bash
# Run your app locally
npm run dev

# Visit each page and take screenshots
# Import screenshots into Figma as reference layers
```

### 2. Use Browser DevTools
```
1. Open your app in Chrome
2. Press F12 → Elements tab
3. Inspect elements to see exact:
   - Colors (computed values)
   - Font sizes
   - Spacing
   - Border radius
4. Use "Color Picker" to sample exact colors
```

### 3. Extract Tailwind Classes

From your code, map Tailwind to Figma:
```
rounded-3xl → 32px border radius
p-6 → 24px padding
gap-4 → 16px spacing
text-sm → 14px font size
font-semibold → 600 weight
shadow-lg → lg shadow token
```

### 4. Use Figma Plugins

**Essential Plugins:**
```
1. Tokens Studio → Import design tokens
2. Iconify → Lucide icon library
3. Unsplash → Real images
4. Content Reel → Mock data
5. Autoflow → Create user flows
6. Contrast → Check accessibility
7. Redlines → Add measurements
```

### 5. Match Exact Dimensions

**From code to Figma:**
```typescript
// Home.tsx line 149-177
// Header padding: pt-[calc(env(safe-area-inset-top,24px)+16px)] pb-4

Figma:
- Top padding: 40px (24px safe area + 16px)
- Bottom padding: 16px
```

```typescript
// BottomNavigation.tsx line 131
// Height includes safe-area-inset-bottom

Figma:
- Base height: 72px
- Add 34px for iPhone bottom safe area
- Total: 106px
```

---

## Quality Checklist

Before considering it complete:

- [ ] All colors match design tokens exactly
- [ ] Text styles applied consistently
- [ ] Spacing follows 4px grid system
- [ ] All interactive elements have hover states
- [ ] Components are properly named and organized
- [ ] Prototype flows work correctly
- [ ] Safe areas accounted for (iOS notch, bottom bar)
- [ ] Annotations added for developers
- [ ] Tested on different device sizes
- [ ] Accessibility contrast checked (WCAG AA)

---

## Time Estimates

| Phase | Time |
|-------|------|
| Phase 1: Design System Setup | 30 min |
| Phase 2: Frames & Artboards | 15 min |
| Phase 3: Core Components | 60 min |
| Phase 4: Build Pages | 2-3 hrs |
| Phase 5: Interactions | 30 min |
| Phase 6: Polish & Export | 30 min |
| **Total** | **4.5-5.5 hours** |

---

## Result

You'll have a **pixel-perfect Figma recreation** of your Lo app with:
- ✅ Complete design system
- ✅ All 10 pages wireframed
- ✅ Interactive prototype
- ✅ Component library
- ✅ Developer handoff specs
- ✅ User flow diagrams

This is the most accurate method because it combines:
1. Automated token import (no manual errors)
2. Reference from actual code
3. Screenshots for visual verification
4. Manual crafting for precision
