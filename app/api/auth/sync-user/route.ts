import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ME_TIMEOUT_MS = 5000;

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('__sso_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const meUrl = new URL('/api/me', request.nextUrl.origin);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ME_TIMEOUT_MS);

    let sessionData: { user?: { email?: string; name?: string } };
    try {
      const meResponse = await fetch(meUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `__sso_session=${sessionCookie}`,
        },
        signal: controller.signal,
      });
      if (!meResponse.ok) {
        return NextResponse.json({ error: 'Session validation failed' }, { status: 401 });
      }
      sessionData = await meResponse.json();
    } catch (error) {
      console.error('Failed to validate session:', error);
      const message = (error as Error).name === 'AbortError' ? 'Session validation timed out' : 'Session validation failed';
      return NextResponse.json({ error: message }, { status: 401 });
    } finally {
      clearTimeout(timeoutId);
    }

    const email = sessionData.user?.email;
    if (!email) {
      return NextResponse.json({ error: 'No email in user data' }, { status: 400 });
    }

    const idpName = sessionData.user?.name || 'User';
    const dbUser = await prisma.user.upsert({
      where: { email },
      update: { name: idpName },
      create: { email, name: idpName },
    });

    const response = NextResponse.json({
      success: true,
      user: { id: dbUser.id, email: dbUser.email, name: dbUser.name },
    });

    response.cookies.set('__sso_user_id', dbUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
  }
}
