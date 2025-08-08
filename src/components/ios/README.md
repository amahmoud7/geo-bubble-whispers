# iOS-Native React Components

This directory contains iOS-native React components designed specifically for the Geo Bubble Whispers mobile application. These components follow Apple's Human Interface Guidelines and provide a native iOS user experience.

## Design Principles

### 1. Touch-First Design
- All components use minimum 44px touch targets as per iOS accessibility guidelines
- Touch feedback with appropriate visual states (pressed, active, disabled)
- Gesture recognition for swipe, long press, and pan interactions

### 2. iOS Visual Language
- System colors that adapt to light/dark mode
- iOS typography scale (Large Title, Title 1-3, Headline, Body, etc.)
- Native blur effects and backdrop filters
- Proper safe area handling for devices with notches/home indicators

### 3. Motion & Animation
- Spring animations that feel natural and responsive
- Respects `prefers-reduced-motion` for accessibility
- Smooth transitions between screens and modal presentations

### 4. Accessibility
- Full VoiceOver support
- High contrast mode compatibility
- Keyboard navigation support
- Focus indicators for non-touch interactions

## Component Categories

### Navigation Components

#### `TabNavigator`
Bottom tab bar navigation following iOS design patterns.
- Automatically hides on auth and onboarding screens
- Badge support for notifications
- Proper safe area handling

#### `StackNavigator`
Manages screen stacks with push/pop navigation.
- Slide animations between screens
- Back gesture support
- Memory efficient screen management

#### `MobileHeader`
iOS-style navigation bar with back buttons and actions.
- Large title support for main screens
- Blur effects for overlaid content
- Customizable left/right button areas

### Layout Components

#### `MobileLayout`
Main layout wrapper that handles safe areas and tab bar spacing.
- Automatic safe area insets
- Tab bar height compensation
- Background color management

#### `BottomSheet`
Contextual information display with snap points.
- Multiple snap positions (40%, 70%, 95%)
- Drag gestures for repositioning
- Backdrop dismissal

### Touch & Gesture Components

#### `TouchableArea`
Enhanced touch handling with proper feedback.
- Long press support with customizable delay
- Active state visual feedback
- Accessibility compliant touch targets

#### `SwipeGestures`
Gesture recognition for swipe interactions.
- Four-directional swipe detection
- Velocity and distance thresholds
- Customizable scroll prevention

### Modal & Presentation Components

#### `MobileModal`
iOS-style modal presentations.
- Three presentation styles: fullScreen, pageSheet, formSheet
- Swipe-to-dismiss functionality
- Proper backdrop handling

#### `ActionSheet`
iOS action sheet for contextual actions.
- Destructive action support
- Cancel button with proper styling
- Icon support for options

### Form Components

#### `MobileInput`
Mobile-optimized text input with iOS styling.
- 16px font size to prevent zoom on iOS
- Left/right icon support  
- Error state handling

#### `MobileTextArea`
Auto-resizing textarea for longer text input.
- Dynamic height adjustment
- Proper keyboard handling
- Consistent styling with inputs

#### `MobileButton`
Touch-optimized button with multiple variants.
- Primary, secondary, destructive, ghost variants
- Loading state with spinner
- Icon support (left/right)

#### `SegmentedControl`
iOS-style segmented control for option selection.
- Smooth selection animation
- Multiple segment support
- Accessible keyboard navigation

### Map Components

#### `MobileMapView`
Touch-optimized map interface designed for mobile.
- Floating action buttons for common actions
- Bottom sheet integration for message display
- Gesture-friendly map controls

## Usage Examples

### Basic Navigation Setup

```tsx
import { TabNavigator, MobileLayout } from '@/components/ios';

function App() {
  return (
    <MobileLayout>
      <Routes>
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
      </Routes>
    </MobileLayout>
  );
}
```

### Modal Presentation

```tsx
import { MobileModal, MobileButton } from '@/components/ios';

function ExampleScreen() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <MobileButton onPress={() => setShowModal(true)}>
        Show Modal
      </MobileButton>
      
      <MobileModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Example Modal"
        presentationStyle="pageSheet"
      >
        <div className="p-6">
          <p>Modal content goes here</p>
        </div>
      </MobileModal>
    </div>
  );
}
```

### Form with iOS Components

```tsx
import { MobileForm, MobileInput, MobileButton } from '@/components/ios';

function ContactForm() {
  return (
    <MobileForm onSubmit={handleSubmit}>
      <MobileInput
        label="Name"
        placeholder="Enter your name"
        required
      />
      <MobileInput
        label="Email"
        type="email"
        placeholder="Enter your email"
        required
      />
      <MobileButton variant="primary" type="submit">
        Submit
      </MobileButton>
    </MobileForm>
  );
}
```

## Styling

The components use a CSS design system located in `/src/styles/ios-design-system.css` that includes:

- iOS system colors with dark mode support
- Typography scale matching iOS standards
- Spacing and border radius tokens
- Safe area CSS variables
- Accessibility improvements

Import the design system CSS in your main CSS file:

```css
@import '../styles/ios-design-system.css';
```

## Browser Support

These components are optimized for:
- Safari on iOS 14+
- Chrome on Android 10+
- Modern desktop browsers for development

## Performance Considerations

- Components use CSS transforms for animations (hardware accelerated)
- Gesture handlers are optimized with proper event passive flags
- Modal/sheet components use React.lazy for code splitting when possible
- Touch feedback uses CSS transitions instead of JavaScript animations

## Contributing

When adding new components:

1. Follow iOS Human Interface Guidelines
2. Ensure 44px minimum touch targets
3. Support dark mode via CSS variables
4. Include proper TypeScript types
5. Add accessibility attributes (ARIA labels, roles)
6. Test with VoiceOver and keyboard navigation
7. Respect `prefers-reduced-motion`

## Testing

Components should be tested with:
- Various iOS device sizes and orientations
- Light and dark mode
- VoiceOver screen reader
- High contrast mode
- Reduced motion preferences