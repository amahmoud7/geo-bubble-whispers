# Lo App - Complete Wireframe Specifications for Figma

## Table of Contents
1. [Design System & Tokens](#design-system--tokens)
2. [Navigation Structure](#navigation-structure)
3. [Page Wireframes](#page-wireframes)
4. [Component Library](#component-library)
5. [User Flows](#user-flows)

---

## Design System & Tokens

### Color Palette
```
Primary Colors:
- lo-electric-blue: #00B4D8 (Primary CTA, active states)
- lo-teal: #14B8A6 (Accent, secondary actions)
- lo-midnight: #0F172A (Dark backgrounds, bottom nav)

Grays:
- lo-gray-50: #F8FAFC (Light backgrounds)
- lo-gray-100: #F1F5F9
- lo-gray-200: #E2E8F0 (Borders, dividers)
- lo-gray-400: #94A3B8 (Secondary text)
- lo-gray-600: #475569
- lo-gray-800: #1E293B (Cards on dark bg)

Semantic Colors:
- Success: #10B981
- Error: #EF4444
- Warning: #F59E0B
- Info: #3B82F6
```

### Typography
```
Font Family: System fonts (Inter fallback)

Headings:
- H1: 32px/40px, Bold (Page titles)
- H2: 24px/32px, Semibold (Section headers)
- H3: 20px/28px, Semibold (Card headers)
- H4: 16px/24px, Semibold (Subsections)

Body:
- Large: 16px/24px, Regular (Main content)
- Base: 14px/20px, Regular (Standard text)
- Small: 12px/16px, Regular (Metadata)
- XSmall: 11px/14px, Regular (Labels, tags)

Weights: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
```

### Spacing System
```
Base unit: 4px
Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80

Common patterns:
- Card padding: 24px
- Section spacing: 32px
- Element gaps: 12px-16px
- Screen padding: 24px
```

### Border Radius
```
- sm: 8px (Chips, small buttons)
- md: 12px (Input fields)
- lg: 16px (Cards)
- xl: 20px (Featured cards)
- 2xl: 24px (Modals)
- 3xl: 32px (Large containers)
- full: 9999px (Pills, avatars)
```

### Shadows
```
- sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
- base: 0 1px 3px 0 rgb(0 0 0 / 0.1)
- md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
- lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
- xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)
```

---

## Navigation Structure

### Bottom Navigation (Fixed, Global)
**Position:** Fixed bottom, 72px height + safe area
**Background:** lo-midnight (rgba(15, 23, 42, 0.95)) with backdrop blur
**Items (5):**

```
[Home] [Discover] [Create (+)] [Inbox] [Profile]

Active State: lo-electric-blue color
Inactive State: lo-gray-400 color
Center Button: 64px circle, lo-electric-blue bg, shadow-xl
Icons: 20px (24px for center)
Label: 11px below icon
```

**Spacing:**
- Horizontal padding: 16px
- Vertical padding: 12px
- Item gap: evenly distributed
- Safe area inset bottom: env(safe-area-inset-bottom)

---

## Page Wireframes

### 1. Landing Page (`/landing`)

**Layout:** Full-page marketing site

#### Sections:

**1.1 Navigation Bar**
- Height: 64px
- Logo: "Lo" with wave icon (left)
- Links: Features, About, Pricing (center)
- CTA: "Get Started" button (right)

**1.2 Hero Section**
- Full viewport height
- Gradient background: sky-100 to white
- Title: "Connect Through Location" (48px, bold)
- Subtitle: "Share moments that matter, exactly where they happen"
- CTA Buttons: "Download App" + "Learn More"
- Hero illustration/mockup

**1.3 Features Section**
- 3-column grid (responsive)
- Feature cards with icons:
  - Location-based messaging
  - Live streaming
  - Story sharing
  - Real-time events

**1.4 Statistics Section**
- 4 stat counters in row
- Large numbers with labels
- Animated on scroll

**1.5 Testimonials Section**
- Carousel of user testimonials
- Avatar + Name + Quote
- 3 visible at once

**1.6 Call-to-Action Section**
- Centered content
- Download buttons (iOS, Android)

**1.7 Footer**
- Company links
- Social media icons
- Copyright notice

---

### 2. Authentication Page (`/auth`)

**Layout:** Centered card (400px max width)

#### Components:

**2.1 Auth Card**
- White background, rounded-3xl
- Padding: 32px
- Shadow: lg

**2.2 Tab Switcher**
- "Sign In" / "Sign Up" tabs
- Active tab: underline + bold

**2.3 Login Form**
```
- Email field (h: 48px, rounded-xl)
- Password field (h: 48px, rounded-xl)
- "Forgot password?" link (right aligned)
- Submit button (h: 48px, rounded-xl, full width)
- Divider with "or"
- Social buttons:
  - Google (white, with logo)
  - Apple (black, with logo)
```

**2.4 Register Form**
```
- Name field
- Email field
- Password field
- Confirm password field
- Terms checkbox
- Submit button
- Social options (same as login)
```

---

### 3. Home/Map Page (`/home`, `/`)

**Layout:** Full-screen map with overlays

#### Structure:

**3.1 Header (Top, Fixed)**
```
Position: Absolute top
Background: Transparent with blur
Padding: 24px horizontal, 16px + safe-area-inset-top

Components:
- Logo badge (32px, rounded-2xl, white bg)
- App name "Lo" (24px, bold)
- Right actions:
  - Spectacles toggle
  - Events toggle
```

**3.2 Search Bar**
```
Below header (56px gap)
Height: 48px
Rounded: 2xl
Background: white/90 with backdrop blur
Shadow: lg
Icon: Search (left, 20px)
Placeholder: "Search for places or people"
```

**3.3 Map View**
```
Full-screen Google Maps
Markers: Custom styled pins
- Blue pulse for user location
- Event markers: Red with icon
- Message markers: Gray/teal gradient
Clustering: On zoom out
```

**3.4 Bottom Navigation**
- See global nav section
- Create button triggers post modal

**3.5 Floating Action Buttons (Right Side)**
```
Stack of circular buttons (48px each)
16px from right edge
Bottom: 96px (above nav)

Buttons:
- Recenter location (with target icon)
- Layer toggle
- 3D view toggle
```

---

### 4. Explore/Discover Page (`/explore`)

**Layout:** Scrollable feed with sections

#### Structure:

**4.1 Top Bar**
```
Height: 56px + safe-area-inset-top
Background: White
Shadow: sm
Border bottom: 1px slate-200

Content:
- Back button (left)
- Title: "Explore" (center)
- Subtitle: "discover" (below, 12px, gray)
```

**4.2 Search Section**
```
Gradient background: lo-teal/5 to blue-50/50
Rounded: 3xl
Padding: 24px
Margin: 0 16px

Components:
- Header: "Discover"
- Subtitle: "Events, places, and people near you"
- Search input (56px height, rounded-2xl)
```

**4.3 Filter Tabs**
```
Horizontal scroll
Padding: 16px horizontal
Gap: 8px

Pills:
- Nearby (default selected)
- Trending
- Events
- Friends
- Saved

Style: Rounded-full, 40px height
Selected: lo-teal bg, white text
Unselected: gray-100 bg, gray-600 text
```

**4.4 Trending Events Section**
```
Title: "Trending Events"
Subtitle: "Hand-picked happenings near you"
Action: "View all" link

Grid: 1-2-3 columns (responsive)
Card style:
- Height: 300px
- Rounded: 3xl
- Gradient header (192px height)
- Live badge (top-left, red pulse)
- Content section (bottom, 108px)
  - Event title (18px, bold, 2 lines max)
  - Location (14px with pin icon)
  - Date/time (12px, uppercase, slate-500)
```

**4.5 Suggested Posts Section**
```
Title: "Suggested Posts"
Subtitle: "A mix of public Los and highlights from friends"

Grid: 1-2 columns
Card style:
- White bg, rounded-3xl
- Padding: 24px
- Shadow: sm
- Content: 3 lines max
- Footer with location + date
```

**4.6 Interactive Map Card**
```
Full-width card
Gradient header with title
Map height: 500px
Embedded TabbedMapViewList component
Reset view button (top-right)
```

**4.7 Bottom Navigation**
- Standard global nav

---

### 5. Profile Page (`/profile`)

**Layout:** Scrollable profile with cards

#### Structure:

**5.1 Top Bar**
```
Same as Explore
Title: User's name
Subtitle: "profile"
Leading: Back button
Trailing: Settings icon
```

**5.2 Profile Header Card**
```
Gradient background: slate-900 via slate-800
Rounded: 3xl
Padding: 24px
Radial overlay: teal glow (top)

Layout:
- Avatar (96px, bottom-left)
  - Camera button overlay (36px circle)
- Name + Username (beside avatar)
- Stats row (right side):
  - Posts count
  - Followers count
  - Following count
  (Each in glass morphism card, 12px rounded)
```

**5.3 Bio Card**
```
White bg, rounded-3xl
Padding: 20px
Shadow: sm
Margin-top: 32px

Content:
- Bio text (editable)
- Metadata chips:
  - Location (if set)
  - Join date
- Action buttons:
  - "Edit Profile" (full width, slate-900)
  - "Share" (full width, secondary)
```

**5.4 Highlights Section**
```
Title: "HIGHLIGHTS" (uppercase, 12px, tracked)
Action: "Manage" button

Horizontal scroll of circles:
- "New" circle (dashed border)
- Highlight circles (gradient border)
- Size: 64px
- Label below (12px)
```

**5.5 Content Tabs**
```
3 pills: Posts / Saved / Tagged
Full width, equal distribution
Height: 44px
Selected: white bg with shadow
Unselected: transparent
```

**5.6 Posts Grid**
```
3 columns, 1px gaps
Cards: Rounded-2xl
Aspect ratio: 1:1
Video badge: bottom-right

Empty state:
- Rounded-3xl card
- Center text: "Share your first Lo..."
```

**5.7 Bottom Navigation**
- Standard global nav

---

### 6. Inbox/Messages Page (`/inbox`)

**Layout:** List view with conversations

#### Structure:

**6.1 Top Bar**
```
Title: User's email (truncated)
Subtitle: "inbox"
Leading: Back button
Trailing: New conversation button (+)
```

**6.2 Tab Switcher**
```
2 pills with icons:
- Messages (MessageCircle icon)
- Requests (Users icon)

Full width, equal split
Height: 48px
```

**6.3 Search Bar**
```
Height: 44px
Rounded: full
Background: white
Shadow: sm
Placeholder: "Search conversations"
Icon: Search (left)
```

**6.4 Conversation List**
```
Each item:
- Height: 80px
- Padding: 16px
- Border bottom: 1px slate-100
- Hover: slate-50 bg

Layout per item:
- Avatar (48px, left)
  - Online indicator (12px dot, bottom-right)
- Content (center):
  - Name (14px, bold)
  - Last message preview (14px, gray, 1 line)
- Right column:
  - Timestamp (12px, gray, top)
  - Unread badge (16px circle, lo-electric-blue)
```

**6.5 New Conversation Sheet**
```
When + button clicked:
- Title: "Start a conversation"
- Subtitle: "Suggested people you might know"

User cards:
- Rounded-2xl
- Border: slate-100
- Padding: 12px
- Layout: Avatar (48px) + Name + Username + Message icon
```

**6.6 Empty State (Requests tab)**
```
Center aligned:
- Icon: MessageCircle (40px, gray)
- Text: "You have no message requests yet."
```

**6.7 Bottom Navigation**
- Standard global nav

---

### 7. Chat/Conversation Page (`/chat/:id`)

**Layout:** Message thread view

#### Structure:

**7.1 Header**
```
Height: 64px + safe-area
Background: White
Shadow: sm

Layout:
- Back button (left)
- Avatar (32px, center-left)
- Name + Online status (center)
- Video call icon (right)
- More menu (right)
```

**7.2 Messages List**
```
Scrollable container
Padding: 16px
Gap between messages: 8px

Message bubbles:
- Outgoing (right):
  - Background: lo-electric-blue
  - Text: white
  - Max width: 75%
  - Rounded: 2xl (flattened on bottom-right)

- Incoming (left):
  - Background: slate-100
  - Text: slate-900
  - Max width: 75%
  - Rounded: 2xl (flattened on bottom-left)

Timestamp: 11px, gray, below bubble
Read receipts: checkmarks below outgoing
```

**7.3 Message Input Bar**
```
Position: Fixed bottom
Height: 64px
Background: white
Border top: 1px slate-200
Padding: 12px

Layout:
- Attachment button (left, 40px)
- Text input (center, auto-grow)
  - Rounded: full
  - Background: slate-100
  - Padding: 12px 16px
- Send button (right, 40px, lo-electric-blue)
  (Only visible when text entered)
```

---

### 8. Settings Page (`/settings`)

**Layout:** Grouped list of settings

#### Structure:

**8.1 Top Bar**
```
Title: "Settings"
Subtitle: "preferences"
Leading: Back button
```

**8.2 Settings Sections**
```
Each section:
- Card style: white bg, rounded-3xl, padding 16px
- Margin between sections: 24px
- Section title: 12px, uppercase, tracked, gray-400

Section groups:
1. Profile & Display
2. Notifications
3. Privacy & Safety
4. Map & Location
5. Community & Support
```

**8.3 Setting Item Types**

**Toggle Item:**
```
Layout:
- Icon (16px, left)
- Label + Description (center)
- Switch control (right)
Height: auto (3 lines max)
Padding: 12px
Rounded: 2xl
Hover: slate-100 bg
```

**Link Item:**
```
Layout:
- Icon (16px, left)
- Label + Description (center)
- Chevron right (16px, right)
Same styling as toggle
Clickable
```

**8.4 Dark Mode Toggle**
```
Special toggle item
Icon changes: Sun <-> Moon
Label: "Dark Mode"
Description: "Reduce glare and rest your eyes..."
```

---

### 9. Create Lo Modal (`/home` with modal)

**Layout:** Bottom sheet (88vh height)

#### Structure:

**9.1 Sheet Header**
```
Height: 64px
Background: lo-midnight
Rounded top: 32px
Border: lo-gray-800

Layout:
- Title: "New Lo" (left, 18px, white)
- Post button (right, lo-electric-blue text)
  - Disabled state: 40% opacity
```

**9.2 Post Type Selector (Hidden in current version)**
```
3 chips:
- Text (Type icon)
- Media (Camera icon)
- Live (Radio icon)

Height: 48px each
Full width
Rounded: 2xl
```

**9.3 Content Area**

**For Text/Media posts:**
```
Textarea:
- Height: 140px min
- Rounded: 2xl
- Background: lo-gray-800
- Text: white (16px)
- Placeholder: "What's on your mind?"
- Max length: 280 chars
- Counter: bottom-right (12px, gray)

Media preview (if attached):
- Thumbnail: 128px square
- Rounded: 2xl
- Remove button: top-right overlay
```

**9.4 Action Buttons**
```
Stack of 4 buttons:
Each button:
- Height: 56px
- Rounded: 2xl
- Background: lo-gray-800
- Hover: lo-gray-800/70
- Icon container: 48px square, lo-electric-blue/20 bg, rounded-xl
- Label: white, 14px

Buttons:
1. Photo/Video (ImageIcon)
2. Location (MapPin) - with sublabel if selected
3. Mood (Smile)
4. Public toggle (ShieldCheck) - with switch
```

**9.5 Location Picker (Expanded)**
```
Card style:
- Background: lo-gray-800
- Rounded: 2xl
- Padding: 16px

Header:
- "Choose Location" (left)
- "Done" button (right)

Map:
- Height: 224px (or 320px when expanded)
- Rounded: 2xl
- Interactive Google Map
- Custom marker on selected location

Location display:
- Address text (14px, lo-gray-300)
- Coordinates (12px, lo-gray-400)
```

**9.6 Live Stream Camera (for Live posts)**
```
Camera view:
- Full width
- Height: 320px
- Rounded: 2xl
- Video preview with controls

Title input:
- Above camera
- Placeholder: "What are you streaming?"

Stream controls:
- Start/Stop button
- Viewer count
- Stream quality indicator
```

**9.7 Footer**
```
Height: 88px
Padding: 24px

Post button:
- Height: 56px
- Rounded: full
- Background: lo-electric-blue
- Text: "Post Lo" (white, 16px, semibold)
- Shadow: xl
- Disabled when no content
```

---

### 10. Profile Setup Page (`/profile-setup`)

**Layout:** Onboarding wizard

#### Structure:

**10.1 Progress Indicator**
```
Top: 24px
Width: 90%
Center aligned

Style:
- Steps: 1, 2, 3 (circles)
- Lines between steps
- Active: lo-electric-blue
- Completed: lo-electric-blue with checkmark
- Upcoming: gray
```

**10.2 Avatar Upload**
```
Step 1:
- Large circle (160px)
- Dashed border
- Camera icon center
- Label: "Add a profile picture"
- File input (hidden)
- Skip button (bottom)
```

**10.3 Profile Form**
```
Step 2:
- Full name field
- Username field
- Bio textarea (optional)
- Location field (optional)
- Next button
```

**10.4 Preferences**
```
Step 3:
- Notification toggle
- Location services toggle
- Privacy settings
- Complete button
```

---

## Component Library

### 1. Buttons

**Primary Button**
```
Height: 48px
Padding: 16px 32px
Rounded: xl
Background: lo-electric-blue
Text: white, 14px, semibold
Hover: opacity 90%
Shadow: md
```

**Secondary Button**
```
Same as primary
Background: transparent
Border: 2px lo-electric-blue
Text: lo-electric-blue
```

**Ghost Button**
```
No background
No border
Text: lo-gray-600
Hover: lo-gray-100 bg
```

**Icon Button**
```
Square: 40px or 48px
Rounded: full
Center icon
Hover: bg change
```

### 2. Form Elements

**Text Input**
```
Height: 48px
Padding: 12px 16px
Rounded: xl
Border: 1px slate-200
Focus: 2px ring lo-electric-blue/50
Placeholder: slate-400
Font: 14px
```

**Textarea**
```
Min height: 120px
Padding: 12px 16px
Rounded: xl
Resize: vertical
Same border/focus as input
```

**Switch Toggle**
```
Width: 44px
Height: 24px
Rounded: full
Track: slate-200 (off), lo-electric-blue (on)
Thumb: 20px circle, white
Animation: 200ms
```

**Checkbox**
```
Size: 20px
Rounded: md
Border: 2px slate-300
Checked: lo-electric-blue fill with white checkmark
```

### 3. Cards

**Standard Card**
```
Background: white
Rounded: 3xl
Padding: 24px
Shadow: sm
Border: 1px slate-100
Hover: shadow-md (if interactive)
```

**Elevated Card**
```
Same as standard
Shadow: lg
Border: 1px slate-200
```

**Glass Card (Dark)**
```
Background: lo-gray-800/80
Backdrop blur: sm
Rounded: 2xl
Border: 1px lo-gray-700
```

### 4. Chips/Pills

**Chip Component**
```
Height: 40px
Padding: 12px 20px
Rounded: full
Font: 14px, medium

States:
- Default: slate-100 bg, slate-600 text
- Selected: lo-teal bg, white text
- Hover: opacity 80%
```

### 5. Avatars

**Sizes:**
```
xs: 24px
sm: 32px
md: 40px
lg: 48px
xl: 64px
2xl: 96px
3xl: 128px
```

**Style:**
```
Rounded: full
Border: optional (2px white)
Fallback: First letter, centered
Online indicator: 8px dot, bottom-right, border: 2px white
```

### 6. Badges

**Status Badge**
```
Height: 24px
Padding: 4px 12px
Rounded: full
Font: 12px, semibold

Types:
- Live: red-500 bg, white text, pulse animation
- Online: emerald-500 bg
- Offline: slate-400 bg
```

### 7. Navigation Components

**Top Bar (AppTopBar)**
```
Height: 56px + safe-area-inset-top
Background: white or transparent with blur
Shadow: sm (optional)
Padding: 12px 24px

Layout:
- Leading slot (40px, left)
- Title + Subtitle (center)
- Trailing slot (40px, right)

Title: 16px, semibold
Subtitle: 12px, slate-500, uppercase, tracked
```

**Bottom Navigation**
- See Navigation Structure section above

### 8. Modals/Sheets

**Bottom Sheet**
```
Height: 70-90% of viewport
Rounded top: 32px
Background: Based on theme
Backdrop: rgba(0,0,0,0.5) with blur
Animation: slide up
Dismissible: swipe down or tap backdrop
```

**Dialog Modal**
```
Max width: 480px
Centered on screen
Rounded: 3xl
Padding: 32px
Shadow: 2xl
Backdrop: same as sheet
```

### 9. Lists

**Conversation List Item**
```
Height: 80px
Padding: 16px
Border bottom: 1px slate-100
Hover: slate-50 bg

Layout: Avatar (48px) + Content + Metadata
```

**Settings List Item**
```
Height: auto
Padding: 12px
Rounded: 2xl
Hover: slate-100 bg

Layout: Icon + Label/Description + Control/Chevron
```

### 10. Map Components

**Custom Map Marker**
```
User location:
- Circle: 12px, lo-electric-blue fill
- Pulse ring: 24px, lo-electric-blue/40, animation

Message marker:
- SVG pin shape
- Color: slate-600 or lo-teal (based on type)
- Height: 40px

Event marker:
- SVG pin with icon
- Color: red-500
- Icon: ticket/calendar
- Height: 48px
```

**Map Controls**
```
Floating buttons stack:
- Size: 48px circle
- Background: white
- Shadow: lg
- Icon: 20px
- Positioned: right side, 96px from bottom
- Gap: 12px between buttons
```

---

## User Flows

### Flow 1: New User Onboarding

```
Landing Page
  ↓ [Get Started]
Auth Page (Sign Up)
  ↓ [Complete Registration]
Welcome Page (optional)
  ↓ [Continue]
Profile Setup (Step 1: Avatar)
  ↓ [Next]
Profile Setup (Step 2: Info)
  ↓ [Next]
Profile Setup (Step 3: Preferences)
  ↓ [Complete]
Home/Map Page
```

### Flow 2: Create and Post a Message

```
Home Page
  ↓ [Tap + button]
Create Lo Modal Opens
  ↓ [Select Post Type]
  ↓ [Enter Content]
  ↓ [Select Location on Map]
  ↓ [Adjust Privacy]
  ↓ [Tap Post Lo]
Modal Closes
  ↓
Message appears on map
  ↓ [Tap marker]
Message Detail View
```

### Flow 3: View and Explore Events

```
Home Page
  ↓ [Enable Events Toggle]
Map shows event markers
  ↓ [Navigate to Explore]
Explore Page
  ↓ [View Trending Events]
  ↓ [Tap Event Card]
Event Detail Modal
  ↓ [View Details, Share, Get Directions]
  ↓ [Close or Navigate]
```

### Flow 4: Direct Messaging

```
Inbox Page
  ↓ [Tap + to Start Conversation]
New Conversation Sheet
  ↓ [Select User]
Chat/Conversation Page
  ↓ [Type Message]
  ↓ [Attach Media (optional)]
  ↓ [Send]
Real-time message appears
  ↓ [Continue conversation]
```

### Flow 5: Profile Management

```
Profile Page
  ↓ [Tap Edit Profile]
Edit Bio Mode
  ↓ [Update Bio]
  ↓ [Save]
  ↓ [Tap Settings Icon]
Settings Page
  ↓ [Adjust Preferences]
  ↓ [Back to Profile]
```

---

## Figma Implementation Notes

### Artboard Setup
```
Mobile Frames:
- iPhone 14 Pro: 393 x 852
- iPhone 14 Pro Max: 430 x 932
- Android (Generic): 360 x 800

Desktop Frames (optional):
- 1440 x 900 (for web version)

Safe Areas:
- Top: 47px (status bar + notch)
- Bottom: 34px (home indicator)
```

### Component Organization

**Suggested Frame Structure:**
```
1. Cover Page (Overview + Table of Contents)
2. Design System
   - Colors
   - Typography
   - Spacing
   - Shadows
   - Icons
3. Component Library
   - Buttons
   - Forms
   - Cards
   - Navigation
   - Modals
   - Lists
4. Page Templates
   - Landing
   - Auth
   - Home/Map
   - Explore
   - Profile
   - Inbox
   - Chat
   - Settings
   - Create Lo Modal
5. User Flows
   - Flow diagrams with screen transitions
```

### Auto Layout Best Practices

1. All cards and containers should use auto-layout
2. Set spacing constraints:
   - Horizontal padding: 24px (left/right)
   - Vertical spacing: 16px (between elements)
3. Make buttons resizable with min/max constraints
4. Use absolute positioning only for:
   - Fixed navigation bars
   - Floating action buttons
   - Overlays

### Component Variants

Create variants for:
- Button states (default, hover, active, disabled)
- Input states (default, focus, error, disabled)
- Card states (default, hover, selected)
- Theme modes (light, dark)
- Navigation states (active, inactive)

### Naming Conventions

```
Components: PascalCase (Button, InputField, NavItem)
Variants: lowercase-with-dashes (primary-button, secondary-button)
Colors: category/name (primary/electric-blue, gray/400)
Spacing: t-shirt sizes (xs, sm, md, lg, xl, 2xl, 3xl)
```

### Plugins Recommended

1. **Contrast** - Check WCAG compliance
2. **Content Reel** - Generate mock data
3. **Unsplash** - Real photos for mockups
4. **Iconify** - Lucide icons
5. **Auto Flow** - Create flow diagrams
6. **Design Lint** - Quality checks

---

## Interactions & Animations

### Micro-interactions

**Button Press:**
```
Scale: 0.96
Duration: 100ms
Easing: ease-out
```

**Card Hover:**
```
Lift: shadow lg → xl
Duration: 200ms
Easing: ease-in-out
```

**Modal Enter:**
```
From: translateY(100%)
To: translateY(0)
Duration: 300ms
Easing: ease-out
Backdrop: fade in (200ms)
```

**Live Badge Pulse:**
```
Scale: 1 → 1.1 → 1
Opacity: 1 → 0.8 → 1
Duration: 2000ms
Loop: infinite
```

**Tab Switch:**
```
Selected indicator slide
Duration: 200ms
Easing: ease-in-out
```

### Page Transitions

```
Standard: Slide (300ms, ease-in-out)
Modal: Slide up (250ms, ease-out)
Sheet: Slide up + bounce (300ms, spring)
Back: Slide right (250ms, ease-in)
```

---

## Responsive Breakpoints

```
Mobile: < 768px (default)
Tablet: 768px - 1024px
Desktop: > 1024px

Adjustments per breakpoint:
- Tablet: 2-column grids, larger touch targets
- Desktop: 3-column grids, hover states, fixed sidebars
```

---

## Accessibility Notes

### Color Contrast
- All text must meet WCAG AA (4.5:1 for body, 3:1 for large text)
- Interactive elements: 3:1 minimum

### Touch Targets
- Minimum: 44x44px (iOS HIG)
- Recommended: 48x48px
- Spacing between: 8px minimum

### Text Sizing
- Minimum body text: 14px
- Scale up for accessibility settings
- Line height: 1.5 minimum

### Focus States
- Visible focus ring: 2px solid lo-electric-blue
- Offset: 2px
- Apply to all interactive elements

---

## Export Settings

**For Development Handoff:**
```
- SVG for icons (optimized)
- PNG @2x and @3x for images
- Design tokens as JSON
- Component specs as CSS/Tailwind classes
```

**For Presentation:**
```
- High-fidelity mockups: PNG @2x
- Prototype recordings: MP4
- User flow diagrams: PDF
```

---

## Version History

- v1.0 (2025-01-09): Initial wireframe specifications based on current app implementation
- This document reflects the current state of the Lo application codebase

---

## Notes for Designers

1. This app uses Google Maps extensively - consider map overlays and custom styling
2. Live streaming is a core feature - design for camera permissions and real-time UI
3. Location privacy is important - clear indicators for public/private posts
4. Dark mode support via theme context - design both light and dark variants
5. iOS mobile-first approach with Capacitor - follow iOS design patterns
6. Real-time features require loading states and optimistic updates
7. Stories feature similar to Instagram/Snapchat - ephemeral content (24h)

---

**End of Wireframe Specifications**

For questions or clarifications, refer to:
- `/CLAUDE.md` - Technical implementation details
- `/.claude/PROJECT_CONTEXT.md` - Business context and requirements
- `/src/components/` - Component implementation reference
