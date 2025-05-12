import { NextRequest, NextResponse } from 'next/server';
import { getCodeErrorFlag } from '../codeErrorStore';

export async function GET(req: NextRequest) {
  try {
    // Получаем IP из заголовков
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 
               realIp ? realIp.trim() : 
               'Unknown';
    
    console.log('Checking code error for IP:', ip);
    
    const hasError = getCodeErrorFlag(ip);
    console.log('Code error status for IP', ip, ':', hasError);
    
    return NextResponse.json({ hasError });
  } catch (error) {
    console.error('Error checking code error:', error);
    return NextResponse.json(
      { error: 'Failed to check code error status' },
      { status: 500 }
    );
  }
} 