# MediPath Deployment Guide

## Recommended Path: Vercel + GitHub

This project is a Vite single-page app and is ready to deploy on Vercel.

Current project settings:

- Framework: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- SPA routing: handled by `vercel.json`

## Before You Deploy

1. Install dependencies locally:
   ```bash
   npm install
   ```

2. Test the production build:
   ```bash
   npm run build
   ```

3. Make sure Firebase is configured.

This app reads Firebase config from Vite environment variables first, with the current values used as fallback. For production, set the variables in Vercel so deployment is explicit and easy to maintain.

## Required Environment Variables

Add these in Vercel under Project Settings -> Environment Variables:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-your_measurement_id
```

For local development, copy `.env.example` to `.env` and fill in the same values.

## Option 1: Deploy from GitHub

This is the best option if you want automatic redeploys after every push.

1. Push this repo to GitHub.
2. Open https://vercel.com/new
3. Import your GitHub repository.
4. In the Vercel setup screen, confirm:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add the Firebase environment variables.
6. Click `Deploy`.

After the first deployment, every push to your selected branch will trigger a new deployment automatically.

## Option 2: Deploy with Vercel CLI

1. Install the CLI:
   ```bash
   npm install -g vercel
   ```

2. Run deployment from the project root:
   ```bash
   cd d:\medipath
   vercel
   ```

3. Answer the prompts:
   - Set up and deploy: `Y`
   - Link to existing project: choose as needed
   - Project name: your choice

4. For production deployment:
   ```bash
   vercel --prod
   ```

5. Add environment variables if Vercel asks, or add them later in the dashboard.

## Why Routing Works on Refresh

This repository already includes [`vercel.json`](/d:/medipath/vercel.json), which rewrites all routes to `index.html`. That is required because this app uses React Router in the browser.

## Quick Checklist

- `npm install` completed
- `npm run build` passes
- Firebase environment variables added in Vercel
- Firebase Authentication allowed domains updated
- Firestore rules allow your deployed app to access the data it needs

## Important Firebase Step

If you use Firebase Authentication, add your deployed Vercel domain in Firebase Console:

1. Go to Firebase Console
2. Open Authentication
3. Open Settings or Authorized Domains
4. Add:
   - `your-project.vercel.app`
   - Your custom domain, if you use one

If you skip this, Google sign-in or other auth flows may fail in production.

## Troubleshooting

Build fails on Vercel:
- Check that `npm run build` works locally first.
- Confirm all `VITE_...` environment variables are present in Vercel.

App loads but refresh on inner routes shows 404:
- Confirm [`vercel.json`](/d:/medipath/vercel.json) is present in the repo root.

Firebase auth works locally but not on Vercel:
- Add the Vercel domain to Firebase Authorized Domains.

Firestore requests fail in production:
- Review your Firestore security rules and make sure the production domain and authenticated users are allowed.

## Custom Domain

To use your own domain:

1. Open your Vercel project
2. Go to Settings -> Domains
3. Add the custom domain
4. Update DNS records as Vercel instructs
5. Add the custom domain to Firebase Authorized Domains too

## Useful Commands

```bash
npm run dev
npm run build
npm run preview
```
