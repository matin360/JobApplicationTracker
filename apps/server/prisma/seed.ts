import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/auth';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.interview.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.note.deleteMany();
  await prisma.application.deleteMany();
  await prisma.resumeVersion.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  // Create a test user
  const passwordHash = await hashPassword('password123');
  const user = await prisma.user.create({
    data: {
      email: 'john@example.com',
      name: 'John Doe',
      passwordHash,
    },
  });

  // Create companies
  const googleCompany = await prisma.company.create({
    data: {
      userId: user.id,
      name: 'Google',
      website: 'google.com',
      location: 'Mountain View, CA',
    },
  });

  const microsoftCompany = await prisma.company.create({
    data: {
      userId: user.id,
      name: 'Microsoft',
      website: 'microsoft.com',
      location: 'Redmond, WA',
    },
  });

  const amazonCompany = await prisma.company.create({
    data: {
      userId: user.id,
      name: 'Amazon',
      website: 'amazon.com',
      location: 'Seattle, WA',
    },
  });

  // Create resume versions
  const resumeV1 = await prisma.resumeVersion.create({
    data: {
      userId: user.id,
      label: 'Senior Developer - v1',
      fileUrl: '/resumes/john-doe-senior-dev-v1.pdf',
    },
  });

  const resumeV2 = await prisma.resumeVersion.create({
    data: {
      userId: user.id,
      label: 'Full Stack - v2',
      fileUrl: '/resumes/john-doe-fullstack-v2.pdf',
    },
  });

  // Create applications
  const googleApp = await prisma.application.create({
    data: {
      userId: user.id,
      companyId: googleCompany.id,
      roleTitle: 'Senior Software Engineer',
      location: 'Mountain View, CA',
      source: 'LinkedIn',
      status: 'interviewing',
      appliedAt: new Date('2025-06-15'),
      jobUrl: 'https://careers.google.com/jobs/123',
      salaryRange: '$200k - $250k',
      priority: 'high',
      nextFollowUpAt: new Date('2025-07-10'),
    },
  });

  const microsoftApp = await prisma.application.create({
    data: {
      userId: user.id,
      companyId: microsoftCompany.id,
      roleTitle: 'Software Engineer II',
      location: 'Redmond, WA',
      source: 'Referral',
      status: 'applied',
      appliedAt: new Date('2025-06-20'),
      jobUrl: 'https://careers.microsoft.com/jobs/456',
      priority: 'high',
      nextFollowUpAt: new Date('2025-07-05'),
    },
  });

  const amazonApp = await prisma.application.create({
    data: {
      userId: user.id,
      companyId: amazonCompany.id,
      roleTitle: 'SDE (Senior Development Engineer)',
      location: 'Seattle, WA',
      source: 'Indeed',
      status: 'saved',
      jobUrl: 'https://amazon.jobs/positions/789',
      salaryRange: '$180k - $220k',
      priority: 'medium',
    },
  });

  // Create notes
  await prisma.note.create({
    data: {
      applicationId: googleApp.id,
      content: 'First round interview went well. Focus on system design next.',
    },
  });

  await prisma.note.create({
    data: {
      applicationId: googleApp.id,
      content: 'Interviewer seemed interested in cloud architecture experience.',
    },
  });

  await prisma.note.create({
    data: {
      applicationId: microsoftApp.id,
      content: 'Contact: Sarah Chen (sarah@microsoft.com) - referred by Tom',
    },
  });

  // Create reminders
  await prisma.reminder.create({
    data: {
      applicationId: googleApp.id,
      title: 'Follow up on second round interview',
      dueAt: new Date('2025-07-10'),
    },
  });

  await prisma.reminder.create({
    data: {
      applicationId: microsoftApp.id,
      title: 'Send thank you email',
      dueAt: new Date('2025-07-05'),
    },
  });

  await prisma.reminder.create({
    data: {
      applicationId: amazonApp.id,
      title: 'Review job description and prepare questions',
      dueAt: new Date('2025-07-08'),
    },
  });

  // Create interviews
  await prisma.interview.create({
    data: {
      applicationId: googleApp.id,
      stage: 'Phone Screen',
      scheduledAt: new Date('2025-06-25T10:00:00Z'),
      notes: 'Conducted by Priya. Covered coding basics and experience. Went 45 minutes.',
    },
  });

  await prisma.interview.create({
    data: {
      applicationId: googleApp.id,
      stage: 'Coding Interview',
      scheduledAt: new Date('2025-07-05T14:00:00Z'),
      notes: 'System design focus. Need to prepare more on scalability.',
    },
  });

  await prisma.interview.create({
    data: {
      applicationId: microsoftApp.id,
      stage: 'Initial Chat',
      scheduledAt: new Date('2025-06-28T09:00:00Z'),
      notes: 'Nice conversation about the team and project.',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`
  Sample data created:
  - 1 User (john@example.com)
  - 3 Companies (Google, Microsoft, Amazon)
  - 2 Resume Versions
  - 3 Applications
  - 3 Notes
  - 3 Reminders
  - 3 Interviews
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
