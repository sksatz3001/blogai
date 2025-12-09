import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sign-out(.*)',
  '/superadmin/login',
  // allow all superadmin APIs (they use cookie-based auth, not Clerk)
  '/api/superadmin(.*)',
  '/superadmin(.*)', // pages protected below by our cookie check
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
  
  // Superadmin guard: allow login page, protect others via cookie
  if (request.nextUrl.pathname.startsWith('/superadmin') && request.nextUrl.pathname !== '/superadmin/login') {
    const sauth = request.cookies.get('sauth')?.value;
    if (sauth !== 'superadmin-ok') {
      return NextResponse.redirect(new URL('/superadmin/login', request.url));
    }
  }

  // Superadmin API guard: protect API routes (except login/logout) with cookie
  if (request.nextUrl.pathname.startsWith('/api/superadmin') && 
      !request.nextUrl.pathname.includes('/login') && 
      !request.nextUrl.pathname.includes('/logout')) {
    const sauth = request.cookies.get('sauth')?.value;
    if (sauth !== 'superadmin-ok') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Get the response
  const response = NextResponse.next();
  
  // Add performance headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Add prefetch hints for dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    response.headers.set(
      'Link',
      '</dashboard/create>; rel=prefetch, </dashboard/blogs>; rel=prefetch'
    );
  }
  
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
