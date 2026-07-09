import type { FormHTMLAttributes } from 'react';

type FormProps = FormHTMLAttributes<HTMLFormElement>;

// Thin wrapper that gives every form the same vertical rhythm.
const Form = ({ className, ...rest }: FormProps) => (
  <form className={['ui-form', className].filter(Boolean).join(' ')} {...rest} />
);

export default Form;
