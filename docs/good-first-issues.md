# Good first issues — ready to create

Ready-to-paste drafts for the GitHub issue tracker. Each is small, low-risk, and verifiable.
Create them via **New issue → 🌱 Good first issue** (they'll get the `good first issue` label
automatically) — or `gh issue create --label "good first issue" --title "…" --body "…"`.

All of them end the same way: `npm run ci` passes, plus the listed test.

---

## 1. Show priority in the applications list

**Labels:** `good first issue`, `enhancement` · **Kind:** Frontend

**Task:** The applications table (`apps/client/src/pages/ApplicationsPage.tsx`) shows company,
role, status, and dates — but not priority, even though every application has one and a
`PriorityBadge` component already exists (`apps/client/src/components/applications/PriorityBadge.tsx`,
currently used only on the detail page).

Add a sortable **Priority** column rendering `PriorityBadge` (em dash when unset), between
Status and Applied on. Extend `compareValues` so sorting orders low → medium → high rather
than alphabetically.

**Expected outcome:** Priority column with badges, sortable in a sensible order; a unit test
in `apps/client/test/applications.test.tsx` covers rendering + sort order.

---

## 2. Set the browser tab title per page

**Labels:** `good first issue`, `enhancement` · **Kind:** Frontend

**Task:** Every page shows the same tab title ("Job Application Tracker" from
`apps/client/index.html`). Add a tiny `useDocumentTitle(title)` hook
(`apps/client/src/hooks/`) that sets `document.title` to e.g. "Dashboard · Job Application
Tracker" and restores nothing on unmount (last-write-wins is fine). Use it in the five pages
(`Dashboard`, `Applications`, `NewApplication`, `ApplicationDetail` — role title once loaded —
and `Settings`).

**Expected outcome:** Distinct tab titles per route; a unit test asserts `document.title`
after rendering a page.

---

## 3. Applications empty state should link to the create form

**Labels:** `good first issue`, `enhancement` · **Kind:** Frontend

**Task:** With zero applications, the list shows the plain text "No applications yet. Create
your first one!" (`ApplicationsPage.tsx` → `Table`'s `emptyMessage`, which only accepts a
string). Let `emptyMessage` accept a `ReactNode` (`apps/client/src/components/ui/Table.tsx`)
and make "Create your first one" a `<Link to="/applications/new">`, matching the dashboard's
empty state.

**Expected outcome:** The empty-state text contains a working link; the e2e assertion in
`e2e/navigation.spec.ts` (which matches this text) still passes; a unit test checks the link's
href.

---

## 4. Add the missing unit test for deleting a reminder

**Labels:** `good first issue`, `tests` · **Kind:** Tests

**Task:** `apps/client/test/detail-sections.test.tsx` covers add/complete/edit for
`RemindersSection`, and delete for notes and interviews — but not reminder deletion. Add a
test mirroring the "deletes a note" pattern: mock `deleteReminder` (already in the module
mock), click the reminder's Delete button, assert `deleteReminder` was called with the id and
`onChange` was called with an empty list.

**Expected outcome:** One new passing test in `detail-sections.test.tsx`; `npm test
--workspace apps/client` stays green.
