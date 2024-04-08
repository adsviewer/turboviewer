'use client';

import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { type JSX } from 'react';
import { Input } from '@repo/ui/input';
import { FormButton } from '@repo/ui/button';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  LoginForm,
} from '@/components/login/login-form';
import { SignInSchema } from '@/util/schemas/login-schemas';

export function SignIn(): JSX.Element {
  const form = useForm<z.output<typeof SignInSchema>>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <LoginForm {...form} formName="signIn" routeUrl="api/login/sign-in">
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
      <FormButton type="submit">Sign In</FormButton>
    </LoginForm>
  );
}
