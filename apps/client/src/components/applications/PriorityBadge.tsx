import Badge from '../ui/Badge';
import type { BadgeTone } from '../ui/Badge';
import type { ApplicationPriority } from '../../api/applications';

const priorityTone: Record<ApplicationPriority, BadgeTone> = {
  high: 'danger',
  medium: 'info',
  low: 'neutral'
};

const PriorityBadge = ({ priority }: { priority: ApplicationPriority }) => (
  <Badge tone={priorityTone[priority] ?? 'neutral'}>{priority}</Badge>
);

export default PriorityBadge;
