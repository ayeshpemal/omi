# Render Deployment

This project is configured for deployment on Render as a **Web Service**.

## What Render Uses

- **Build command**: `npm ci && npm run build`
- **Start command**: `npm start`
- **Runtime**: Node
- **Plan**: Free

## Files That Control Deployment

- `render.yaml`: Render blueprint for the web service.
- `package.json`: Build and start scripts.
- `server/index.ts`: Express server entrypoint that listens on `process.env.PORT`.

## Setup Steps

1. Connect the GitHub repository to Render.
2. Choose **Blueprint** deployment or create a **Web Service** manually.
3. Use the settings above if deploying manually.
4. Set any required environment variables in Render.

## Notes

- The app is designed to run as a long-lived Node server, so **Static Site** is not the right Render service type.
- AWS-specific EC2, NGINX, and PM2 deployment helpers have been removed from this repository.
