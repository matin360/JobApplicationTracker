import express from 'express';
import cors from 'cors';
import { config } from './config';
import { asyncHandler, errorHandler } from './middleware';
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
app.use(asyncHandler(bootstrapAuth));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'job-application-tracker-api' });
});

app.post('/api/auth/signup', asyncHandler(signup));
app.post('/api/auth/login', asyncHandler(login));
app.post('/api/auth/logout', asyncHandler(logout));
app.get('/api/auth/me', asyncHandler(requireAuth), asyncHandler(me));

app.get('/api/dashboard/summary', asyncHandler(requireAuth), asyncHandler(getDashboardSummary));

app.get('/api/companies', asyncHandler(requireAuth), (_req, res) => {
  res.json({ companies: [] });
});

app.post('/api/companies', asyncHandler(requireAuth), (_req, res) => {
  res.status(201).json({ company: null });
});

app.get('/api/companies/:companyId', asyncHandler(requireAuth), asyncHandler(requireCompanyOwnership()), (_req, res) => {
  res.json({ company: null });
});

app.patch('/api/companies/:companyId', asyncHandler(requireAuth), asyncHandler(requireCompanyOwnership()), (_req, res) => {
  res.json({ company: null });
});

app.delete('/api/companies/:companyId', asyncHandler(requireAuth), asyncHandler(requireCompanyOwnership()), (_req, res) => {
  res.status(204).send();
});

app.get('/api/applications', asyncHandler(requireAuth), asyncHandler(listApplications));

// Must be registered before /api/applications/:applicationId so "export" is not read as an id.
app.get('/api/applications/export', asyncHandler(requireAuth), asyncHandler(exportApplicationsCsv));

app.post('/api/applications', asyncHandler(requireAuth), asyncHandler(createApplication));

app.get('/api/applications/:applicationId', asyncHandler(requireAuth), asyncHandler(requireApplicationOwnership()), asyncHandler(getApplication));

app.patch('/api/applications/:applicationId', asyncHandler(requireAuth), asyncHandler(requireApplicationOwnership()), asyncHandler(updateApplication));

app.delete('/api/applications/:applicationId', asyncHandler(requireAuth), asyncHandler(requireApplicationOwnership()), asyncHandler(deleteApplication));

app.post('/api/applications/:applicationId/notes', asyncHandler(requireAuth), asyncHandler(requireApplicationOwnership()), asyncHandler(createNote));

app.patch('/api/notes/:noteId', asyncHandler(requireAuth), asyncHandler(requireNoteOwnership()), asyncHandler(updateNote));

app.delete('/api/notes/:noteId', asyncHandler(requireAuth), asyncHandler(requireNoteOwnership()), asyncHandler(deleteNote));

app.post('/api/applications/:applicationId/reminders', asyncHandler(requireAuth), asyncHandler(requireApplicationOwnership()), asyncHandler(createReminder));

app.patch('/api/reminders/:reminderId', asyncHandler(requireAuth), asyncHandler(requireReminderOwnership()), asyncHandler(updateReminder));

app.delete('/api/reminders/:reminderId', asyncHandler(requireAuth), asyncHandler(requireReminderOwnership()), asyncHandler(deleteReminder));

app.post('/api/applications/:applicationId/interviews', asyncHandler(requireAuth), asyncHandler(requireApplicationOwnership()), asyncHandler(createInterview));

app.patch('/api/interviews/:interviewId', asyncHandler(requireAuth), asyncHandler(requireInterviewOwnership()), asyncHandler(updateInterview));

app.delete('/api/interviews/:interviewId', asyncHandler(requireAuth), asyncHandler(requireInterviewOwnership()), asyncHandler(deleteInterview));

app.get('/api/resumes', asyncHandler(requireAuth), (_req, res) => {
  res.json({ resumes: [] });
});

app.post('/api/resumes', asyncHandler(requireAuth), (_req, res) => {
  res.status(201).json({ resume: null });
});

app.patch('/api/resumes/:resumeId', asyncHandler(requireAuth), asyncHandler(requireResumeOwnership()), (_req, res) => {
  res.json({ resume: null });
});

app.delete('/api/resumes/:resumeId', asyncHandler(requireAuth), asyncHandler(requireResumeOwnership()), (_req, res) => {
  res.status(204).send();
});

// Terminal error middleware — must be registered after every route.
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port} (${config.nodeEnv})`);
});
