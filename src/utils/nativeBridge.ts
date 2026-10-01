import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Share } from '@capacitor/share';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'android' | 'ios' | 'web'

export async function initNativeFeatures(options?: {
  onBackButton?: () => boolean; // return true if handled, false to exit
  onAppResume?: () => void;
}) {
  if (!isNative) return;

  try {
    // 1. Configure Android Status Bar to match dark theme
    if (Capacitor.isPluginAvailable('StatusBar')) {
      await StatusBar.setStyle({ style: Style.Dark });
      if (platform === 'android') {
        await StatusBar.setBackgroundColor({ color: '#090d16' });
        await StatusBar.setOverlaysWebView({ overlay: false });
      }
    }

    // 2. Hardware Back Button on Android
    if (Capacitor.isPluginAvailable('App')) {
      App.addListener('backButton', ({ canGoBack }) => {
        if (options?.onBackButton) {
          const handled = options.onBackButton();
          if (handled) return;
        }

        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });

      // 3. Resume / foreground detection
      App.addListener('appStateChange', (state) => {
        if (state.isActive && options?.onAppResume) {
          options.onAppResume();
        }
      });
    }
  } catch (err) {
    console.warn('Native feature initialization notice:', err);
  }
}

export async function nativeHapticImpact(style: 'light' | 'medium' | 'heavy' = 'light') {
  try {
    if (Capacitor.isPluginAvailable('Haptics')) {
      const map = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      };
      await Haptics.impact({ style: map[style] });
      return;
    }
  } catch (e) {}

  // Fallback to web vibration API
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(style === 'heavy' ? 40 : style === 'medium' ? 25 : 15);
  }
}

export async function nativeHapticNotification(type: 'success' | 'warning' | 'error' = 'success') {
  try {
    if (Capacitor.isPluginAvailable('Haptics')) {
      const map = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error,
      };
      await Haptics.notification({ type: map[type] });
      return;
    }
  } catch (e) {}

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([20, 40, 20]);
  }
}

export async function nativeShare(data: { title: string; text?: string; url?: string; dialogTitle?: string }): Promise<boolean> {
  try {
    if (Capacitor.isPluginAvailable('Share')) {
      await Share.share({
        title: data.title,
        text: data.text,
        url: data.url,
        dialogTitle: data.dialogTitle || 'Share Article',
      });
      return true;
    }
  } catch (e) {
    // User cancelled or share dismissed
    return false;
  }

  // Fallback to Web Share API
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Fallback to clipboard
  if (data.url && typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(data.url);
    return true;
  }

  return false;
}
