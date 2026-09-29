# Northstar Workplace

A local apprenticeship simulator built with TypeScript, React, Next.js, Tailwind, Prisma, and SQLite. Work inside one persistent company across 30 playable systems. No account, paid service, or API key is required.

## Run

Use Node.js 24.15 or newer (Node.js 22.22.2 is also supported):

```sh
npm install
npm run db:init
npm run dev
```

Open **http://127.0.0.1:3000**. The database initializer creates and seeds the company without overwriting existing work. On this workspace’s Windows runtime, a local npm launcher is also included: `.\npm.cmd run dev`.

Production:

```sh
npm run build
npm start
```

## Working in the simulator

Choose any skill from the dashboard and begin an assignment. Select a difficulty or let your apprenticeship level choose it. Enter a seed to reproduce the records. Each assignment includes its objectives, source records, policies, controls, and review criteria.

Each system opens its own workplace interface and saves each operation. Answer and transfer calls in the call console, match invoices against purchase orders at the finance desk, reconcile debits and credits in the ledger, move appointments in the calendar, and receive or transfer physical units in stock control. Complete work using the tool's own operations to receive a specific manager review. Accepted work changes company records and creates follow-up tasks. Saved spreadsheet, document, report, and presentation artifacts can be attached to inbox messages.

The clock advances as you work. The play control advances one simulated minute every five seconds; manual controls advance longer blocks. Calls, manager requests, and replies arrive at their scheduled times. Full Workday creates a generated queue with deadlines and interruptions; complete the linked assignments and submit your handover at 17:00. Start the next day from the dashboard after the shift ends. The manager, staff, stock, customers, projects, balances, and progress persist.

### Work tools

- Inbox: compose, reply, forward, search, read, archive, organize, attach saved artifacts, and create tasks.
- Phone and meetings: staged conversations, identity checks, notes, dispositions, agenda decisions, and follow-up actions.
- Calendar: create, edit, move, cancel, and reschedule appointments with overlap detection.
- Spreadsheet: editable rows and columns, formulas, cell references, arithmetic, percentages, SUM, AVERAGE, MIN, MAX, sorting, filtering, and CSV export. Formula evaluation never executes JavaScript.
- Documents and reports: editable content, live page preview, saved records, attachments, and text export.
- Presentations: slide titles, content, data charts, notes, presentation view, audience response, and export.
- Research and policies: searchable internal evidence, source inspection, citations, and company procedure records.
- Tasks, projects, customers, vendors, inventory, HR, finance, and accounting: persistent records integrated with assignment actions and results.
- Performance: twelve skill measures and six progression levels.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run audit:features
npm run build
npm run test:e2e
```

The test suite generates **300 distinct seeds for each of 30 categories: 9,000 scenarios**. Domain tests complete work using each tool's actual operations, including phone hold/resume/transfer, cell formulas, conflicting appointments, conserved stock quantities, blocked project dependencies, and invoice holds. A full-workday test completes the generated child assignments and manager handover. Database tests verify save/load and optimistic concurrency.

The feature audit renders every assignment interface, completes all 30 workflows through SQLite transactions, checks evaluators before and after work, and verifies saved outcomes. It writes `audit/feature-registry.json` with the operations exercised and fails on missing capabilities. Anti-clone checks verify distinct component registrations, controllers, interaction types, state-machine types, evaluators, and action sets. The production build runs this audit first.

Browser tests use an isolated SQLite database. They operate and reload all 30 tools, visit every desktop application, and capture each tool after interacting with its specific controls. Screenshots and the machine-readable browser report are written to `audit/`. Windows tests use installed Microsoft Edge; elsewhere install the browser with `npx playwright install chromium` before running them.

## Repository

- `src/app`: Next.js application, application routes, simulation routes, and local API.
- `src/components`: workstation UI, workbenches, and persistent client command queue.
- `src/features`: spreadsheet parser and working editors.
- `src/minigames/catalog.ts`: thirty system definitions and progression levels.
- `src/minigames/<category>/controller.ts`: that tool's state transitions, constraints, and evaluation checks.
- `src/minigames/<category>/workspace.tsx`: that tool's purpose-built interaction surface.
- `src/minigames/manifest.ts`: interaction, scenario-family, and capability registry.
- `src/minigames/runtime`: dispatch, data seeding, and shared persistence/scoring utilities.
- `src/simulation/generators`: seeded company and scenario generation.
- `src/simulation/engine`: commands, consequences, time, events, and cross-system workflows.
- `src/simulation/evaluation`: deterministic work review and skill feedback.
- `src/database`: Prisma client, transactional save/load, and seed entry point.
- `src/tests`: generation, domain, persistence, and browser tests.
- `prisma/schema.prisma`: workplace aggregate and related action log.

SQLite lives at `prisma/workcraft.db`. Back up that file while the server is stopped to retain your workplace. The company is a versioned aggregate stored atomically with a relational action log; concurrent tabs use revision checks to prevent overwriting each other. This is a single-user local application bound to the loopback interface.

For PostgreSQL, change the Prisma datasource provider to `postgresql`, set `DATABASE_URL` to the database connection string, run `npx prisma generate`, and initialize the schema. The model uses portable scalar fields and relations.
