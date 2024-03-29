import { type ButtonHTMLAttributes, type JSX } from 'react';

interface ButtonProps {
  ariaDisabled?: boolean;
  type: ButtonHTMLAttributes<unknown>['type'];
  children: React.ReactNode;
}

export function Button(props: ButtonProps): JSX.Element {
  return (
    <button
      className="ui-bg-black ui-rounded ui-text-white ui-px-2.5 ui-py-6 ui-w-full ui-outline-offset-4 hover:ui-opacity-80 aria-disabled:ui-opacity-50 aria-disabled:ui-cursor-not-allowed"
      type={/* eslint-disable-line react/button-has-type -- No idea */ props.type}
      aria-disabled={props.ariaDisabled}
    >
      {props.children}
    </button>
  );
}
