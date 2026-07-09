import { useId } from 'react';
import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const Select = ({ label, id, className, children, ...rest }: SelectProps) => {
  const autoId = useId();
  const selectId = id ?? autoId;

  return (
    <div className="ui-field">
      {label ? (
        <label className="ui-field__label" htmlFor={selectId}>
          {label}
        </label>
      ) : null}
      <select id={selectId} className={['ui-input', className].filter(Boolean).join(' ')} {...rest}>
        {children}
      </select>
    </div>
  );
};

export default Select;
