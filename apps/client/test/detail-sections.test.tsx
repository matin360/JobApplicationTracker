import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NotesSection from '../src/components/applications/NotesSection';
import RemindersSection from '../src/components/applications/RemindersSection';
import InterviewsSection from '../src/components/applications/InterviewsSection';
import { buildActivity } from '../src/components/applications/activity';
import * as children from '../src/api/children';
import type { ApplicationDetail } from '../src/api/applications';
import type { InterviewRecord, NoteRecord, ReminderRecord } from '../src/api/children';

vi.mock('../src/api/children', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/api/children')>()),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  createReminder: vi.fn(),
  updateReminder: vi.fn(),
  deleteReminder: vi.fn(),
  createInterview: vi.fn(),
  updateInterview: vi.fn(),
  deleteInterview: vi.fn()
}));

const mocked = children as unknown as Record<
  | 'createNote'
  | 'updateNote'
  | 'deleteNote'
  | 'createReminder'
  | 'updateReminder'
  | 'deleteReminder'
  | 'createInterview'
  | 'updateInterview'
  | 'deleteInterview',
  ReturnType<typeof vi.fn>
>;

const makeNote = (overrides: Partial<NoteRecord> = {}): NoteRecord => ({
  id: 'n1',
  applicationId: 'app-1',
  content: 'Existing note',
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
  ...overrides
});

const makeReminder = (overrides: Partial<ReminderRecord> = {}): ReminderRecord => ({
  id: 'r1',
  applicationId: 'app-1',
  title: 'Follow up',
  dueAt: '2099-12-31T00:00:00.000Z',
  completedAt: null,
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
  ...overrides
});

const makeInterview = (overrides: Partial<InterviewRecord> = {}): InterviewRecord => ({
  id: 'i1',
  applicationId: 'app-1',
  stage: 'Phone screen',
  scheduledAt: '2026-07-10T14:00:00.000Z',
  notes: null,
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
  ...overrides
});

describe('NotesSection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('adds a note and prepends it to the list', async () => {
    const created = makeNote({ id: 'n2', content: 'Fresh note' });
    mocked.createNote.mockResolvedValue(created);
    const onChange = vi.fn();

    render(<NotesSection applicationId="app-1" notes={[makeNote()]} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Add note'), { target: { value: 'Fresh note' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add note' }));

    await waitFor(() => expect(mocked.createNote).toHaveBeenCalledWith('app-1', 'Fresh note'));
    expect(onChange).toHaveBeenCalledWith([created, makeNote()]);
  });

  it('disables the add button when the draft is empty', () => {
    render(<NotesSection applicationId="app-1" notes={[]} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Add note' })).toBeDisabled();
  });

  it('edits an existing note', async () => {
    const note = makeNote();
    mocked.updateNote.mockResolvedValue({ ...note, content: 'Changed' });
    const onChange = vi.fn();

    render(<NotesSection applicationId="app-1" notes={[note]} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Edit note'), { target: { value: 'Changed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }));

    await waitFor(() => expect(mocked.updateNote).toHaveBeenCalledWith('n1', 'Changed'));
    expect(onChange).toHaveBeenCalledWith([{ ...note, content: 'Changed' }]);
  });

  it('deletes a note', async () => {
    mocked.deleteNote.mockResolvedValue(undefined);
    const onChange = vi.fn();

    render(<NotesSection applicationId="app-1" notes={[makeNote()]} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(mocked.deleteNote).toHaveBeenCalledWith('n1'));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});

describe('RemindersSection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('adds a reminder with title and due date', async () => {
    const created = makeReminder({ id: 'r2', title: 'Send thank-you' });
    mocked.createReminder.mockResolvedValue(created);
    const onChange = vi.fn();

    render(<RemindersSection applicationId="app-1" reminders={[]} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Reminder'), { target: { value: 'Send thank-you' } });
    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2026-08-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add reminder' }));

    await waitFor(() =>
      expect(mocked.createReminder).toHaveBeenCalledWith('app-1', { title: 'Send thank-you', dueAt: '2026-08-01' })
    );
    expect(onChange).toHaveBeenCalledWith([created]);
  });

  it('marks a reminder as completed and shows done state', async () => {
    const reminder = makeReminder();
    const completed = { ...reminder, completedAt: '2026-07-05T00:00:00.000Z' };
    mocked.updateReminder.mockResolvedValue(completed);
    const onChange = vi.fn();

    render(<RemindersSection applicationId="app-1" reminders={[reminder]} onChange={onChange} />);

    expect(screen.getByText('active')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Complete' }));

    await waitFor(() => expect(mocked.updateReminder).toHaveBeenCalledWith('r1', { completed: true }));
    expect(onChange).toHaveBeenCalledWith([completed]);
  });

  it('shows overdue and done badges', () => {
    render(
      <RemindersSection
        applicationId="app-1"
        reminders={[
          makeReminder({ id: 'r-over', dueAt: '2020-01-01T00:00:00.000Z' }),
          makeReminder({ id: 'r-done', completedAt: '2026-07-05T00:00:00.000Z' })
        ]}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('overdue')).toBeInTheDocument();
    expect(screen.getByText('done')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reopen' })).toBeInTheDocument();
  });

  it('edits a reminder title and due date', async () => {
    const reminder = makeReminder();
    const updated = { ...reminder, title: 'New title' };
    mocked.updateReminder.mockResolvedValue(updated);
    const onChange = vi.fn();

    render(<RemindersSection applicationId="app-1" reminders={[reminder]} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Edit reminder title'), { target: { value: 'New title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save reminder' }));

    await waitFor(() =>
      expect(mocked.updateReminder).toHaveBeenCalledWith('r1', { title: 'New title', dueAt: '2099-12-31' })
    );
    expect(onChange).toHaveBeenCalledWith([updated]);
  });
});

describe('InterviewsSection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('adds an interview with stage and date', async () => {
    const created = makeInterview({ id: 'i2', stage: 'Onsite' });
    mocked.createInterview.mockResolvedValue(created);
    const onChange = vi.fn();

    render(<InterviewsSection applicationId="app-1" interviews={[]} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Stage'), { target: { value: 'Onsite' } });
    fireEvent.change(screen.getByLabelText('Date and time'), { target: { value: '2026-07-15T10:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add interview' }));

    await waitFor(() =>
      expect(mocked.createInterview).toHaveBeenCalledWith('app-1', {
        stage: 'Onsite',
        scheduledAt: '2026-07-15T10:00',
        notes: null
      })
    );
    expect(onChange).toHaveBeenCalledWith([created]);
  });

  it('edits an interview stage', async () => {
    const interview = makeInterview();
    const updated = { ...interview, stage: 'Final round' };
    mocked.updateInterview.mockResolvedValue(updated);
    const onChange = vi.fn();

    render(<InterviewsSection applicationId="app-1" interviews={[interview]} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Edit stage'), { target: { value: 'Final round' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save interview' }));

    await waitFor(() => expect(mocked.updateInterview).toHaveBeenCalled());
    expect(onChange).toHaveBeenCalledWith([updated]);
  });

  it('deletes an interview', async () => {
    mocked.deleteInterview.mockResolvedValue(undefined);
    const onChange = vi.fn();

    render(<InterviewsSection applicationId="app-1" interviews={[makeInterview()]} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(mocked.deleteInterview).toHaveBeenCalledWith('i1'));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});

describe('buildActivity', () => {
  it('merges application and child events newest-first', () => {
    const application: ApplicationDetail = {
      id: 'app-1',
      company: null,
      roleTitle: 'Engineer',
      location: null,
      source: null,
      status: 'applied',
      appliedAt: '2026-07-02T00:00:00.000Z',
      jobUrl: null,
      priority: null,
      nextFollowUpAt: null,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
      notes: [makeNote({ createdAt: '2026-07-03T00:00:00.000Z' })],
      reminders: [
        makeReminder({ createdAt: '2026-07-04T00:00:00.000Z', completedAt: '2026-07-05T00:00:00.000Z' })
      ],
      interviews: [makeInterview({ createdAt: '2026-07-06T00:00:00.000Z' })]
    };

    const events = buildActivity(application);

    expect(events.map((event) => event.text)).toEqual([
      'Interview added: Phone screen',
      'Reminder completed: Follow up',
      'Reminder added: Follow up',
      'Note added',
      'Applied',
      'Application created'
    ]);
  });
});
