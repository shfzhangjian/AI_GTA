# Verification record

## Windows local verification — 2026-10-02

- Node.js 24.16.0; locked dependencies installed with `npm ci`.
- TypeScript `tsc --noEmit` and production Vinext/Cloudflare build passed.
- Both local D1 SQL migrations applied successfully; Wrangler served the built application at `http://127.0.0.1:8787/`.
- Homepage and assets returned HTTP 200; the in-app browser opened the Chinese interface and entered the built-in demo level.
- Local room create, state synchronization, and leave requests returned HTTP 200.
- `../preview.jpg` is an actual browser screenshot of the running demo. Other evidence below retains its original verification scope.

## Passed

- TypeScript `tsc --noEmit`
- Production Vinext/Cloudflare build
- Private Sites publication, terminal `succeeded` status
- Two independent HTTP client sessions against the local full-stack Worker: create room, join, hidden session-token privacy, host-only start, round start, destruction event replication, health damage, kill/respawn, first-to-10 match completion, rematch/new map, leave/rejoin and host transfer
- URL rejection: localhost/IP addresses, metadata IP, embedded credentials, query parameters
- Direct screenshot-provider request for public `https://example.com/`: HTTP 200, valid 1200×1200 PNG
- Pure Canvas engine simulation: each of ten weapon paths, grenade damage, run, jump, held flight and air flip. This is a unit-level renderer test, not a browser UI acceptance test

## Blocked / not yet verified

- Browser play and responsive UI acceptance: cloud browser rejects loopback previews; the deployed private Site correctly presents a ChatGPT sign-in gate. A normal secure login is pending. No bypass token was generated and sharing was not changed
- Deployed screenshot capture + R2 path: still needs authenticated runtime test. Local Worker emulation cannot resolve the provider's DNS; the provider itself worked via a direct network request
- Real browser-to-browser remote multiplayer: API state tests passed, but two browser sessions remain untested
- Audible sound output, mobile touch behavior, WebMCP registration and browser clipboard controls: still need browser tests

## Local D1 setup

Apply migrations once, in order:

`node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_handy_deathbird.sql`

Then repeat for `drizzle/0001_colossal_marvel_apes.sql`. For restricted environments, direct Wrangler's configuration and log paths to writable project-local directories.

## Evidence

Original reference screenshots and separate unit-engine renders are retained in the task's research/QA output. Unit-engine renders must not be labeled as browser screenshots or proof of the full React interface.
