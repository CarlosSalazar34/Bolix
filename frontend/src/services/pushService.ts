
const API_URL = import.meta.env.VITE_API_URL || 'https://bolix-backend.vercel.app'


const VAPID_PUBLIC_KEY = 'BJNCEv7cSow9zuxhTwdAE-rEFhrUAQOyOPMz-FgaOp8kybLh7f4rlnHiQopc9iPkGPMD8TlM766nno-6_O7oV6I';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission denied.');
  }

  // Register service worker
  const registration = await navigator.serviceWorker.register('/sw.js');

  // Wait for service worker to be ready
  await navigator.serviceWorker.ready;

  // Get existing subscription
  let subscription = await registration.pushManager.getSubscription();

  // If no subscription, create one
  if (!subscription) {
    const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });
  }

  return subscription;
}

export async function sendSubscriptionToBackend(subscription: PushSubscription) {
  const token = localStorage.getItem('bolix_token');
  if (!token) throw new Error('Not authenticated');

  const subJson = subscription.toJSON();

  const response = await fetch(`${API_URL}/api/notifications/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      endpoint: subJson.endpoint,
      keys: subJson.keys
    })
  });

  if (!response.ok) {
    throw new Error('Failed to save subscription on server');
  }

  return await response.json();
}

export async function testPushNotification() {
  const token = localStorage.getItem('bolix_token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/api/notifications/test`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Detalle del error del servidor:", errorText);
    throw new Error('Failed to send test notification: ' + errorText);
  }

  return await response.json();
}
