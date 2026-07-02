# Product Spec

## Product name
Job Application Tracker

## One-line summary
A self-hostable job application tracker that helps job seekers organize applications, follow-ups, interviews, and notes in one private place.

## Problem
Job seekers often track applications across spreadsheets, email threads, notes apps, and calendars. This creates friction, missed follow-ups, and poor visibility into the status of each application.

## Solution
Provide a simple web app where users can log applications, track stages, add notes, set reminders, and review their pipeline from a dashboard.

## Target users
- Individual job seekers.
- Developers and other professionals applying to multiple roles.
- Users who want a private, self-hosted alternative to spreadsheets or SaaS trackers.

## Product principles
- Simple before advanced.
- Private by default.
- Fast to log and update applications.
- Easy to self-host and contribute to.
- Designed around a clear job-search workflow.

## Core user value
- Know what was applied to and when.
- See which applications need follow-up.
- Keep interview notes in one place.
- Understand pipeline progress at a glance.

## Non-goals for MVP
- AI resume scoring.
- Inbox/Gmail automation.
- Public networking features.
- Team hiring workflows.
- Job board aggregation.
- Browser extensions.

## REST API approach
Use a REST API for the backend so the frontend can stay simple and the project can scale in clear resource-based steps.

### Resource model
- Auth/session.
- Users.
- Companies.
- Applications.
- Notes.
- Reminders.
- Resume versions.
- Interviews.

### API style
- `GET` for reads.
- `POST` for creates.
- `PATCH` for partial updates.
- `DELETE` for removals.
- JSON request and response bodies.
- Resource-oriented routes like `/api/applications/:id`.

## Success criteria
The product is successful if a user can:
1. Sign in.
2. Add an application in under a minute.
3. See all applications in one list.
4. Open an application and review its history.
5. Track upcoming follow-ups.
6. Use the dashboard to understand their search progress.

## Future direction
After MVP, the app can add:
- Resume version tracking.
- Interview prep notes.
- CSV import/export improvements.
- Email integration.
- Smart reminders.
- Analytics by source, role type, or response rate.