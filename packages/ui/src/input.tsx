import { type JSX } from 'react';

interface InputProps {
  group?: string;
  name: string;
  type: React.HTMLInputTypeAttribute;
  required: boolean;
}
export function Input(props: InputProps): JSX.Element {
  return (
    <input
      className="ui-border-solid ui-p-2.5 ui-w-full ui-box-border ui-mb-2.5 rounded ui-outline-offset-4"
      type={props.type}
      id={`${props.group ? `${props.group}-` : ''}${props.name}`}
      name={props.name}
      required={props.required}
    />
  );
}
