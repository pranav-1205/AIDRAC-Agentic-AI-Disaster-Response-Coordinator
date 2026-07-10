import { useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { requestNotificationPermission } from '../utils/notifications';

export default function NotificationManager() {
  const { settings } = useSettings();

  useEffect(() => {
    if (!settings.notifications_enabled) return;
    if (!settings.push_notifications) return;
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      requestNotificationPermission();
    } else if (Notification.permission === 'denied') {
      console.warn('[Notifications] Permission was denied. Enable browser notification permissions to receive push alerts.');
    }
  }, [settings.notifications_enabled, settings.push_notifications]);

  return null;
}
