import { useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const Textarea = ({ label, id, className, ...rest }: TextareaProps) => {
  const autoId = useId();
  const textareaId = id ?? autoId;

  return (
    <div className="ui-field">
      {label ? (
        <label className="ui-field__label" htmlFor={textareaId}>
          {label}
        </label>
      ) : null}
      <textarea id={textareaId} className={['ui-input', 'ui-textarea', className].filter(Boolean).join(' ')} {...rest} />
    </div>
  );
};

export default Textarea;
