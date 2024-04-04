'use client';

// eslint-disable-next-line import/named -- not sure why this is being flagged
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { type JSX } from 'react';
import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button';
import { signIn } from '@/app/(login)/actions';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/common/form';
import { SignInSchema } from '@/util/schemas/login-schemas';

export function SignIn(): JSX.Element {
  const [state] = useFormState(signIn, {
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
    <Form {...form} formName="signIn" onSubmitAction={signIn}>
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
  );
}
