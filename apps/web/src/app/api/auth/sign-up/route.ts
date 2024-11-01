import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@repo/utils';
import { SignUpSchema, type SignUpSchemaType } from '@/util/schemas/login-schemas';
import { handleUrqlRequest } from '@/util/handle-urql-request';
import { urqlClientSdk } from '@/lib/urql/urql-client';

export const dynamic = 'force-dynamic'; // defaults to auto
export async function POST(request: Request): Promise<NextResponse<{ success: true } | { success: false }>> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Will check with zod
  const body: SignUpSchemaType = await request.json();
  const parsed = SignUpSchema.safeParse(body);

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

  const result = await handleUrqlRequest((await urqlClientSdk()).signup(parsed.data));
  if (!result.success) {
    return NextResponse.json({ success: false, error: { message: result.error } });
  }
  const cookiesStore = await cookies();
  cookiesStore.set(TOKEN_KEY, result.data.signup.token);
  cookiesStore.set(REFRESH_TOKEN_KEY, result.data.signup.refreshToken);
  return NextResponse.json({ success: true });
}
