import { handleCallback } from 'pratham-sso/server';
import { NextRequest, NextResponse } from 'next/server';

const baseCallback = handleCallback({
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
  idpServer: process.env.NEXT_PUBLIC_IDP_SERVER!,
  redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
  oauthSecret: process.env.OAUTH_SECRET!,
});

export async function GET(request: NextRequest) {
  // Call the base Pratham-SSO callback handler
  const response = await baseCallback(request);

  // After Pratham-SSO sets the session cookie,
  // we need to sync the user to our database
  try {
    // We can't access the session data directly from the callback,
    // so we'll create a user sync endpoint that gets called from the client
    // after the redirect completes
  } catch (error) {
    console.error("Error syncing user:", error);
  }

  return response;
}
