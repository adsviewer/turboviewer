'use client';

// eslint-disable-next-line import/named -- TODO: Fix this
import { useFormState, useFormStatus } from 'react-dom';
import { type JSX } from 'react';
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
      <SubmitButton />
      <p aria-live="polite" className="text-red-600 font-bold " role="status">
        {state.message}
      </p>
    </form>
  );
}
