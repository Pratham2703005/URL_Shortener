import { handleLogout } from 'pratham-sso/server';
import { NextRequest } from 'next/server';

const logoutHandler = handleLogout({
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
  idpServer: process.env.NEXT_PUBLIC_IDP_SERVER!,
});

export async function POST(request: NextRequest) {
  return logoutHandler(request);
}
