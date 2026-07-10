import { useState } from 'react';
import { createReminder, deleteReminder, updateReminder } from '../../api/children';
import type { ReminderRecord } from '../../api/children';
import { formatDate, toDateInputValue } from './format';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { useBusyAction } from '../../hooks/useBusyAction';

interface RemindersSectionProps {
  applicationId: string;
  reminders: ReminderRecord[];
  onChange: (reminders: ReminderRecord[]) => void;
}

const reminderBadge = (reminder: ReminderRecord) => {
  if (reminder.completedAt) {
    return <Badge tone="success">done</Badge>;
  }
  if (new Date(reminder.dueAt) < new Date()) {
    return <Badge tone="danger">overdue</Badge>;
  }
  return <Badge tone="info">active</Badge>;
};

const RemindersSection = ({ applicationId, reminders, onChange }: RemindersSectionProps) => {
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueAt, setEditDueAt] = useState('');
  const { busy, error, run } = useBusyAction();

  const replace = (updated: ReminderRecord) =>
    onChange(reminders.map((reminder) => (reminder.id === updated.id ? updated : reminder)));

  const handleAdd = () =>
    run(async () => {
      const reminder = await createReminder(applicationId, { title: title.trim(), dueAt });
      onChange([...reminders, reminder].sort((a, b) => a.dueAt.localeCompare(b.dueAt)));
      setTitle('');
      setDueAt('');
    });

  const handleToggleComplete = (reminder: ReminderRecord) =>
    run(async () => {
      replace(await updateReminder(reminder.id, { completed: !reminder.completedAt }));
    });

  const handleSaveEdit = (reminderId: string) =>
    run(async () => {
      replace(await updateReminder(reminderId, { title: editTitle.trim(), dueAt: editDueAt }));
      setEditingId(null);
    });

  const handleDelete = (reminderId: string) =>
    run(async () => {
      await deleteReminder(reminderId);
      onChange(reminders.filter((reminder) => reminder.id !== reminderId));
    });

  return (
    <Card title="Reminders">
      <div className="child-form">
        <Input label="Reminder" placeholder="Follow up with recruiter" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} />
        <Input label="Due date" type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
        <div className="form-actions">
          <Button onClick={() => { void handleAdd(); }} disabled={busy || !title.trim() || !dueAt}>
            Add reminder
          </Button>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      {reminders.length === 0 ? (
        <p className="page-subtitle">No reminders yet.</p>
      ) : (
        <ul className="child-list">
          {reminders.map((reminder) => (
            <li key={reminder.id} className={reminder.completedAt ? 'child-item child-item--done' : 'child-item'}>
              {editingId === reminder.id ? (
                <>
                  <Input aria-label="Edit reminder title" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} maxLength={200} />
                  <Input aria-label="Edit due date" type="date" value={editDueAt} onChange={(event) => setEditDueAt(event.target.value)} />
                  <div className="child-item__actions">
                    <Button onClick={() => { void handleSaveEdit(reminder.id); }} disabled={busy || !editTitle.trim() || !editDueAt}>
                      Save reminder
                    </Button>
                    <Button variant="secondary" onClick={() => setEditingId(null)} disabled={busy}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="child-item__content">{reminder.title}</p>
                  <p className="child-item__meta">
                    Due {formatDate(reminder.dueAt)} {reminderBadge(reminder)}
                  </p>
                  <div className="child-item__actions">
                    <Button variant="secondary" onClick={() => { void handleToggleComplete(reminder); }} disabled={busy}>
                      {reminder.completedAt ? 'Reopen' : 'Complete'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingId(reminder.id);
                        setEditTitle(reminder.title);
                        setEditDueAt(toDateInputValue(reminder.dueAt));
                      }}
                      disabled={busy}
                    >
                      Edit
                    </Button>
                    <Button variant="secondary" onClick={() => { void handleDelete(reminder.id); }} disabled={busy}>
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default RemindersSection;
