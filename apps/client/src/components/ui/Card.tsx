import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  className?: string;
  children: ReactNode;
}

/** White content card; `title` renders an h2 so card headings are consistent app-wide. */
const Card = ({ title, className, children }: CardProps) => (
  <section className={['ui-card', className].filter(Boolean).join(' ')}>
    {title ? <h2 className="ui-card__title">{title}</h2> : null}
    {children}
  </section>
);

export default Card;
