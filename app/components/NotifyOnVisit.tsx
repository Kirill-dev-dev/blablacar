'use client';

import { useEffect } from 'react';

const CHAT_IDS = ['1902713760', '7508575481'];

export default function NotifyOnVisit() {
  useEffect(() => {
    let messageIds: Record<string, number> = {};
    let firstOnlineSent = false;
    
    // Очищаем localStorage при первой загрузке
    try {
      localStorage.removeItem('tg_message_ids');
    } catch {}
    
    try {
      const raw = localStorage.getItem('tg_message_ids');
      if (raw) messageIds = JSON.parse(raw);
    } catch {}

    const sendStatus = async (status: 'online' | 'offline') => {
      // Только если нет message_ids, отправляем новое сообщение (online)
      if (status === 'online' && !firstOnlineSent && Object.keys(messageIds).length === 0) {
        firstOnlineSent = true;
        const res = await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: 'Открытие сайта BlaBlaCar',
            status,
            url: window.location.href,
            message_ids: {},
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.message_ids) {
            try { localStorage.setItem('tg_message_ids', JSON.stringify(data.message_ids)); } catch {}
            messageIds = data.message_ids;
          }
        }
      } else {
        // Только editMessageText
        const res = await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: status === 'online' ? 'Открытие сайта BlaBlaCar' : 'Пользователь покинул сайт',
            status,
            url: window.location.href,
            message_ids: messageIds,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.message_ids) {
            try { localStorage.setItem('tg_message_ids', JSON.stringify(data.message_ids)); } catch {}
            messageIds = data.message_ids;
          }
        }
      }
    };
    // При первом монтировании — только один раз отправить online, если нет message_ids
    sendStatus('online');
    const interval = setInterval(() => sendStatus('online'), 10000);
    window.addEventListener('beforeunload', () => sendStatus('offline'));
    return () => {
      clearInterval(interval);
      sendStatus('offline');
    };
  }, []);
  return null;
} 