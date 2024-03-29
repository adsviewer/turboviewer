import { type ButtonHTMLAttributes, type JSX } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<unknown> {
  ariaDisabled?: boolean;
  children: React.ReactNode;
}

export function Button(props: ButtonProps): JSX.Element {
  return (
    <button
      className="bg-gradient-to-r from-primary to-primary-gradient rounded text-white px-2.5 py-2 w-full outline-offset-4 hover:opacity-80 aria-disabled:opacity-50 aria-disabled:cursor-not-allowed"
      type={/* eslint-disable-line react/button-has-type -- No idea */ props.type}
      aria-disabled={props.ariaDisabled}
    >
      {props.children}
    </button>
  );
}
