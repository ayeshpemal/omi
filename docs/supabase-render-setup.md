# Supabase + Render Deployment Guide

This guide walks you through setting up the OMI card game on **Render** with **Supabase** as the database (both free tier).

## Prerequisites

- GitHub account (repo already pushed)
- Supabase account (free)
- Render account (free)

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Fill in:
   - **Name**: `omi` (or your choice)
   - **Database Password**: Generate a strong password and save it securely.
   - **Region**: Choose closest to you (e.g., us-east-1).
   - **Plan**: Free
4. Click **Create new project** and wait for setup (~2 min).

## Step 2: Get Supabase Connection String

1. In Supabase dashboard, go to **Settings → Database → Connection string**.
2. Select **URI** (not Connection pooler).
3. Copy the full connection string:
   ```
   postgresql://postgres:<PASSWORD>@<HOST>:<PORT>/<DATABASE>
   ```
   Replace `<PASSWORD>` with the password you created above.
4. Optionally append `?sslmode=require` if you see SSL errors:
   ```
   postgresql://postgres:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?sslmode=require
   ```

## Step 3: Create a Render Web Service

1. Go to [render.com](https://render.com) and sign in.
2. Click **New** → **Web Service**.
3. Choose **Deploy an existing Git repository** → Select your OMI repo.
4. Fill in:
   - **Name**: `omi-web`
   - **Environment**: `Node`
   - **Build Command**: `npm ci --include=dev && npm run migrate && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. **Do not click Create yet** — scroll down to **Environment**.

## Step 4: Add Environment Variables in Render

In the **Environment** section of the new service:

1. Click **Add Environment Variable**:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste your Supabase connection string from Step 2.

2. Click **Add Environment Variable** again:
   - **Key**: `SESSION_SECRET`
   - **Value**: Generate a long random string (e.g., `openssl rand -base64 32` or use an online generator). This encrypts session cookies.

3. Click **Add Environment Variable** again:
   - **Key**: `NODE_ENV`
   - **Value**: `production`

4. Click **Create Web Service**.

Render will now:

- Clone your repo
- Run `npm ci --include=dev` (install all dependencies including dev)
- Run `npm run migrate` (execute drizzle-kit push to set up your DB schema)
- Run `npm run build` (build the app)
- Start the app with `npm start`

## Step 5: Monitor Deployment

1. In Render dashboard, go to your service and watch the **Logs** tab.
2. You should see:

   ```
   > npm run migrate
   > drizzle-kit push
   [migrations running...]

   > npm run build
   [build output...]

   > npm start
   serving on port 10000  (or similar)
   ```

3. Once complete, click the URL at the top to visit your live app.

## Step 6: Manual Migration (if needed)

If the build step fails or you need to re-run migrations:

1. In Render dashboard, go to your service → **Shell**.
2. Run:
   ```bash
   npm ci --include=dev
   npm run migrate
   ```

## Troubleshooting

### Build fails: "DATABASE_URL is required"

- **Cause**: Environment variable not set before build.
- **Fix**: Verify DATABASE_URL is set in Render → Environment, then redeploy (go to **Deploys** tab, click the three dots, select **Redeploy**).

### Connection timeout to Supabase

- **Cause**: SSL/network issue.
- **Fix**: Append `?sslmode=require` to your DATABASE_URL in Render env.

### Migrations not running

- **Cause**: drizzle-kit is a devDependency, so `--include=dev` must be in buildCommand.
- **Fix**: Ensure buildCommand is: `npm ci --include=dev && npm run migrate && npm run build`

### App starts but no schema

- **Cause**: Migrations didn't run or failed silently.
- **Fix**: Go to **Shell** and run `npm run migrate` manually, check output for errors.

## Next Steps

- Monitor your app in Render Logs.
- Use Supabase dashboard to browse your database tables.
- Scale or adjust the Render plan if needed.
- Set up auto-deploy on GitHub push (enabled by default in `render.yaml`).

## Security Notes

- **Never commit DATABASE_URL or SESSION_SECRET to your repo.**
- Use Render's environment variables (encrypted at rest).
- If you need to rotate credentials, update them in Render and redeploy.
- For Supabase, you can reset your database password in Settings.
