import Badge from '../ui/Badge';
import type { BadgeTone } from '../ui/Badge';
import type { ApplicationStatus } from '../../applications';

const statusTone: Record<ApplicationStatus, BadgeTone> = {
  saved: 'neutral',
  applied: 'info',
  interviewing: 'warning',
  offer: 'success',
  rejected: 'danger'
};

const StatusBadge = ({ status }: { status: ApplicationStatus }) => (
  <Badge tone={statusTone[status] ?? 'neutral'}>{status}</Badge>
);

export default StatusBadge;
