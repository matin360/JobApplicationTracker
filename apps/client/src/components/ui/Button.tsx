import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/** Button with visual variants; defaults to type="button" so it never submits a form accidentally. */
const Button = ({ variant = 'primary', className, type = 'button', ...rest }: ButtonProps) => (
  <button type={type} className={['ui-button', `ui-button--${variant}`, className].filter(Boolean).join(' ')} {...rest} />
);

export default Button;
