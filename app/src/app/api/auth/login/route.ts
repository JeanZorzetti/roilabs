import { NextRequest, NextResponse } from 'next/server';
import { createSession, checkPassword, SESSION_COOKIE } from '@/lib/session';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const password = String(form.get('password') ?? '');

  if (!checkPassword(password)) {
    return NextResponse.redirect(new URL('/login?e=1', req.url), 303);
  }

  const res = NextResponse.redirect(new URL('/admin', req.url), 303);
  res.cookies.set(SESSION_COOKIE, createSession(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
