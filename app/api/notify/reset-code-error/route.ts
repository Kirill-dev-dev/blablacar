import { NextRequest, NextResponse } from 'next/server';
import { setCodeErrorFlag } from '../codeErrorStore';

function getClientIp(req: NextRequest) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.ip || 'Unknown';
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    console.log('Resetting code error flag for IP:', ip);
    setCodeErrorFlag(ip, false);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error resetting code error flag:', error);
    return NextResponse.json({ ok: false, error: 'Failed to reset code error flag' }, { status: 500 });
  }
} 