import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

/** Small status pill; `tone` selects the color pair (neutral/info/success/warning/danger). */
const Badge = ({ tone = 'neutral', children }: BadgeProps) => (
  <span className={`ui-badge ui-badge--${tone}`}>{children}</span>
);

export default Badge;
