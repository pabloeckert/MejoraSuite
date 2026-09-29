/**
 * Push notification utilities for MejoraCRM PWA.
 * Uses the browser Push API + Service Worker.
 */

const VAPID_PUBLIC_KEY = ""; // Set when VAPID keys are configured

/**
 * Check if push notifications are supported in this browser.
 */
export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/**
 * Get current notification permission status.
 */
export function getNotificationPermission(): NotificationPermission {
  if (!("Notification" in window)) return "denied";
  return Notification.permission;
}

/**
 * Request notification permission from the user.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";
  return Notification.requestPermission();
}

/**
 * Subscribe to push notifications.
 * Returns the subscription object to send to your server.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    return subscription;
  } catch (err) {
    console.error("[Push] Subscribe failed:", err);
    return null;
  }
}

/**
 * Show a local notification (no server needed).
 * Useful for follow-up reminders while the app is open.
 */
export function showLocalNotification(title: string, body: string, url?: string) {
  if (getNotificationPermission() !== "granted") return;

  navigator.serviceWorker.ready.then((registration) => {
    registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/favicon-32.png",
      data: { url: url || "/interactions" },
      tag: "mejoracrm-local",
      renotify: true,
    });
  });
}

/**
 * Convert VAPID key from base64 to Uint8Array.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
