import { NextResponse, type NextRequest } from 'next/server';
import { resolveInternalPath, supportedLanguages, type Language } from './app/routing';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split('/').filter(Boolean)[0];

  if (!supportedLanguages.includes(firstSegment as Language)) {
    return NextResponse.next();
  }

  const language = firstSegment as Language;
  const localizedRemainder = pathname.replace(new RegExp(`^/${firstSegment}(?=/|$)`), '') || '/';
  const internalPath = resolveInternalPath(localizedRemainder, language);

  const url = request.nextUrl.clone();
  url.pathname = internalPath;

  // La langue de l'URL est transmise aux composants serveur (pages statiques, métadonnées)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-language', language);
  const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  response.cookies.set('language', language, {
    path: '/',
    sameSite: 'lax'
  });

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
