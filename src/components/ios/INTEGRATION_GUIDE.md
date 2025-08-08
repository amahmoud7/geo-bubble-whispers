# iOS Components Integration Guide

This guide explains how to integrate the iOS-native components into the Geo Bubble Whispers application.

## Quick Start

### 1. Import the CSS Design System

Add the iOS design system to your main CSS file (`src/index.css`):

```css
@import './styles/ios-design-system.css';
```

### 2. Update Your Main App Component

Modify `src/App.tsx` to use mobile components when on mobile devices:

```tsx
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileApp from '@/components/ios/MobileApp';
// ... other imports

const App = () => {
  const isMobile = useIsMobile();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            {isMobile ? (
              <MobileApp />
            ) : (
              // Your existing desktop app
              <Routes>
                {/* Desktop routes */}
              </Routes>
            )}
            <Toaster />
            <Sonner />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
```

### 3. Install Required Dependencies

Ensure you have the required dependencies for animations:

```bash
npm install framer-motion
```

## Component Usage Examples

### Navigation Components

#### TabNavigator
Automatically handles bottom tab navigation for main app screens:

```tsx
import { TabNavigator } from '@/components/ios';

// TabNavigator automatically renders based on current route
// No manual implementation needed - it's included in MobileLayout
```

#### MobileHeader
Use for screen headers with iOS-style navigation:

```tsx
import { MobileHeader, TouchableArea } from '@/components/ios';
import { Settings } from 'lucide-react';

function MyScreen() {
  return (
    <div>
      <MobileHeader
        title="Screen Title"
        leftButton="back" // or "close" or "none"
        rightButton={
          <TouchableArea onPress={() => console.log('Settings')}>
            <Settings size={24} className="text-blue-600" />
          </TouchableArea>
        }
      />
      {/* Screen content */}
    </div>
  );
}
```

### Layout Components

#### MobileLayout
Wrap your entire mobile app:

```tsx
import { MobileLayout } from '@/components/ios';

function App() {
  return (
    <MobileLayout>
      <Routes>
        {/* Your routes */}
      </Routes>
    </MobileLayout>
  );
}
```

#### BottomSheet
For contextual information and actions:

```tsx
import { BottomSheet, TouchableArea } from '@/components/ios';
import { useState } from 'react';

function MyComponent() {
  const [showSheet, setShowSheet] = useState(false);

  return (
    <>
      <TouchableArea onPress={() => setShowSheet(true)}>
        Show Options
      </TouchableArea>
      
      <BottomSheet
        isOpen={showSheet}
        onClose={() => setShowSheet(false)}
        title="Options"
        snapPoints={[0.4, 0.7]}
      >
        <div className="p-4">
          {/* Sheet content */}
        </div>
      </BottomSheet>
    </>
  );
}
```

### Touch & Gesture Components

#### TouchableArea
Replace buttons and clickable elements:

```tsx
import { TouchableArea } from '@/components/ios';

function MyComponent() {
  return (
    <TouchableArea
      onPress={() => console.log('Pressed')}
      onLongPress={() => console.log('Long pressed')}
      className="p-4 bg-blue-600 rounded-xl"
    >
      <span className="text-white">Touch me</span>
    </TouchableArea>
  );
}
```

#### SwipeGestures
Add swipe interactions:

```tsx
import { SwipeGestures } from '@/components/ios';

function SwipeableCard() {
  return (
    <SwipeGestures
      onSwipeLeft={() => console.log('Swiped left')}
      onSwipeRight={() => console.log('Swiped right')}
      preventDefaultTouchMoveTypes={['horizontal']}
    >
      <div className="bg-white p-4 rounded-xl shadow">
        Swipeable content
      </div>
    </SwipeGestures>
  );
}
```

### Modal Components

#### MobileModal
For full-screen or sheet-style modals:

```tsx
import { MobileModal, MobileButton } from '@/components/ios';
import { useState } from 'react';

function ModalExample() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <MobileButton onPress={() => setShowModal(true)}>
        Show Modal
      </MobileButton>
      
      <MobileModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Example Modal"
        presentationStyle="pageSheet" // or "fullScreen" or "formSheet"
        closeOnSwipeDown
      >
        <div className="p-6">
          <p>Modal content goes here</p>
          <MobileButton 
            onPress={() => setShowModal(false)}
            className="mt-4"
          >
            Close
          </MobileButton>
        </div>
      </MobileModal>
    </>
  );
}
```

#### ActionSheet
For contextual action menus:

```tsx
import { ActionSheet } from '@/components/ios';
import { useState } from 'react';
import { Camera, Image, X } from 'lucide-react';

function ActionSheetExample() {
  const [showActions, setShowActions] = useState(false);

  return (
    <>
      <button onClick={() => setShowActions(true)}>
        Show Actions
      </button>
      
      <ActionSheet
        isOpen={showActions}
        onClose={() => setShowActions(false)}
        title="Choose an option"
        options={[
          {
            label: "Take Photo",
            onPress: () => console.log("Take photo"),
            icon: <Camera size={20} />
          },
          {
            label: "Choose from Library",
            onPress: () => console.log("Choose photo"),
            icon: <Image size={20} />
          },
          {
            label: "Delete",
            onPress: () => console.log("Delete"),
            destructive: true,
            icon: <X size={20} />
          }
        ]}
      />
    </>
  );
}
```

### Form Components

#### Complete Form Example

```tsx
import { 
  MobileForm, 
  MobileInput, 
  MobileTextArea, 
  MobileButton,
  SegmentedControl 
} from '@/components/ios';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

function ExampleForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [category, setCategory] = useState('general');

  return (
    <MobileForm onSubmit={(e) => {
      e.preventDefault();
      console.log('Form submitted');
    }}>
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
      
      <MobileInput
        label="Password"
        type={showPassword ? "text" : "password"}
        placeholder="Enter your password"
        rightIcon={showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        onRightIconPress={() => setShowPassword(!showPassword)}
        required
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <SegmentedControl
          options={[
            { label: 'General', value: 'general' },
            { label: 'Business', value: 'business' },
            { label: 'Personal', value: 'personal' }
          ]}
          value={category}
          onChange={setCategory}
        />
      </div>
      
      <MobileTextArea
        label="Message"
        placeholder="Enter your message"
        rows={4}
      />
      
      <MobileButton variant="primary" type="submit">
        Submit
      </MobileButton>
    </MobileForm>
  );
}
```

## Migration from Existing Components

### Replace Desktop Navigation

```tsx
// Before (desktop)
import Navigation from '@/components/Navigation';

// After (mobile-aware)
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileHeader } from '@/components/ios';
import Navigation from '@/components/Navigation';

function MyPage() {
  const isMobile = useIsMobile();
  
  return (
    <div>
      {isMobile ? (
        <MobileHeader title="Page Title" />
      ) : (
        <Navigation />
      )}
      {/* Page content */}
    </div>
  );
}
```

### Replace Buttons

```tsx
// Before
import { Button } from '@/components/ui/button';

// After (mobile-aware)
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { MobileButton } from '@/components/ios';

function MyComponent() {
  const isMobile = useIsMobile();
  
  return isMobile ? (
    <MobileButton variant="primary" onPress={() => console.log('clicked')}>
      Click me
    </MobileButton>
  ) : (
    <Button onClick={() => console.log('clicked')}>
      Click me
    </Button>
  );
}
```

### Replace Modals

```tsx
// Before
import { Dialog } from '@/components/ui/dialog';

// After (mobile-aware)
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog } from '@/components/ui/dialog';
import { MobileModal } from '@/components/ios';

function MyComponent() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  
  return isMobile ? (
    <MobileModal 
      isOpen={open} 
      onClose={() => setOpen(false)}
      title="Modal Title"
    >
      {/* Content */}
    </MobileModal>
  ) : (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Desktop dialog content */}
    </Dialog>
  );
}
```

## Styling with iOS Design System

### Using CSS Classes

```tsx
function MyComponent() {
  return (
    <div className="ios-bg-system p-4">
      <h1 className="ios-large-title ios-label mb-4">
        Large Title
      </h1>
      <p className="ios-body ios-secondary-label mb-4">
        Body text with secondary color
      </p>
      <div className="ios-card p-4">
        <p className="ios-callout ios-label">
          Card content
        </p>
      </div>
    </div>
  );
}
```

### Using CSS Variables

```css
.custom-component {
  background-color: var(--ios-system-background);
  color: var(--ios-label);
  padding: var(--ios-spacing-md);
  border-radius: var(--ios-radius-lg);
  box-shadow: var(--ios-shadow-sm);
}

.custom-button {
  background-color: var(--ios-blue);
  color: white;
  min-height: 44px; /* iOS touch target size */
}
```

## Accessibility Considerations

### Touch Targets
All interactive elements automatically meet the 44px minimum touch target:

```tsx
<TouchableArea className="p-2"> {/* Will be at least 44px */}
  <Icon size={20} />
</TouchableArea>
```

### Screen Reader Support
Components include proper ARIA attributes:

```tsx
<MobileButton 
  onPress={() => {}}
  aria-label="Save document"
>
  Save
</MobileButton>
```

### Reduced Motion Support
Animations respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations are automatically reduced */
}
```

## Performance Tips

1. **Lazy Loading**: Use React.lazy for heavy modal content
2. **Animation Performance**: Components use CSS transforms for hardware acceleration
3. **Touch Performance**: Touch handlers are optimized with proper passive flags
4. **Bundle Size**: Import only needed components

```tsx
// Good - specific imports
import { MobileButton, TouchableArea } from '@/components/ios';

// Avoid - imports everything
import * as iOS from '@/components/ios';
```

## Troubleshooting

### Common Issues

1. **Framer Motion not found**: Install with `npm install framer-motion`
2. **Styles not applying**: Ensure CSS is imported in main CSS file
3. **Touch not working**: Check that TouchableArea has proper onPress handler
4. **Modal not closing**: Ensure state is properly managed

### Debug Mode

Enable debug logging for touch events:

```tsx
<TouchableArea 
  onPress={() => console.log('Touch event triggered')}
  // Add this for debugging
  onPressIn={() => console.log('Touch started')}
  onPressOut={() => console.log('Touch ended')}
>
  Debug Touch
</TouchableArea>
```

## Next Steps

1. Test components on actual iOS devices
2. Implement haptic feedback where appropriate
3. Add more gesture recognition (pinch, rotate)
4. Optimize for different screen sizes
5. Add more accessibility features (VoiceOver testing)