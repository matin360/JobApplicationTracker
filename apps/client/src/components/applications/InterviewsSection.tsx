import { useState } from 'react';
import { createInterview, deleteInterview, updateInterview } from '../../api/children';
import type { InterviewRecord } from '../../api/children';
import { formatDateTime, toDateTimeInputValue } from './format';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';

interface InterviewsSectionProps {
  applicationId: string;
  interviews: InterviewRecord[];
  onChange: (interviews: InterviewRecord[]) => void;
}

const STAGE_SUGGESTIONS = ['Phone screen', 'Technical', 'Take-home', 'Onsite', 'Final round'];

const sortChronologically = (interviews: InterviewRecord[]) =>
  [...interviews].sort((a, b) => (a.scheduledAt ?? a.createdAt).localeCompare(b.scheduledAt ?? b.createdAt));

const InterviewsSection = ({ applicationId, interviews, onChange }: InterviewsSectionProps) => {
  const [stage, setStage] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStage, setEditStage] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = () =>
    run(async () => {
      const interview = await createInterview(applicationId, {
        stage: stage.trim(),
        scheduledAt: scheduledAt || null,
        notes: notes.trim() || null
      });
      onChange(sortChronologically([...interviews, interview]));
      setStage('');
      setScheduledAt('');
      setNotes('');
    });

  const handleSaveEdit = (interviewId: string) =>
    run(async () => {
      const updated = await updateInterview(interviewId, {
        stage: editStage.trim(),
        scheduledAt: editScheduledAt || null,
        notes: editNotes.trim() || null
      });
      onChange(sortChronologically(interviews.map((interview) => (interview.id === interviewId ? updated : interview))));
      setEditingId(null);
    });

  const handleDelete = (interviewId: string) =>
    run(async () => {
      await deleteInterview(interviewId);
      onChange(interviews.filter((interview) => interview.id !== interviewId));
    });

  return (
    <Card title="Interviews">
      <div className="child-form">
        <Input
          label="Stage"
          placeholder="Phone screen, onsite…"
          value={stage}
          onChange={(event) => setStage(event.target.value)}
          maxLength={100}
          list="interview-stages"
        />
        <datalist id="interview-stages">
          {STAGE_SUGGESTIONS.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
        <Input label="Date and time" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
        <Textarea label="Interview notes" placeholder="Panel, prep topics… (optional)" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={5000} />
        <div className="form-actions">
          <Button onClick={() => { void handleAdd(); }} disabled={busy || !stage.trim()}>
            Add interview
          </Button>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      {interviews.length === 0 ? (
        <p className="page-subtitle">No interviews yet.</p>
      ) : (
        <ul className="child-list">
          {interviews.map((interview) => (
            <li key={interview.id} className="child-item">
              {editingId === interview.id ? (
                <>
                  <Input aria-label="Edit stage" value={editStage} onChange={(event) => setEditStage(event.target.value)} maxLength={100} />
                  <Input aria-label="Edit date and time" type="datetime-local" value={editScheduledAt} onChange={(event) => setEditScheduledAt(event.target.value)} />
                  <Textarea aria-label="Edit interview notes" value={editNotes} onChange={(event) => setEditNotes(event.target.value)} maxLength={5000} />
                  <div className="child-item__actions">
                    <Button onClick={() => { void handleSaveEdit(interview.id); }} disabled={busy || !editStage.trim()}>
                      Save interview
                    </Button>
                    <Button variant="secondary" onClick={() => setEditingId(null)} disabled={busy}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="child-item__content">{interview.stage}</p>
                  <p className="child-item__meta">
                    {interview.scheduledAt ? formatDateTime(interview.scheduledAt) : 'Not scheduled'}
                  </p>
                  {interview.notes ? <p className="child-item__content">{interview.notes}</p> : null}
                  <div className="child-item__actions">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingId(interview.id);
                        setEditStage(interview.stage);
                        setEditScheduledAt(toDateTimeInputValue(interview.scheduledAt));
                        setEditNotes(interview.notes ?? '');
                      }}
                      disabled={busy}
                    >
                      Edit
                    </Button>
                    <Button variant="secondary" onClick={() => { void handleDelete(interview.id); }} disabled={busy}>
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

export default InterviewsSection;
