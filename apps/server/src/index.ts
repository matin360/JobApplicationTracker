import express from 'express';
import cors from 'cors';
import { config } from './config';
import { bootstrapAuth, login, logout, me, requireAuth, signup } from './auth';
import {
  createApplication,
  deleteApplication,
  getApplication,
  listApplications,
  updateApplication
} from './applications';
import { getDashboardSummary } from './dashboard';
import { exportApplicationsCsv } from './export';
import {
  createInterview,
  createNote,
  createReminder,
  deleteInterview,
  deleteNote,
  deleteReminder,
  updateInterview,
  updateNote,
  updateReminder
} from './children';
import {
  requireApplicationOwnership,
  requireCompanyOwnership,
  requireInterviewOwnership,
  requireNoteOwnership,
  requireReminderOwnership,
  requireResumeOwnership
} from './authorization';

const app = express();

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
  // Let cross-origin clients read the CSV export filename.
  exposedHeaders: ['Content-Disposition'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(bootstrapAuth);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'job-application-tracker-api' });
});

app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);
app.get('/api/auth/me', requireAuth, me);

app.get('/api/dashboard/summary', requireAuth, getDashboardSummary);

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

app.get('/api/applications', requireAuth, listApplications);

// Must be registered before /api/applications/:applicationId so "export" is not read as an id.
app.get('/api/applications/export', requireAuth, exportApplicationsCsv);

app.post('/api/applications', requireAuth, createApplication);

app.get('/api/applications/:applicationId', requireAuth, requireApplicationOwnership(), getApplication);

app.patch('/api/applications/:applicationId', requireAuth, requireApplicationOwnership(), updateApplication);

app.delete('/api/applications/:applicationId', requireAuth, requireApplicationOwnership(), deleteApplication);

app.post('/api/applications/:applicationId/notes', requireAuth, requireApplicationOwnership(), createNote);

app.patch('/api/notes/:noteId', requireAuth, requireNoteOwnership(), updateNote);

app.delete('/api/notes/:noteId', requireAuth, requireNoteOwnership(), deleteNote);

app.post('/api/applications/:applicationId/reminders', requireAuth, requireApplicationOwnership(), createReminder);

app.patch('/api/reminders/:reminderId', requireAuth, requireReminderOwnership(), updateReminder);

app.delete('/api/reminders/:reminderId', requireAuth, requireReminderOwnership(), deleteReminder);

app.post('/api/applications/:applicationId/interviews', requireAuth, requireApplicationOwnership(), createInterview);

app.patch('/api/interviews/:interviewId', requireAuth, requireInterviewOwnership(), updateInterview);

app.delete('/api/interviews/:interviewId', requireAuth, requireInterviewOwnership(), deleteInterview);

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
