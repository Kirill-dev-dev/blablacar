import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_TOKEN = '7962685508:AAHBZMDWD4hqHYVzjjDfv4pjMAZ6aMwAvTc';

export async function GET(req: NextRequest) {
  try {
    // Получаем информацию о webhook
    const webhookInfoResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getWebhookInfo`);
    const webhookInfo = await webhookInfoResponse.json();
    
    console.log('Webhook info:', webhookInfo);
    
    if (!webhookInfo.ok) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Failed to get webhook info',
        details: webhookInfo
      }, { status: 500 });
    }
    
    return NextResponse.json({
      ok: true,
      webhook_info: webhookInfo.result
    });
  } catch (error) {
    console.error('Error checking webhook:', error);
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error',
      details: error
    }, { status: 500 });
  }
} 