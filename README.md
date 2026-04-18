# StockScript Journal

Authenticated trading journal with trader accounts, admin approval, manual-price journals, image uploads, competitions, and a percentage-only leaderboard.

## What changed

- Each trader now owns a personal account with email ID and password
- Registration creates a trader account in pending state
- Email verification is required before admin approval
- Admin approval is required before a trader can enter trades
- One seeded admin account is available for validation workflows
- Trades can be `OPEN` without exit price or exit time
- `closing price` is now the manual end-of-day engine price for journal mark-to-market
- The journal screen follows a denser gold-header layout inspired by the supplied reference
- Leaderboard ranking remains percentage-only and uses closed trades only

## Local setup

1. Install dependencies

```bash
npm install
```

2. Initialize the SQLite database

```bash
npm run db:init
```

3. Seed demo accounts, trades, and competition data

```bash
npm run db:seed
```

4. Start the app

```bash
npm run dev
```

## Seeded credentials

- Admin:
  - Email: `admin@stockscript.dev`
  - Password: `Admin@12345`
- Approved traders:
  - `aarav@stockscript.dev`
  - `mira@stockscript.dev`
  - `kabir@stockscript.dev`
  - Password for all seeded traders: `Trader@123`
- One additional trader is seeded in pending approval state:
  - `riya@stockscript.dev`
  - Password: `Trader@123`

## Pricing rules

- Closed trades use `exit_price` for realized P&L
- Open trades do not contribute realized P&L
- `closing_price` is the manual end-of-day journal price
- Open-trade mark-to-market uses `closing_price`
- Leaderboard uses only closed trades inside competition dates

## Leaderboard formula

- Portfolio Return % = `(Total Net Realized P&L / Max Capital Deployed) * 100`
- Sort order:
  - Highest return %
  - Lowest drawdown
  - Highest win rate

## Storage

- SQLite for local data
- Local upload fallback in `public/uploads`
- Optional S3-compatible upload support via `.env`
