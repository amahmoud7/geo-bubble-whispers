import { Keyboard, KeyboardInfo, KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
import { PlatformService } from './platform';

export interface KeyboardState {
  isOpen: boolean;
  height: number;
}

export type KeyboardResizeMode = 'body' | 'ionic' | 'native' | 'none';
export type KeyboardStyleMode = 'dark' | 'light';

export class KeyboardService {
  private static listeners: Array<(state: KeyboardState) => void> = [];
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized || !PlatformService.isNative()) {
      return;
    }

    try {
      // Listen for keyboard events
      Keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
        console.log('Keyboard will show with height:', info.keyboardHeight);
        this.notifyListeners({
          isOpen: true,
          height: info.keyboardHeight
        });
      });

      Keyboard.addListener('keyboardDidShow', (info: KeyboardInfo) => {
        console.log('Keyboard did show with height:', info.keyboardHeight);
        this.notifyListeners({
          isOpen: true,
          height: info.keyboardHeight
        });
      });

      Keyboard.addListener('keyboardWillHide', () => {
        console.log('Keyboard will hide');
        this.notifyListeners({
          isOpen: false,
          height: 0
        });
      });

      Keyboard.addListener('keyboardDidHide', () => {
        console.log('Keyboard did hide');
        this.notifyListeners({
          isOpen: false,
          height: 0
        });
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('KeyboardService initialization error:', error);
    }
  }

  static async show(): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        await Keyboard.show();
      }
    } catch (error) {
      console.error('KeyboardService show error:', error);
    }
  }

  static async hide(): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        await Keyboard.hide();
      } else {
        // Web fallback - blur active element
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
          activeElement.blur();
        }
      }
    } catch (error) {
      console.error('KeyboardService hide error:', error);
    }
  }

  static async setAccessoryBarVisible(visible: boolean): Promise<void> {
    try {
      if (PlatformService.isIOS()) {
        await Keyboard.setAccessoryBarVisible({ isVisible: visible });
      }
    } catch (error) {
      console.error('KeyboardService setAccessoryBarVisible error:', error);
    }
  }

  static async setScroll(enabled: boolean): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        await Keyboard.setScroll({ isDisabled: !enabled });
      }
    } catch (error) {
      console.error('KeyboardService setScroll error:', error);
    }
  }

  static async setStyle(style: KeyboardStyleMode): Promise<void> {
    try {
      if (PlatformService.isIOS()) {
        const keyboardStyle = style === 'dark' ? KeyboardStyle.Dark : KeyboardStyle.Light;
        await Keyboard.setStyle({ style: keyboardStyle });
      }
    } catch (error) {
      console.error('KeyboardService setStyle error:', error);
    }
  }

  static async setResizeMode(mode: KeyboardResizeMode): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        const resizeMode = this.mapResizeMode(mode);
        await Keyboard.setResizeMode({ mode: resizeMode });
      }
    } catch (error) {
      console.error('KeyboardService setResizeMode error:', error);
    }
  }

  static addKeyboardListener(listener: (state: KeyboardState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Convenience methods for common app scenarios
  static async setupForChat(): Promise<void> {
    await this.setResizeMode('body');
    await this.setScroll(true);
    await this.setAccessoryBarVisible(true);
  }

  static async setupForForm(): Promise<void> {
    await this.setResizeMode('body');
    await this.setScroll(true);
    await this.setAccessoryBarVisible(false);
  }

  static async setupForFullscreen(): Promise<void> {
    await this.setResizeMode('none');
    await this.setScroll(false);
    await this.setAccessoryBarVisible(false);
  }

  static async adjustViewForKeyboard(element: HTMLElement): Promise<void> {
    if (!PlatformService.isNative()) {
      // Web fallback - scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Add listener to adjust view when keyboard shows
    const removeListener = this.addKeyboardListener((state) => {
      if (state.isOpen) {
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const keyboardTop = viewportHeight - state.height;
        
        if (rect.bottom > keyboardTop) {
          const scrollAmount = rect.bottom - keyboardTop + 20; // 20px padding
          window.scrollBy(0, scrollAmount);
        }
      }
    });

    // Remove listener after a timeout
    setTimeout(removeListener, 5000);
  }

  private static notifyListeners(state: KeyboardState): void {
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in keyboard listener:', error);
      }
    });
  }

  private static mapResizeMode(mode: KeyboardResizeMode): KeyboardResize {
    switch (mode) {
      case 'ionic':
        return KeyboardResize.Ionic;
      case 'native':
        return KeyboardResize.Native;
      case 'none':
        return KeyboardResize.None;
      case 'body':
      default:
        return KeyboardResize.Body;
    }
  }
}