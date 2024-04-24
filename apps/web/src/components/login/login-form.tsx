import * as React from 'react';
import { type JSX, useState } from 'react';
import type * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  Form,
  FormProvider,
  type FormProviderProps,
  useFormContext,
  type UseFormReturn,
} from 'react-hook-form';
import { X } from 'lucide-react';
import { cn } from '@repo/ui/tailwind-utils';
import { Label } from '@repo/ui/label';
import { logger } from '@repo/logger';
import { useRouter, useSearchParams } from 'next/navigation';

export interface FormState {
  message: string;
  fields?: Record<string, string>;
  issues?: string[];
}

interface FormProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends FormProviderProps<TFieldValues, TName> {
  formName: string;
  routeUrl: string;
}

function LoginForm<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ children, ...props }: FormProps<TFieldValues, TName>): JSX.Element {
  const [state, setState] = useState({
    message: '',
  });
  const searchParams = useSearchParams();
  const router = useRouter();

  return (
    <FormProvider {...props}>
      <FormErrors state={state} />
      <Form
        className="flex flex-col gap-6"
        action={props.routeUrl}
        control={props.control}
        headers={{ 'Content-Type': 'application/json' }}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises -- That's fine
        onSuccess={async (data) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- That's fine
          const body: { success: true } | { success: false; error: FormState } = await data.response.json();
          if (body.success) {
            const redirect = searchParams.get('redirect');
            router.push(redirect ?? '/placements');
          } else {
            setState(body.error);
          }
        }}
        onError={(e) => {
          logger.error('error', e);
        }}
      >
        {props.formState.errors.root?.server ? <p>{JSON.stringify(props.formState.errors)}</p> : null}
        {children}
      </Form>
    </FormProvider>
  );
}

function FormErrors({ state }: { state: FormState }): JSX.Element {
  const { formState }: UseFormReturn = useFormContext();
  if (formState.isSubmitting) {
    state.message = '';
  }
  return (
    <div>
      {state.message !== '' && !state.issues && <div className="text-destructive">{state.message}</div>}
      {state.issues ? (
        <div className="text-destructive">
          <ul>
            {state.issues.map((issue) => (
              <li key={issue} className="flex gap-1">
                <X fill="red" />
                {issue}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
}

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>): JSX.Element {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- too much of a hassle
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  // @ts-expect-error -- it's fine https://github.com/orgs/react-hook-form/discussions/5240
  const { getFieldState, formState, formName }: UseFormReturn & { formName: string } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- probably not needed
  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${fieldContext.name}-${formName}-form-item`,
    formDescriptionId: `${fieldContext.name}-${formName}-form-item-description`,
    formMessageId: `${fieldContext.name}-${formName}-form-item-message`,
    ...fieldState,
  };
};

interface FormItemContextValue {
  id: string;
}

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId();

    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn('space-y-2', className)} {...props} />
      </FormItemContext.Provider>
    );
  },
);
FormItem.displayName = 'FormItem';

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return <Label ref={ref} className={cn(error && 'text-destructive', className)} htmlFor={formItemId} {...props} />;
});
FormLabel.displayName = 'FormLabel';

const FormControl = React.forwardRef<React.ElementRef<typeof Slot>, React.ComponentPropsWithoutRef<typeof Slot>>(
  ({ ...props }, ref) => {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

    return (
      <Slot
        ref={ref}
        id={formItemId}
        aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
    );
  },
);
FormControl.displayName = 'FormControl';

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { formDescriptionId } = useFormField();

    return <p ref={ref} id={formDescriptionId} className={cn('text-sm text-muted-foreground', className)} {...props} />;
  },
);
FormDescription.displayName = 'FormDescription';

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { error, formMessageId } = useFormField();
    const body = error ? String(error.message) : children;

    if (!body) {
      return null;
    }

    return (
      <p ref={ref} id={formMessageId} className={cn('text-sm font-medium text-destructive', className)} {...props}>
        {body}
      </p>
    );
  },
);
FormMessage.displayName = 'FormMessage';

export { useFormField, LoginForm, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField };
