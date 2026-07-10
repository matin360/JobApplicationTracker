# Roadmap

A realistic view of where the project is and where it's headed. Timelines are best-effort — this is a side project.

## ✅ MVP — done

- Cookie-based auth (signup / login / logout) with per-user data ownership everywhere
- Applications CRUD with status, priority, dates, source, and job URL
- Search, status filter, applied-date range filter, and sortable columns on the list
- Detail workspace: notes, reminders (complete/reopen, overdue badges), interviews, activity timeline
- Dashboard: status counts, status chart, upcoming reminders (completable in place), recent applications
- CSV export (filter-aware, RFC 4180)
- Responsive layout (desktop sidebar, mobile hamburger)
- Unit tests (client + server), Playwright e2e suite, GitHub Actions CI, Docker Compose stack

## 🔜 v2 — planned

- **Resume versions** — the `ResumeVersion` model already exists in the schema; link a resume version to each application and track which one you sent
- **Profile settings** — make the Settings page real: edit name/email, change password
- **Richer analytics** — applications over time, response/interview conversion rates, time-in-stage
- **Data import** — CSV import to migrate from spreadsheets (the mirror of the existing export)
- **Server-side pagination** — for lists once they outgrow client-side filtering

## 💡 Future ideas — unscheduled

- Email integration (create applications by forwarding confirmation emails)
- Browser extension to capture a job posting into the tracker in one click
- Reminder notifications (email or push) instead of dashboard-only
- Companies directory (notes/contacts per company across applications)
- Dark mode

Have an idea that isn't listed? [Open a feature request](https://github.com/matin360/Project/issues/new?template=feature_request.yml).
