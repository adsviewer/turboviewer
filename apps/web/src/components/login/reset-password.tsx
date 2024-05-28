'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { type JSX } from 'react';
import { Input } from '@repo/ui/input';
import { FormButton } from '@repo/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { PasswordSchema } from '@repo/utils';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  LoginForm,
} from '@/components/login/login-form';

interface ForgotPasswordProps {
  btnText: string;
  token: string;
}

const schema = z.object({
  token: z.string(),
  password: PasswordSchema,
});

export function ResetPassword({ btnText, token }: ForgotPasswordProps): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const form = useForm<z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      token,
      password: '',
    },
  });

  return (
    <LoginForm
      {...form}
      formName="forgotPassword"
      routeUrl="api/login/reset-password"
      onSuccess={(_data) => {
        const redirect = searchParams.get('redirect');
        router.push(redirect ?? '/insights');
      }}
    >
      <FormField
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <Input type="password" placeholder="" {...field} />
            </FormControl>
            <FormDescription>Your password.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormButton type="submit">{btnText}</FormButton>
    </LoginForm>
  );
}
