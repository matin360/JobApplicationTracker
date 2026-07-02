import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'job-application-tracker-api' });
});

app.get('/api/dashboard/summary', (_req, res) => {
  res.json({
    totalApplications: 0,
    activeApplications: 0,
    interviewsScheduled: 0,
    followUpsDue: 0
  });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
