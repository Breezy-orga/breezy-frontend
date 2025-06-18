// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'

// export function middleware(request: NextRequest) {
//   const token = request.cookies.get('token')
//   if (!token) {
//     const loginUrl = request.nextUrl.clone()
//     loginUrl.pathname = '/login'
//     return NextResponse.redirect(loginUrl)
//   }
//   return NextResponse.next()
// }

// export const config = {
//   matcher: ['/', '/feed'],
// }

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')

  if (request.nextUrl.pathname === '/') {
    if (token) {
      // Utilisateur connecté : redirige vers /feed
      const feedUrl = request.nextUrl.clone()
      feedUrl.pathname = '/feed'
      return NextResponse.redirect(feedUrl)
    } else {
      // Utilisateur non connecté : redirige vers /login
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      return NextResponse.redirect(loginUrl)
    }
  }

  // Pour les autres routes protégées (ex: /feed), tu peux garder la logique classique
  if (
    ['/feed', '/profile', '/dashboard'].some((path) =>
      request.nextUrl.pathname.startsWith(path)
    ) &&
    !token
  ) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/feed'],
}