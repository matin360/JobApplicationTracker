import type { ApplicationDetail } from '../../applications';
import { buildActivity } from './activity';
import { formatDateTime } from './format';
import Card from '../ui/Card';

const ActivityTimeline = ({ application }: { application: ApplicationDetail }) => {
  const events = buildActivity(application);

  return (
    <Card title="Activity">
      <ul className="timeline">
        {events.map((event, index) => (
          <li key={`${event.when}-${index}`} className="timeline-item">
            <span>{event.text}</span>
            <span className="timeline-item__when">{formatDateTime(event.when)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default ActivityTimeline;
