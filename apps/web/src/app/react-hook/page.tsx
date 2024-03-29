'use client';

import React, { type JSX } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { logger } from '@repo/logger';

interface Inputs {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export default function App(): JSX.Element {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();
  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    logger.info(data);
  };
  logger.info(errors);

  return (
    <form onSubmit={void handleSubmit(onSubmit)}>
      <input type="text" placeholder="First name" {...register('firstName', { required: true, maxLength: 80 })} />
      <input type="text" placeholder="Last name" {...register('lastName', { required: true, maxLength: 100 })} />
      <input type="text" placeholder="Email" {...register('email', { required: true, pattern: /^\S+@\S+$/i })} />
      <input type="password" placeholder="Password" {...register('password', { required: true })} />

      <input type="submit" />
    </form>
  );
}
