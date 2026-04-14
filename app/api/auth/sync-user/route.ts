import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // First, check if __sso_session cookie exists
    const sessionCookie = request.cookies.get('__sso_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // ALWAYS validate current session against IDP - don't trust cached user ID
    // Call /api/me to get session data from Pratham-SSO
    const meUrl = new URL('/api/me', request.nextUrl.origin);
    
    let sessionData;
    try {
      const meResponse = await Promise.race([
        fetch(meUrl.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `__sso_session=${sessionCookie}`,
          },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 3000)
        ) as Promise<Response>,
      ]);

      if (!(meResponse as Response).ok) {
        return NextResponse.json(
          { error: 'Session validation failed' },
          { status: 401 }
        );
      }

      sessionData = await (meResponse as Response).json();
    } catch (error) {
      console.error('Failed to validate session:', error);
      return NextResponse.json(
        { error: 'Session validation failed' },
        { status: 401 }
      );
    }

    if (!sessionData.user?.email) {
      return NextResponse.json(
        { error: 'No email in user data' },
        { status: 400 }
      );
    }

    const idpUser = sessionData.user;

    // Create or update user in database
    let dbUser = await prisma.user.findUnique({
      where: { email: idpUser.email },
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email: idpUser.email,
          name: idpUser.name || 'User',
        },
      });
    } else if (!dbUser.name && idpUser.name) {
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { name: idpUser.name },
      });
    }

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
      },
    });

    // Set a secure cookie with the user ID for server-side auth
    response.cookies.set('__sso_user_id', dbUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    );
  }
}
