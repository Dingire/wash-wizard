# Railway Deployment Guide

This repo can deploy the API server and Postgres database on Railway.

## What to deploy on Railway

- `artifacts/api-server` as a Node web service
- Railway PostgreSQL plugin for the database

The staff app (`artifacts/carwash-staff`) can still run locally in Expo.
The admin app (`artifacts/carwash-admin`) can be deployed separately as a static site.

## Code changes already made

- `artifacts/carwash-admin/src/main.tsx` now reads `import.meta.env.VITE_API_BASE_URL` and falls back to `http://localhost:5000` in local dev.
- `artifacts/carwash-staff/app/_layout.tsx` now supports `process.env.API_BASE_URL` and still falls back to local dev URLs.

## Railway service setup

1. Create a new Railway project.
2. Add the PostgreSQL plugin.
3. Add a new Node service.
4. Set the service root to `artifacts/api-server` if prompted.

## Environment variables

Configure these Railway environment variables for the API service:

- `PORT=5000`
- `DATABASE_URL=<Railway Postgres URL>`
- `PGSSLMODE=require` (if required by Railway Postgres)
- `ZEDBITE_SMS_UID=COO0DO85LV`
- `ZEDBITE_SMS_API_KEY=b53e50d3a7a72fbc403c974ccaf0c1caae507fa544943170712bc49a81718a19`
- `ZEDBITE_SMS_SENDER_ID=U & ME Car Detailers`

Never put SMS credentials in frontend environment variables or commit them to the repository. They belong only on the API service.

## Build and start commands

Use these commands for the API service:

- Build command:
  ```bash
  corepack pnpm install
  cd artifacts/api-server
  corepack pnpm run build
  ```
- Start command:
  ```bash
  cd artifacts/api-server
  corepack pnpm run start
  ```

## Admin frontend deployment

If you want to deploy the admin UI as a static site, set this environment variable for the deployment build:

- `VITE_API_BASE_URL=https://<your-railway-api-host>`

Then build the admin app normally.

## Local Expo/mobile development

For the staff app in local Expo, use this environment variable when you want it to call the Railway-hosted API:

- `API_BASE_URL=https://<your-railway-api-host>`

If you are using Expo deployment pipelines, you can also reuse `EXPO_PUBLIC_DOMAIN`.

## Verify the remote API is working

After deployment, test the endpoint:

```bash
curl https://<your-railway-api-host>/api/services
```

If it responds with JSON, the backend is wired correctly.

## Notes

- Railway manages the database and backend process remotely, so your local machine does not need to run the DB or API.
- The mobile app still needs a running Expo session for local development.
- If you want to deploy the staff app later, you can instruct it to use the same Railway API URL.
