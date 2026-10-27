# Data-safe deployment

The Vite/React Router migration does not move, rename, or transform MongoDB
records. The Vercel API uses the existing `users`, `sessions`, `companies`,
`invoices`, `quotes`, and `inventory` collections, including their existing
`userId` ownership fields and `horizon_session` cookie. No invoice or quote
collection is cleared as part of deployment.

## Before deploying

1. In the current Vercel project, identify the active `DATABASE_URL` and
   `DATABASE_NAME` environment-variable values without copying their secret
   contents into source control, chat, or logs.
2. Configure the same values for the production environment of the new Vite
   deployment. If `DATABASE_NAME` is unset today, leave it unset on the new
   deployment too so the existing connection-string/default database
   selection stays the same.
3. Create or verify a recent MongoDB Atlas snapshot/backup before the first
   deployment. Keep the backup independent of the application deployment.
4. Confirm the Vercel project has MongoDB network access and that the
   production variables—not only Preview or Development variables—are set.

## After deploying

1. Sign in with an existing account. Existing users and sessions are stored
   in MongoDB; a login may be needed again if the browser does not have the
   existing `horizon_session` cookie.
2. Verify that existing invoices, quotes, inventory, and company settings are
   visible before creating or editing production records.
3. If existing data appears missing, stop writes and check the Vercel
   production `DATABASE_URL`/`DATABASE_NAME` against the previous deployment.
   Do not point the app at a newly created empty database or restore over the
   source database as a first troubleshooting step.

This migration needs no `mongorestore` or schema migration when the same
MongoDB database remains in use. Backups are still recommended before any
production deployment.

## Password reset email

The forgot-password flow uses Resend to deliver one-use password reset links.
Before enabling it in Vercel, add these environment variables to the production
environment (and Preview if password reset should work on previews):

- `APP_URL`: the public HTTPS origin of the app, for example
  `https://invoices.example.com` (no path, query, or trailing route).
- `RESEND_API_KEY`: a Resend API key stored only as a Vercel environment
  variable.
- `EMAIL_FROM`: a sender address on a domain verified in Resend, for example
  `Horizon Invoices <invoices@example.com>`.

Redeploy after configuring the variables. Reset tokens are random, stored only
as SHA-256 hashes, expire after 30 minutes, and are consumed once. Requests are
throttled per email address, and successful password resets revoke the user's
existing sessions. The request response does not disclose whether the address
has an account. Check Vercel function logs for delivery/configuration failures.
