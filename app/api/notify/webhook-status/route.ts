import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_TOKEN = '7962685508:AAHBZMDWD4hqHYVzjjDfv4pjMAZ6aMwAvTc';

export async function GET(req: NextRequest) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getWebhookInfo`);
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking webhook status:', error);
    return NextResponse.json({ ok: false, error: 'Failed to check webhook status' }, { status: 500 });
  }
} 