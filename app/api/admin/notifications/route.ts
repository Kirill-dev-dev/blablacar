import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const NOTIFICATIONS_FILE = path.join(process.cwd(), 'notifications.json');

// Инициализация файла уведомлений
if (!fs.existsSync(NOTIFICATIONS_FILE)) {
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify([]));
}

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

export async function GET(request: NextRequest) {
  try {
    const notifications = readNotifications();
    return NextResponse.json({ ok: true, notifications });
  } catch (error) {
    console.error('Error getting notifications:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const notifications = readNotifications();
    
    // Добавляем новое уведомление
    const newNotification = {
      id: Date.now().toString(),
      type: body.type,
      data: body.data,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    notifications.unshift(newNotification);
    writeNotifications(notifications);
    
    return NextResponse.json({ ok: true, notification: newNotification });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
} 