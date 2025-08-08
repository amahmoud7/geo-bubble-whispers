import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { PlatformService } from './platform';

export type HapticImpact = 'light' | 'medium' | 'heavy';
export type HapticNotification = 'success' | 'warning' | 'error';

export class HapticService {
  static async impact(style: HapticImpact = 'medium'): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        const impactStyle = this.mapImpactStyle(style);
        await Haptics.impact({ style: impactStyle });
      } else {
        // Web fallback - use vibration API if available
        if ('vibrate' in navigator) {
          const duration = this.getVibrationDuration(style);
          navigator.vibrate(duration);
        }
      }
    } catch (error) {
      console.error('HapticService impact error:', error);
    }
  }

  static async notification(type: HapticNotification): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        const notificationType = this.mapNotificationType(type);
        await Haptics.notification({ type: notificationType });
      } else {
        // Web fallback - use vibration API with pattern
        if ('vibrate' in navigator) {
          const pattern = this.getVibrationPattern(type);
          navigator.vibrate(pattern);
        }
      }
    } catch (error) {
      console.error('HapticService notification error:', error);
    }
  }

  static async selectionStart(): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        await Haptics.selectionStart();
      } else if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } catch (error) {
      console.error('HapticService selectionStart error:', error);
    }
  }

  static async selectionChanged(): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        await Haptics.selectionChanged();
      } else if ('vibrate' in navigator) {
        navigator.vibrate(5);
      }
    } catch (error) {
      console.error('HapticService selectionChanged error:', error);
    }
  }

  static async selectionEnd(): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        await Haptics.selectionEnd();
      } else if ('vibrate' in navigator) {
        navigator.vibrate(15);
      }
    } catch (error) {
      console.error('HapticService selectionEnd error:', error);
    }
  }

  // Convenience methods for common app interactions
  static async buttonPress(): Promise<void> {
    await this.impact('light');
  }

  static async longPress(): Promise<void> {
    await this.impact('medium');
  }

  static async messageReceived(): Promise<void> {
    await this.notification('success');
  }

  static async messageError(): Promise<void> {
    await this.notification('error');
  }

  static async swipeAction(): Promise<void> {
    await this.impact('light');
  }

  static async pinDrop(): Promise<void> {
    await this.impact('heavy');
  }

  static async mapInteraction(): Promise<void> {
    await this.selectionChanged();
  }

  private static mapImpactStyle(style: HapticImpact): ImpactStyle {
    switch (style) {
      case 'light':
        return ImpactStyle.Light;
      case 'medium':
        return ImpactStyle.Medium;
      case 'heavy':
        return ImpactStyle.Heavy;
      default:
        return ImpactStyle.Medium;
    }
  }

  private static mapNotificationType(type: HapticNotification): NotificationType {
    switch (type) {
      case 'success':
        return NotificationType.Success;
      case 'warning':
        return NotificationType.Warning;
      case 'error':
        return NotificationType.Error;
      default:
        return NotificationType.Success;
    }
  }

  private static getVibrationDuration(style: HapticImpact): number {
    switch (style) {
      case 'light':
        return 10;
      case 'medium':
        return 20;
      case 'heavy':
        return 40;
      default:
        return 20;
    }
  }

  private static getVibrationPattern(type: HapticNotification): number[] {
    switch (type) {
      case 'success':
        return [100, 50, 100];
      case 'warning':
        return [200, 100, 200];
      case 'error':
        return [300, 100, 300, 100, 300];
      default:
        return [100];
    }
  }
}