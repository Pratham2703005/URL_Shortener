import { handleCallback } from 'pratham-sso/server';
import { NextRequest } from 'next/server';

const callback = handleCallback({
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET,
  idpServer: process.env.NEXT_PUBLIC_IDP_SERVER!,
  redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
  oauthSecret: process.env.OAUTH_SECRET!,
});

export async function GET(request: NextRequest) {
  return callback(request);
}
