import { Share } from '@capacitor/share';
import { toast } from '@/hooks/use-toast';
import { PlatformService } from './platform';

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  files?: string[];
  dialogTitle?: string;
}

export class ShareService {
  static async share(options: ShareOptions): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        await Share.share({
          title: options.title,
          text: options.text,
          url: options.url,
          files: options.files,
          dialogTitle: options.dialogTitle
        });
      } else {
        // Web fallback - use Web Share API if available
        if (navigator.share) {
          await navigator.share({
            title: options.title,
            text: options.text,
            url: options.url
          });
        } else {
          // Fallback to clipboard
          await this.copyToClipboard(options);
        }
      }
    } catch (error) {
      console.error('ShareService error:', error);
      // Fallback to clipboard on error
      await this.copyToClipboard(options);
    }
  }

  static async canShare(): Promise<boolean> {
    try {
      if (PlatformService.isNative()) {
        const result = await Share.canShare();
        return result.value;
      } else {
        return 'share' in navigator;
      }
    } catch {
      return false;
    }
  }

  static async shareMessage(messageId: string, content: string, location?: { lat: number; lng: number }): Promise<void> {
    const shareUrl = `${window.location.origin}/?messageId=${messageId}`;
    const locationText = location ? ` at ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : '';
    
    await this.share({
      title: 'Geo Bubble Whispers',
      text: `Check out this message${locationText}: "${content}"`,
      url: shareUrl,
      dialogTitle: 'Share Message'
    });
  }

  static async shareLocation(location: { lat: number; lng: number }, message?: string): Promise<void> {
    const shareUrl = `${window.location.origin}/?lat=${location.lat}&lng=${location.lng}`;
    const text = message 
      ? `${message} - Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
      : `Check out this location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
    
    await this.share({
      title: 'Geo Bubble Whispers - Location',
      text,
      url: shareUrl,
      dialogTitle: 'Share Location'
    });
  }

  static async shareApp(): Promise<void> {
    await this.share({
      title: 'Geo Bubble Whispers',
      text: 'Discover and share location-based messages with Geo Bubble Whispers!',
      url: window.location.origin,
      dialogTitle: 'Share App'
    });
  }

  private static async copyToClipboard(options: ShareOptions): Promise<void> {
    try {
      let textToCopy = '';
      
      if (options.title) textToCopy += options.title + '\n';
      if (options.text) textToCopy += options.text + '\n';
      if (options.url) textToCopy += options.url;
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy.trim());
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy.trim();
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      toast({
        title: 'Copied to clipboard',
        description: 'The content has been copied to your clipboard',
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: 'Share failed',
        description: 'Unable to share content',
        variant: 'destructive',
      });
    }
  }
}