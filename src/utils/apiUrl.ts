import { Capacitor } from '@capacitor/core';

/**
 * Returns the proper API URL whether running in web browser or inside Capacitor native Android.
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  if (Capacitor.isNativePlatform()) {
    // Inside native Android app, use the configured backend URL or fallback to the live cloud instance
    const remoteBase = (import.meta.env.VITE_API_URL as string) || 'https://ais-dev-ikhkyrv6k7zn5ggqqqzai7-504086056041.asia-east1.run.app';
    return `${remoteBase.replace(/\/+$/, '')}${cleanPath}`;
  }

  // Web application (SPA or PWA)
  return cleanPath;
}
