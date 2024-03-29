import { type InputHTMLAttributes, type JSX } from 'react';
import {
  type Control,
  type FieldError,
  type FieldPath,
  type FieldValues,
  get,
  type RegisterOptions,
  type UseFormRegister,
  useFormState,
} from 'react-hook-form';

interface InputProps<TFormValues extends FieldValues> extends InputHTMLAttributes<HTMLInputElement> {
  id: FieldPath<TFormValues>;
  group: string;
  label?: string;
  control: Control<TFormValues>;
  register: UseFormRegister<TFormValues>;
  registerOptions?: RegisterOptions;
  helper?: string;
  prepend?: React.ReactNode;
  append?: React.ReactNode;
  required?: boolean;
  placeholder?: string;
  regExp?: RegExp;
}

export function Input<TFormValues extends FieldValues>({
  id,
  group,
  label,
  control,
  register,
  registerOptions,
  required,
  placeholder,
  ...rest
}: InputProps<TFormValues>): JSX.Element {
  const { errors } = useFormState({ control });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- By design
  const error: FieldError | undefined = get(errors, id);

  const enhancedRegisterOptions = {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- false positive
    required: `${required ? `${placeholder ?? label} is required` : false}`,
    ...registerOptions,
  };

  const { ...registerRest } = register(id, enhancedRegisterOptions);
  return (
    <div>
      {label ? (
        <label htmlFor={id}>
          {label}
          {required ? (
            <>
              {' '}
              <span className="text-red-700">*</span>
            </>
          ) : (
            ''
          )}
        </label>
      ) : null}
      <input
        id={`${group}-${id}`}
        className="border-solid p-2.5 w-full box-border mb-2.5 rounded outline-offset-4"
        placeholder={placeholder ? placeholder : label}
        aria-invalid={error ? 'true' : 'false'}
        {...registerRest}
        {...rest}
      />
      {error ? <div className="mt-1 text-sm font-bold text-red-400">{error.message}</div> : null}
    </div>
  );
}
