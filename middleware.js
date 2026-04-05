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

  // Skip if already inside a continent folder
  const continentPaths = Object.values(CONTINENT_MAP);
  if (continentPaths.some(p => pathname.startsWith(`/${p}`))) {
    return NextResponse.next();
  }

  // Only handle root or html-like navigation (not static assets)
  // Get continent from Vercel geo header
  const continentCode = request.headers.get('x-vercel-ip-continent');
  const targetFolder = (continentCode && CONTINENT_MAP[continentCode]) || 'africa';

  // Redirect to the continent's index.html explicitly
  // e.g. / → /africa/index.html
  const targetPath = `/${targetFolder}/index.html`;
  return NextResponse.redirect(new URL(targetPath, request.url));
}

export const config = {
  matcher: [
    /*
     * Only match the root and non-file paths.
     * Skip _next internals + all static file extensions.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:css|js|jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf|eot|otf|mp4|webm|pdf|json|xml|txt|html)).*)',
  ],
};
