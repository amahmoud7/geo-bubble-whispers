import { Capacitor } from '@capacitor/core';

export class PlatformService {
  static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  static isIOS(): boolean {
    return Capacitor.getPlatform() === 'ios';
  }

  static isAndroid(): boolean {
    return Capacitor.getPlatform() === 'android';
  }

  static isWeb(): boolean {
    return Capacitor.getPlatform() === 'web';
  }

  static getPlatform(): string {
    return Capacitor.getPlatform();
  }

  static async getDeviceInfo() {
    if (this.isNative()) {
      const { Device } = await import('@capacitor/device');
      return await Device.getInfo();
    }
    return {
      platform: 'web',
      operatingSystem: 'web',
      osVersion: 'unknown',
      manufacturer: 'browser',
      model: 'browser',
      isVirtual: false,
      webViewVersion: 'unknown'
    };
  }
}