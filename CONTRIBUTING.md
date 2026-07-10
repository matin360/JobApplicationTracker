# Contributing to Job Application Tracker

Thanks for your interest in contributing! This project is a friendly place to make your first open-source contribution — or your hundredth. All kinds of contributions are welcome:

- 🐛 **Bug reports and fixes**
- ✨ **Features** (check the [roadmap](ROADMAP.md) first so we're pulling in the same direction)
- 🧪 **Tests** — extra coverage is always appreciated
- 📖 **Docs** — clarifications, fixes, examples
- 🎨 **Design** — UI/UX suggestions and accessibility improvements

## Reporting issues

Open a [GitHub issue](https://github.com/matin360/Project/issues) using the matching template:

- **Bug report** — what happened, steps to reproduce, expected vs. actual behavior, and your environment.
- **Feature request** — the problem you're trying to solve, why it matters, and (optionally) a suggested approach.

Security problems (auth bypass, data leaking between users, etc.): please don't open a public issue — email the maintainer instead.

## Getting set up

Follow the [Getting started](README.md#getting-started) section of the README — `./scripts/setup.sh` does nearly everything. You'll need Node 22 and Docker (for Postgres).

Before opening a PR, this must pass locally (Postgres running):

```bash
npm run ci        # lint → typecheck → client tests → server tests → build
npm run test:e2e  # Playwright suite (stop docker client/server containers first)
```

## Submitting a pull request

1. **Fork** the repo and create a branch from `main` (`fix/reminder-overdue-badge`, `feat/resume-versions`, …).
2. **Keep PRs focused** — one fix or feature per PR. Small PRs get reviewed faster.
3. **Add or update tests** with your change: client tests in `apps/client/test/`, server tests in `apps/server/test/`, user-visible flows in `e2e/`.
4. **Run `npm run ci` and the e2e suite** and make sure both are green.
5. Open the PR with a short description of *what* changed and *why*. Screenshots are great for UI changes.

### Review process

The maintainer reviews PRs on a best-effort basis — usually within a week. Expect a round or two of feedback for anything non-trivial; that's normal and welcome. Once approved, the maintainer merges (squash merge, imperative commit subject).

## Coding standards

Most conventions are enforced by tooling — if `npm run ci` passes, you're most of the way there.

- **TypeScript everywhere**, strict mode; avoid `any` and type-assertion workarounds.
- **Match the surrounding style.** Prefer editing existing files and reusing existing patterns:
  - Client API calls live in `apps/client/src/api/` and go through the shared `requestJson` helper.
  - Data fetching uses the `useAsync`/`useApplication` hooks; user-triggered mutations use `useBusyAction`.
  - New UI uses the components in `src/components/ui/` and CSS classes in `src/styles.css` — no inline styles.
  - Keep React components and plain functions in separate files (the react-refresh lint rule enforces this).
  - Server handlers validate input with the helpers in `src/validation.ts`, use the shared `prisma` client, and are wrapped in `asyncHandler` at registration.
- **Tests use the shared helpers/factories** (`apps/server/test/helpers.ts`, `apps/client/test/factories.ts`, `e2e/helpers.ts`) and `vi.mocked()` for mocks.
- **Every route that touches user data must enforce ownership** (404 for non-owners) — and a test should prove it.

## Behavior expectations

Be kind and assume good intent. Give feedback about code, not people; receive it as help, not criticism. No harassment or gatekeeping — newcomers' questions are welcome here. The maintainer may edit or remove content and block contributors who don't respect this.

---

Not sure where to start? Pick something from [docs/good-first-issues.md](docs/good-first-issues.md) or open an issue and say hi.
