import { NextResponse } from 'next/server';

const CONTINENT_MAP = {
  'AF': 'africa',
  'AS': 'asia',
  'EU': 'europ',
  'NA': 'north-america',
  'SA': 'sourth-america',
  'OC': 'australia',
  'AN': 'antarctica'
};

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Prevent redirect loops checking if it starts with any continent folder
  const paths = Object.values(CONTINENT_MAP);
  if (paths.some(p => pathname.startsWith(`/${p}`))) {
    return NextResponse.next();
  }

  // Get continent from Vercel headers, fallback to AS
  const continentCode = request.headers.get('x-vercel-ip-continent') || 'AS';
  
  const targetFolder = CONTINENT_MAP[continentCode] || 'asia';

  return NextResponse.redirect(new URL(`/${targetFolder}${pathname}`, request.url));
}

export const config = {
  matcher: [
    /*
     * Match only navigation requests — skip all static files:
     * - _next/static (Next.js build assets)
     * - _next/image (Next.js image optimization)
     * - favicon.ico
     * - All static file extensions (css, js, images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:css|js|jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf|eot|otf|mp4|webm|pdf|json|xml|txt)).*)',
  ],
};
