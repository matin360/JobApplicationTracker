import { useState } from 'react';
import { createNote, deleteNote, updateNote } from '../../applications';
import type { NoteRecord } from '../../applications';
import { formatDateTime } from './format';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Textarea from '../ui/Textarea';

interface NotesSectionProps {
  applicationId: string;
  notes: NoteRecord[];
  onChange: (notes: NoteRecord[]) => void;
}

const NotesSection = ({ applicationId, notes, onChange }: NotesSectionProps) => {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
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
      const note = await createNote(applicationId, draft.trim());
      onChange([note, ...notes]);
      setDraft('');
    });

  const handleSaveEdit = (noteId: string) =>
    run(async () => {
      const updated = await updateNote(noteId, editDraft.trim());
      onChange(notes.map((note) => (note.id === noteId ? updated : note)));
      setEditingId(null);
    });

  const handleDelete = (noteId: string) =>
    run(async () => {
      await deleteNote(noteId);
      onChange(notes.filter((note) => note.id !== noteId));
    });

  return (
    <Card title="Notes">
      <div className="child-form">
        <Textarea
          label="Add note"
          placeholder="Interview context, follow-up details…"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={5000}
        />
        <div className="form-actions">
          <Button onClick={() => { void handleAdd(); }} disabled={busy || !draft.trim()}>
            Add note
          </Button>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      {notes.length === 0 ? (
        <p className="page-subtitle">No notes yet.</p>
      ) : (
        <ul className="child-list">
          {notes.map((note) => (
            <li key={note.id} className="child-item">
              {editingId === note.id ? (
                <>
                  <Textarea
                    aria-label="Edit note"
                    value={editDraft}
                    onChange={(event) => setEditDraft(event.target.value)}
                    maxLength={5000}
                  />
                  <div className="child-item__actions">
                    <Button onClick={() => { void handleSaveEdit(note.id); }} disabled={busy || !editDraft.trim()}>
                      Save note
                    </Button>
                    <Button variant="secondary" onClick={() => setEditingId(null)} disabled={busy}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="child-item__content">{note.content}</p>
                  <p className="child-item__meta">{formatDateTime(note.createdAt)}</p>
                  <div className="child-item__actions">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingId(note.id);
                        setEditDraft(note.content);
                      }}
                      disabled={busy}
                    >
                      Edit
                    </Button>
                    <Button variant="secondary" onClick={() => { void handleDelete(note.id); }} disabled={busy}>
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

export default NotesSection;
