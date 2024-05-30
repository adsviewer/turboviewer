import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { type z } from 'zod';
import { SignInSchema } from '@/util/schemas/login-schemas';
import { handleUrqlRequest } from '@/util/handle-urql-request';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import { env, REFRESH_TOKEN_KEY, TOKEN_KEY } from '@/env.mjs';

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
  cookies().set(TOKEN_KEY, result.data.login.token);
  cookies().set(REFRESH_TOKEN_KEY, result.data.login.refreshToken);
  return NextResponse.json({ success: true });
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
  cookies().set(TOKEN_KEY, token);
  cookies().set(REFRESH_TOKEN_KEY, refreshToken);
  return NextResponse.redirect(env.NEXT_PUBLIC_ENDPOINT);
}
