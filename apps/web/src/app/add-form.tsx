'use client';

// eslint-disable-next-line import/named -- TODO: Fix this
import { useFormState, useFormStatus } from 'react-dom';
import { type JSX } from 'react';
import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button';
import { createUser } from './actions';

const initialState = {
  message: '',
};

function SubmitButton(): JSX.Element {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" ariaDisabled={pending}>
      Add
    </Button>
  );
}

export function AddForm(): JSX.Element {
  const [state, formAction] = useFormState(createUser, initialState);

  return (
    <form action={formAction}>
      <label className="font-bold block mb-1" htmlFor="todo">
        Sign Up
      </label>
      <Input type="text" name="email" required />
      <Input type="text" name="firstName" required />
      <Input type="text" name="lastName" required />
      <Input type="password" name="password" required />
      <SubmitButton />
      <p aria-live="polite" className="text-red-600 font-bold " role="status">
        {state.message}
      </p>
    </form>
  );
}
