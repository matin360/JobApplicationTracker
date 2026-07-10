import { useState } from 'react';
import type { FormEvent } from 'react';
import { APPLICATION_PRIORITIES, APPLICATION_STATUSES } from '../../api/applications';
import type { ApplicationInput, ApplicationPriority, ApplicationRecord, ApplicationStatus } from '../../api/applications';
import { toDateInputValue } from './format';
import Button from '../ui/Button';
import Form from '../ui/Form';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface ApplicationFormProps {
  initial?: ApplicationRecord;
  submitLabel: string;
  onSubmit: (input: ApplicationInput) => Promise<void>;
  onCancel: () => void;
}

// Shared create/edit form. Owns field state and client-side validation;
// the caller decides what the submit action does.
const ApplicationForm = ({ initial, submitLabel, onSubmit, onCancel }: ApplicationFormProps) => {
  const [company, setCompany] = useState(initial?.company?.name ?? '');
  const [roleTitle, setRoleTitle] = useState(initial?.roleTitle ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [source, setSource] = useState(initial?.source ?? '');
  const [status, setStatus] = useState<ApplicationStatus>(initial?.status ?? 'saved');
  const [appliedAt, setAppliedAt] = useState(toDateInputValue(initial?.appliedAt ?? null));
  const [jobUrl, setJobUrl] = useState(initial?.jobUrl ?? '');
  const [priority, setPriority] = useState<ApplicationPriority>(initial?.priority ?? 'medium');
  const [nextFollowUpAt, setNextFollowUpAt] = useState(toDateInputValue(initial?.nextFollowUpAt ?? null));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const validate = (): string => {
    if (!roleTitle.trim()) {
      return 'Role title is required.';
    }
    if (jobUrl.trim()) {
      try {
        const parsed = new URL(jobUrl.trim());
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new Error('unsupported protocol');
        }
      } catch {
        return 'Job URL must be a valid http(s) URL.';
      }
    }
    return '';
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setSaving(true);

    try {
      await onSubmit({
        company: company.trim() || null,
        roleTitle: roleTitle.trim(),
        location: location.trim() || null,
        source: source.trim() || null,
        status,
        appliedAt: appliedAt || null,
        jobUrl: jobUrl.trim() || null,
        priority,
        nextFollowUpAt: nextFollowUpAt || null
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setSaving(false);
    }
  };

  return (
    <Form onSubmit={(event) => { void handleSubmit(event); }}>
      <div className="form-grid">
        <Input label="Company" value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Acme Corp" />
        <Input label="Role title" value={roleTitle} onChange={(event) => setRoleTitle(event.target.value)} placeholder="Frontend Engineer" />
        <Input label="Location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Remote" />
        <Input label="Source" value={source} onChange={(event) => setSource(event.target.value)} placeholder="LinkedIn, referral…" />
        <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value as ApplicationStatus)}>
          {APPLICATION_STATUSES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <Select label="Priority" value={priority} onChange={(event) => setPriority(event.target.value as ApplicationPriority)}>
          {APPLICATION_PRIORITIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <Input label="Applied date" type="date" value={appliedAt} onChange={(event) => setAppliedAt(event.target.value)} />
        <Input label="Next follow-up" type="date" value={nextFollowUpAt} onChange={(event) => setNextFollowUpAt(event.target.value)} />
      </div>

      <Input label="Job URL" value={jobUrl} onChange={(event) => setJobUrl(event.target.value)} placeholder="https://…" />

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </Form>
  );
};

export default ApplicationForm;
