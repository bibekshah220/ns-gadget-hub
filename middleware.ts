import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'ns_session';

/* Pages that make no sense without a session. */
const PROTECTED_PREFIXES = ['/cart', '/my-orders', '/add-address', '/order-placed', '/seller'];

/* Already signed in? These pages have nothing to offer. */
const AUTH_PAGES = ['/login', '/register'];

/**
 * UX routing only. The cookie's signature is never checked here, so this is
 * not the security boundary: every API route calls requireAuth, which verifies
 * the JWT and reloads the user. Keeping the check to cookie presence avoids
 * dragging a JWT library into the Edge runtime.
 */
export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && AUTH_PAGES.includes(pathname)) {
    /* Honour ?next= so a post-login bounce lands where the user was headed. */
    const next = searchParams.get('next');
    const target = next?.startsWith('/') && !next.startsWith('//') ? next : '/';
    return NextResponse.redirect(new URL(target, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|api|favicon.ico|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
