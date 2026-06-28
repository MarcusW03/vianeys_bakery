import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextAuthRequest } from 'next-auth';

export const proxy = auth((req: NextAuthRequest) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  if (pathname === '/admin/login') {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*'],
};
