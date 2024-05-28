'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { type JSX } from 'react';
import { Input } from '@repo/ui/input';
import { FormButton } from '@repo/ui/button';
import { useRouter } from 'next/navigation';
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
}

const schema = z.object({
  email: z.string().email(),
});

export function ForgotPassword({ btnText }: ForgotPasswordProps): JSX.Element {
  const router = useRouter();
  const form = useForm<z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
    },
  });

  return (
    <LoginForm
      {...form}
      formName="forgotPassword"
      routeUrl="api/login/forgot-password"
      onSuccess={(_data) => {
        router.push(`/forgot-password/success?email=${form.getValues('email')}`);
      }}
    >
      <FormField
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input placeholder="" {...field} />
            </FormControl>
            <FormDescription>Your email address.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormButton type="submit">{btnText}</FormButton>
    </LoginForm>
  );
}
