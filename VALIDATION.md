# Validation — 2026-10-15

Passed:

- 5 automated pricing tests (`node --test --test-isolation=none server/test/pricing.test.js`), including early bird, package duplication, date/capacity rejection, membership/lucky eligibility, and weekend boundary.
- `node --check server/src/index.js`
- `node --check server/src/db.js`
- `docker compose --env-file .env.example config --quiet`

Blocked by environment:

- npm dependencies could not be downloaded: initial offline cache miss, followed by network refusal at the configured proxy (127.0.0.1:9). No dependency lockfile was generated; Docker uses npm install. Generate and commit a lockfile on a networked machine, then switch Dockerfile install commands to npm ci for repeatable builds.
- `npm run build` could not execute Vite because dependencies are unavailable. React compilation and browser visual QA remain unverified.
- Docker CLI is installed, but Docker Desktop Linux Engine is not running. MySQL startup, API integration, transaction concurrency, session flow, and end-to-end UI remain unverified.

On an unrestricted development machine:

1. Start Docker Desktop.
2. Copy `.env.example` to `.env` and set passwords.
3. Run `npm install`, `npm test`, `npm run build`.
4. Run `docker compose up --build -d` and check `/api/health`.
5. Log in as customer, search, quote and book a room. Submit another reservation for the same room and dates; verify rejection.
6. Simulate deposit once; verify repeat attempts fail. Log in as receptionist and test check-in on the arrival date, then receive balance and check out. Verify room becomes Cleaning, then change to Vacant.
7. Check admin edits and account role restrictions; verify accounting report/CSV and access denial to customer accounts.
8. Restart containers without deleting volumes and verify records persist.

The source is implemented but has not been certified as a fully running migration in this restricted environment.