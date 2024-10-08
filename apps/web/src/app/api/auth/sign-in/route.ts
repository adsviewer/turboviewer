import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { type z } from 'zod';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@repo/utils';
import { SignInSchema } from '@/util/schemas/login-schemas';
import { handleUrqlRequest } from '@/util/handle-urql-request';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import { env } from '@/env.mjs';

export const dynamic = 'force-dynamic'; // defaults to auto
export async function POST(request: Request): Promise<NextResponse<{ success: true } | { success: false }>> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Will check with zod
  const body: z.infer<typeof SignInSchema> = await request.json();
  const parsed = SignInSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({
      success: false,
      error: {
        message: 'Invalid form data',
        fields: body,
        issues: parsed.error.issues.map((issue) => issue.message),
      },
    });
  }

  const result = await handleUrqlRequest(urqlClientSdk().login(parsed.data));
  if (!result.success) {
    return NextResponse.json({ success: false, error: { message: result.error } });
  }
  const cookieStore = cookies();
  cookieStore.set(TOKEN_KEY, result.data.login.token);
  cookieStore.set(REFRESH_TOKEN_KEY, result.data.login.refreshToken);
  return NextResponse.json({
    success: true,
    token: result.data.login.token,
    refreshToken: result.data.login.refreshToken,
  });
}

// Check for auth tokens in url on page visit
export function GET(request: NextRequest): NextResponse {
  const token = request.nextUrl.searchParams.get('token');
  const refreshToken = request.nextUrl.searchParams.get('refreshToken');
  if (!token || !refreshToken) {
    return NextResponse.json({
      success: false,
      error: { message: 'No JWT data found in the URL. Not attempting authorization.' },
    });
  }
  const cookieStore = cookies();
  cookieStore.set(TOKEN_KEY, token);
  cookieStore.set(REFRESH_TOKEN_KEY, refreshToken);
  return NextResponse.redirect(env.NEXT_PUBLIC_ENDPOINT);
}
