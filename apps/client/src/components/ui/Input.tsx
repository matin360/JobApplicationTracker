import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

const Input = ({ label, hint, id, className, ...rest }: InputProps) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className="ui-field">
      {label ? (
        <label className="ui-field__label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={['ui-input', className].filter(Boolean).join(' ')}
        aria-describedby={hintId}
        {...rest}
      />
      {hint ? (
        <span className="ui-field__hint" id={hintId}>
          {hint}
        </span>
      ) : null}
    </div>
  );
};

export default Input;
