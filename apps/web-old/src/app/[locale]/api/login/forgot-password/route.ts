import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleUrqlRequest } from '@/util/handle-urql-request';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import { type FormState } from '@/components/login/login-form';

export const dynamic = 'force-dynamic'; // defaults to auto

const schema = z.object({
  email: z.string().email(),
});

export async function POST(
  request: Request,
): Promise<NextResponse<{ success: true; email: string } | { success: false; error: FormState }>> {
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

  const result = await handleUrqlRequest(urqlClientSdk().forgetPassword(parsed.data));
  if (!result.success) {
    return NextResponse.json({ success: false, error: { message: result.error } });
  }
  // redirect(`/forgot-password/success?email=${parsed.data.email}`);
  return NextResponse.json({ success: true, email: parsed.data.email });
}
