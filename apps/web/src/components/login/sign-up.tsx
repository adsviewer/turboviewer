'use client';

import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { type JSX } from 'react';
import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  LoginForm,
} from '@/components/login/login-form';
import { SignUpSchema } from '@/util/schemas/login-schemas';

export function SignUp(): JSX.Element {
  const form = useForm<z.output<typeof SignUpSchema>>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  return (
    <LoginForm {...form} formName="signUp" routeUrl="api/login/sign-up">
      <div className="flex gap-2">
        <FormField
          name="firstName"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="" {...field} />
              </FormControl>
              <FormDescription>Your first name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="lastName"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="" {...field} />
              </FormControl>
              <FormDescription>Your last name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
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
      <Button type="submit">Sign up</Button>
    </LoginForm>
  );
}
