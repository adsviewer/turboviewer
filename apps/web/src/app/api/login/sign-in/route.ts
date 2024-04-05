import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { type z } from 'zod';
import { SignInSchema } from '@/util/schemas/login-schemas';
import { handleUrqlRequest } from '@/util/handle-urql-request';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@/config';
import { type FormState } from '@/components/login/login-form';

export const dynamic = 'force-dynamic'; // defaults to auto
export async function POST(
  request: Request,
): Promise<NextResponse<{ success: true } | { success: false; error: FormState }>> {
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
  revalidatePath('/profile');
  return NextResponse.json({ success: true });
}
