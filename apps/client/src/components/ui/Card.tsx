import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  className?: string;
  children: ReactNode;
}

const Card = ({ title, className, children }: CardProps) => (
  <section className={['ui-card', className].filter(Boolean).join(' ')}>
    {title ? <h2 className="ui-card__title">{title}</h2> : null}
    {children}
  </section>
);

export default Card;
