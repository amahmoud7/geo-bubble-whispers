import { StatusBar, Style, Animation } from '@capacitor/status-bar';
import { PlatformService } from './platform';

export type StatusBarStyle = 'default' | 'light' | 'dark';
export type StatusBarAnimation = 'none' | 'slide' | 'fade';

export class StatusBarService {
  static async setStyle(style: StatusBarStyle): Promise<void> {
    try {
      if (PlatformService.isIOS()) {
        const statusBarStyle = this.mapStyle(style);
        await StatusBar.setStyle({ style: statusBarStyle });
      }
    } catch (error) {
      console.error('StatusBarService setStyle error:', error);
    }
  }

  static async setBackgroundColor(color: string): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        await StatusBar.setBackgroundColor({ color });
      }
    } catch (error) {
      console.error('StatusBarService setBackgroundColor error:', error);
    }
  }

  static async show(animation?: StatusBarAnimation): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        const animationType = animation ? this.mapAnimation(animation) : undefined;
        await StatusBar.show({ animation: animationType });
      }
    } catch (error) {
      console.error('StatusBarService show error:', error);
    }
  }

  static async hide(animation?: StatusBarAnimation): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        const animationType = animation ? this.mapAnimation(animation) : undefined;
        await StatusBar.hide({ animation: animationType });
      }
    } catch (error) {
      console.error('StatusBarService hide error:', error);
    }
  }

  static async getInfo(): Promise<{ visible: boolean }> {
    try {
      if (PlatformService.isNative()) {
        const info = await StatusBar.getInfo();
        return { visible: info.visible };
      } else {
        return { visible: true }; // Web always shows browser UI
      }
    } catch (error) {
      console.error('StatusBarService getInfo error:', error);
      return { visible: true };
    }
  }

  static async setOverlaysWebView(overlay: boolean): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        await StatusBar.setOverlaysWebView({ overlay });
      }
    } catch (error) {
      console.error('StatusBarService setOverlaysWebView error:', error);
    }
  }

  // Convenience methods for common app scenarios
  static async setupForLightTheme(): Promise<void> {
    await this.setStyle('dark');
    await this.setBackgroundColor('#FFFFFF');
  }

  static async setupForDarkTheme(): Promise<void> {
    await this.setStyle('light');
    await this.setBackgroundColor('#000000');
  }

  static async setupForMap(): Promise<void> {
    await this.setStyle('dark');
    await this.setOverlaysWebView(true);
  }

  static async setupForFullscreen(): Promise<void> {
    await this.hide('fade');
  }

  static async restoreDefault(): Promise<void> {
    await this.show('fade');
    await this.setStyle('default');
    await this.setOverlaysWebView(false);
  }

  private static mapStyle(style: StatusBarStyle): Style {
    switch (style) {
      case 'light':
        return Style.Light;
      case 'dark':
        return Style.Dark;
      case 'default':
      default:
        return Style.Default;
    }
  }

  private static mapAnimation(animation: StatusBarAnimation): Animation {
    switch (animation) {
      case 'slide':
        return Animation.Slide;
      case 'fade':
        return Animation.Fade;
      case 'none':
      default:
        return Animation.None;
    }
  }
}