import express from 'express';
import cors from 'cors';
import { config } from './config';
import { bootstrapAuth, login, logout, me, requireAuth, signup } from './auth';
import {
  requireApplicationOwnership,
  requireCompanyOwnership,
  requireInterviewOwnership,
  requireNoteOwnership,
  requireReminderOwnership,
  requireResumeOwnership
} from './authorization';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(bootstrapAuth);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'job-application-tracker-api' });
});

app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);
app.get('/api/auth/me', requireAuth, me);

app.get('/api/dashboard/summary', requireAuth, (_req, res) => {
  res.json({
    totalApplications: 0,
    activeApplications: 0,
    interviewsScheduled: 0,
    followUpsDue: 0
  });
});

app.get('/api/companies', requireAuth, (_req, res) => {
  res.json({ companies: [] });
});

app.post('/api/companies', requireAuth, (_req, res) => {
  res.status(201).json({ company: null });
});

app.get('/api/companies/:companyId', requireAuth, requireCompanyOwnership(), (_req, res) => {
  res.json({ company: null });
});

app.patch('/api/companies/:companyId', requireAuth, requireCompanyOwnership(), (_req, res) => {
  res.json({ company: null });
});

app.delete('/api/companies/:companyId', requireAuth, requireCompanyOwnership(), (_req, res) => {
  res.status(204).send();
});

app.get('/api/applications', requireAuth, (_req, res) => {
  res.json({ applications: [] });
});

app.post('/api/applications', requireAuth, (_req, res) => {
  res.status(201).json({ application: null });
});

app.get('/api/applications/:applicationId', requireAuth, requireApplicationOwnership(), (_req, res) => {
  res.json({ application: null });
});

app.patch('/api/applications/:applicationId', requireAuth, requireApplicationOwnership(), (_req, res) => {
  res.json({ application: null });
});

app.delete('/api/applications/:applicationId', requireAuth, requireApplicationOwnership(), (_req, res) => {
  res.status(204).send();
});

app.post('/api/applications/:applicationId/notes', requireAuth, requireApplicationOwnership(), (_req, res) => {
  res.status(201).json({ note: null });
});

app.patch('/api/notes/:noteId', requireAuth, requireNoteOwnership(), (_req, res) => {
  res.json({ note: null });
});

app.delete('/api/notes/:noteId', requireAuth, requireNoteOwnership(), (_req, res) => {
  res.status(204).send();
});

app.post('/api/applications/:applicationId/reminders', requireAuth, requireApplicationOwnership(), (_req, res) => {
  res.status(201).json({ reminder: null });
});

app.patch('/api/reminders/:reminderId', requireAuth, requireReminderOwnership(), (_req, res) => {
  res.json({ reminder: null });
});

app.delete('/api/reminders/:reminderId', requireAuth, requireReminderOwnership(), (_req, res) => {
  res.status(204).send();
});

app.post('/api/applications/:applicationId/interviews', requireAuth, requireApplicationOwnership(), (_req, res) => {
  res.status(201).json({ interview: null });
});

app.patch('/api/interviews/:interviewId', requireAuth, requireInterviewOwnership(), (_req, res) => {
  res.json({ interview: null });
});

app.delete('/api/interviews/:interviewId', requireAuth, requireInterviewOwnership(), (_req, res) => {
  res.status(204).send();
});

app.get('/api/resumes', requireAuth, (_req, res) => {
  res.json({ resumes: [] });
});

app.post('/api/resumes', requireAuth, (_req, res) => {
  res.status(201).json({ resume: null });
});

app.patch('/api/resumes/:resumeId', requireAuth, requireResumeOwnership(), (_req, res) => {
  res.json({ resume: null });
});

app.delete('/api/resumes/:resumeId', requireAuth, requireResumeOwnership(), (_req, res) => {
  res.status(204).send();
});

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port} (${config.nodeEnv})`);
});
