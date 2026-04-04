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
