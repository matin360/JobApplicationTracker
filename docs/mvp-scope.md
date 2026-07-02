# MVP Scope

## Included entities

### User
Stores the authenticated person using the app.

Fields:
- id
- email
- name
- createdAt
- updatedAt

### Company
Represents an employer or organization.

Fields:
- id
- name
- website
- location
- createdAt
- updatedAt

### Application
Represents one job application submitted or planned.

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

### Note
Free-form notes attached to an application.

Fields:
- id
- applicationId
- content
- createdAt
- updatedAt

### Reminder
A follow-up or task tied to an application.

Fields:
- id
- applicationId
- title
- dueAt
- completedAt
- createdAt
- updatedAt

### ResumeVersion
A stored resume version used for one or more applications.

Fields:
- id
- userId
- label
- fileUrl or filePath
- createdAt
- updatedAt

### Interview
An interview event or stage item for a specific application.

Fields:
- id
- applicationId
- stage
- scheduledAt
- notes
- createdAt
- updatedAt

## First screens

### Dashboard
Purpose:
- Show pipeline overview.
- Surface upcoming follow-ups.
- Show recent activity.
- Display counts by status.

Main content:
- Status summary cards.
- Upcoming reminders.
- Recent applications.
- Optional small chart or pipeline progress view.

### Applications list
Purpose:
- Main working screen for managing the job search.

Main content:
- Table or list of applications.
- Search and filters.
- Sort by date, status, company, and follow-up.
- Quick status updates.
- Link to detail page.

### Application detail
Purpose:
- Central view for one application.

Main content:
- Company and role summary.
- Current status.
- Application timeline.
- Notes.
- Reminders.
- Interviews.
- Resume version used.
- Edit and delete actions.

### Settings
Purpose:
- User preferences and account controls.

Main content:
- Profile.
- Notification preferences.
- Data export/import.
- Theme settings if needed.
- Account/logout.

## MVP features

- Authentication.
- Application CRUD.
- Company CRUD or auto-create on demand.
- Notes on applications.
- Reminders on applications.
- Interview tracking.
- Resume version tracking.
- Dashboard stats.
- Search and filters.
- CSV export.
- Responsive layout.

## API scope

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Companies
- `GET /api/companies`
- `POST /api/companies`
- `GET /api/companies/:id`
- `PATCH /api/companies/:id`
- `DELETE /api/companies/:id`

### Applications
- `GET /api/applications`
- `POST /api/applications`
- `GET /api/applications/:id`
- `PATCH /api/applications/:id`
- `DELETE /api/applications/:id`

### Notes
- `POST /api/applications/:id/notes`
- `PATCH /api/notes/:id`
- `DELETE /api/notes/:id`

### Reminders
- `POST /api/applications/:id/reminders`
- `PATCH /api/reminders/:id`
- `DELETE /api/reminders/:id`

### Interviews
- `POST /api/applications/:id/interviews`
- `PATCH /api/interviews/:id`
- `DELETE /api/interviews/:id`

### Resume versions
- `GET /api/resumes`
- `POST /api/resumes`
- `PATCH /api/resumes/:id`
- `DELETE /api/resumes/:id`

### Dashboard
- `GET /api/dashboard/summary`

## MVP non-goals

- Job scraping.
- AI features.
- Browser extensions.
- Public sharing links.
- Collaborative team workflows.
- Advanced analytics.
- Inbox integrations.