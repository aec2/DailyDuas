import {bootstrapApplication} from '@angular/platform-browser';
import {App} from './app/app';
import {appConfig} from './app/app.config';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/reminder-sw.js', { scope: '/reminder-worker/' }).catch(() => {
    // optional reminder worker registration for future web push flows
  });

  navigator.serviceWorker.addEventListener('message', event => {
    const data = event.data as { type?: string; title?: string; body?: string } | undefined;
    if (data?.type !== 'dd-reminder-preview' || !data.title) return;

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(data.title, {
        body: data.body ?? 'Zikir vaktiniz geldi.',
        icon: '/icons/icon-192x192.png',
      });
    }
  });
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
