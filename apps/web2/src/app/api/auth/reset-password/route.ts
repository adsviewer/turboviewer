import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { REFRESH_TOKEN_KEY, TOKEN_KEY, PasswordSchema } from '@repo/utils';
import { handleUrqlRequest } from '@/util/handle-urql-request';
import { urqlClientSdk } from '@/lib/urql/urql-client';

const schema = z.object({
  token: z.string(),
  password: PasswordSchema,
});

export async function POST(request: Request): Promise<NextResponse<{ success: true } | { success: false }>> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Will check with zod
  const body: z.infer<typeof schema> = await request.json();
  const parsed = schema.safeParse(body);

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

  const result = await handleUrqlRequest(urqlClientSdk().resetPassword(parsed.data));
  if (!result.success) {
    return NextResponse.json({ success: false, error: { message: result.error } });
  }
  cookies().set(TOKEN_KEY, result.data.resetPassword.token);
  cookies().set(REFRESH_TOKEN_KEY, result.data.resetPassword.refreshToken);
  return NextResponse.json({ success: true });
}
