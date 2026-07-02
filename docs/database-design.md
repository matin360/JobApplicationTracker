# Database Design

## Purpose

This database supports a self-hostable job application tracker focused on helping users organize applications, follow-ups, interview history, notes, and resume versions.

The schema is intentionally small for MVP but structured enough to grow into reminders, analytics, and later automation.

## Design principles

- Keep ownership simple and explicit.
- Support the full job-search workflow with minimal tables.
- Make it easy to query applications with their company and activity history.
- Use foreign keys and cascades to keep data consistent.
- Index the fields most commonly used for filters and dashboards.

## Core entities

### User
Represents the authenticated person using the app.

Fields:
- id
- email
- name
- createdAt
- updatedAt

Purpose:
- Owns companies, applications, and resume versions.

### Company
Represents an employer or organization.

Fields:
- id
- userId
- name
- website
- location
- createdAt
- updatedAt

Purpose:
- Stores employer details and groups applications by company.

### Application
Represents one job application or target role.

Fields:
- id
- userId
- companyId
- roleTitle
- location
- source
- status
- appliedAt
- jobUrl
- salaryRange
- priority
- nextFollowUpAt
- createdAt
- updatedAt

Purpose:
- Main record for the tracker.
- Drives dashboard metrics, filtering, and list views.

### Note
Represents free-form notes attached to an application.

Fields:
- id
- applicationId
- content
- createdAt
- updatedAt

Purpose:
- Stores interview notes, reminders, context, and thoughts.

### Reminder
Represents a follow-up task tied to an application.

Fields:
- id
- applicationId
- title
- dueAt
- completedAt
- createdAt
- updatedAt

Purpose:
- Helps users remember when to follow up or take action.

### Interview
Represents an interview stage or scheduled interview event.

Fields:
- id
- applicationId
- stage
- scheduledAt
- notes
- createdAt
- updatedAt

Purpose:
- Stores interview progress and related context.

### ResumeVersion
Represents a stored resume version used across applications.

Fields:
- id
- userId
- label
- filePath or fileUrl
- createdAt
- updatedAt

Purpose:
- Lets users track which resume version was used for each application later.

## Status values

Recommended application statuses:

- saved
- applied
- interviewing
- offer
- rejected
- withdrawn

These values are enough for the MVP dashboard and list filters.

## Priority values

Recommended priority values:

- low
- medium
- high

Priority is optional but useful for sorting and deciding what to follow up on first.

## Relationships

- One user has many companies.
- One user has many applications.
- One user has many resume versions.
- One company belongs to one user.
- One company has many applications.
- One application belongs to one user.
- One application belongs to one company.
- One application has many notes.
- One application has many reminders.
- One application has many interviews.

## Indexing strategy

Add indexes for:
- `users.email`
- `companies.userId`
- `companies.name`
- `applications.userId`
- `applications.companyId`
- `applications.status`
- `applications.appliedAt`
- `applications.nextFollowUpAt`
- `notes.applicationId`
- `reminders.applicationId`
- `reminders.dueAt`
- `interviews.applicationId`
- `interviews.scheduledAt`
- `resumeVersions.userId`

These indexes support list views, search, filters, and upcoming reminder queries.

## Deletion strategy

Use cascading deletes for child records where appropriate:
- Deleting a user removes their companies, applications, notes, reminders, interviews, and resume versions.
- Deleting a company removes its applications and related child records through application cascades.
- Deleting an application removes its notes, reminders, and interviews.

This keeps the schema simple for MVP and avoids orphaned rows.

## Query patterns to support

The schema should make these common queries easy:

- Get all applications for a user, joined with company name.
- Get applications by status.
- Get applications with upcoming reminders.
- Get application details with notes and interview history.
- Get dashboard counts by status.
- Get recent applications.

## MVP scope notes

For MVP, keep company records user-owned rather than globally shared.
This reduces complexity and makes privacy easier.

Also keep `source`, `salaryRange`, and `stage` lightweight as strings or simple enums at first.
You can normalize them later if the product grows.

## Next step

After this schema is implemented, the next milestone is to create migrations and seed a small sample dataset so the UI can be developed against realistic data.