'use client';

import React, { type JSX } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { Input } from '@repo/ui/input';
import { logger } from '@repo/logger';
import { Button } from '@repo/ui/button';

interface Inputs {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
export default function App(): JSX.Element {
  const { register, control, handleSubmit } = useForm<Inputs>();
  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    logger.info('data', JSON.stringify(data));
  };

  return (
    <form className="flex flex-col gap-1" onSubmit={handleSubmit(onSubmit)}>
      <Input group="signup" control={control} placeholder="First Name" id="firstName" register={register} required />
      <Input group="signup" control={control} placeholder="Last Name" id="lastName" register={register} required />
      <Input
        group="signup"
        control={control}
        placeholder="Email"
        id="email"
        register={register}
        required
        registerOptions={{
          pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
        }}
      />
      <Input
        group="signup"
        control={control}
        placeholder="Password"
        id="password"
        type="password"
        register={register}
        required
      />

      <Button type="submit">Sign up</Button>
    </form>
  );
}
