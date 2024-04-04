'use client';

import React, { type JSX } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button';
// eslint-disable-next-line import/named -- not sure why this is being flagged
import { useFormState } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { type z } from 'zod';
import Link from 'next/link';
import { SignInSchema } from '@/util/schemas/login-schemas';
import { signIn, signUp } from '@/app/(login)/actions';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/common/form';

export default function Page(): JSX.Element {
  const [state] = useFormState(signUp, {
    message: '',
  });
  const form = useForm<z.output<typeof SignInSchema>>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: '',
      password: '',
      ...(state.fields ?? {}),
    },
  });

  return (
    <div>
      <div className="text-destructive" />
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl text-center">Sign In</h1>
        <Form {...form} formName="signUp" onSubmitAction={signIn}>
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
          <Button type="submit">Sign In</Button>
        </Form>
        <Link className="text-center underline" href="/sign-up">
          No account yet? Create one.
        </Link>
      </div>
    </div>
  );
}
