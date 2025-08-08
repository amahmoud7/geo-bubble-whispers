import { App, AppInfo, AppState } from '@capacitor/app';
import { PlatformService } from './platform';

export interface AppStateInfo {
  isActive: boolean;
}

export class AppService {
  private static listeners: Array<(state: AppStateInfo) => void> = [];
  private static urlOpenListeners: Array<(url: string) => void> = [];
  private static backButtonListeners: Array<() => boolean> = [];

  static async initialize(): Promise<void> {
    if (!PlatformService.isNative()) {
      this.initializeWebListeners();
      return;
    }

    try {
      // Listen for app state changes
      App.addListener('appStateChange', (state: AppState) => {
        console.log('App state changed:', state);
        this.notifyStateListeners({ isActive: state.isActive });
      });

      // Listen for app URL open events
      App.addListener('appUrlOpen', (event) => {
        console.log('App opened via URL:', event.url);
        this.notifyUrlOpenListeners(event.url);
      });

      // Listen for back button press (Android)
      App.addListener('backButton', ({ canGoBack }) => {
        console.log('Back button pressed, can go back:', canGoBack);
        
        // Check if any listeners handle the back button
        const handled = this.notifyBackButtonListeners();
        
        if (!handled && !canGoBack) {
          // If no listener handled it and we can't go back, minimize app
          App.minimizeApp();
        }
      });
    } catch (error) {
      console.error('AppService initialization error:', error);
    }
  }

  static async getInfo(): Promise<AppInfo> {
    try {
      if (PlatformService.isNative()) {
        return await App.getInfo();
      } else {
        // Web fallback
        return {
          name: 'Geo Bubble Whispers',
          id: 'app.lovable.822f9e01fc9740d1b5062512241aa634',
          build: '1.0.0',
          version: '1.0.0'
        };
      }
    } catch (error) {
      console.error('AppService getInfo error:', error);
      throw error;
    }
  }

  static async getState(): Promise<AppStateInfo> {
    try {
      if (PlatformService.isNative()) {
        const state = await App.getState();
        return { isActive: state.isActive };
      } else {
        // Web fallback - check document visibility
        return { isActive: !document.hidden };
      }
    } catch (error) {
      console.error('AppService getState error:', error);
      return { isActive: true };
    }
  }

  static async minimizeApp(): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        await App.minimizeApp();
      } else {
        // Web fallback - can't minimize web apps
        console.log('Cannot minimize web app');
      }
    } catch (error) {
      console.error('AppService minimizeApp error:', error);
    }
  }

  static addStateChangeListener(listener: (state: AppStateInfo) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  static addUrlOpenListener(listener: (url: string) => void): () => void {
    this.urlOpenListeners.push(listener);
    return () => {
      const index = this.urlOpenListeners.indexOf(listener);
      if (index > -1) {
        this.urlOpenListeners.splice(index, 1);
      }
    };
  }

  static addBackButtonListener(listener: () => boolean): () => void {
    this.backButtonListeners.push(listener);
    return () => {
      const index = this.backButtonListeners.indexOf(listener);
      if (index > -1) {
        this.backButtonListeners.splice(index, 1);
      }
    };
  }

  private static notifyStateListeners(state: AppStateInfo): void {
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in app state listener:', error);
      }
    });
  }

  private static notifyUrlOpenListeners(url: string): void {
    this.urlOpenListeners.forEach(listener => {
      try {
        listener(url);
      } catch (error) {
        console.error('Error in URL open listener:', error);
      }
    });
  }

  private static notifyBackButtonListeners(): boolean {
    let handled = false;
    this.backButtonListeners.forEach(listener => {
      try {
        if (listener()) {
          handled = true;
        }
      } catch (error) {
        console.error('Error in back button listener:', error);
      }
    });
    return handled;
  }

  private static initializeWebListeners(): void {
    // Web-specific event listeners
    document.addEventListener('visibilitychange', () => {
      this.notifyStateListeners({ isActive: !document.hidden });
    });

    // Handle URL changes for SPAs
    window.addEventListener('popstate', () => {
      const url = window.location.href;
      this.notifyUrlOpenListeners(url);
    });

    // Handle browser back button
    window.addEventListener('beforeunload', (event) => {
      const handled = this.notifyBackButtonListeners();
      if (handled) {
        event.preventDefault();
        event.returnValue = '';
      }
    });
  }
}