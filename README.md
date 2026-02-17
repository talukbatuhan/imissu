# Image Note App

A Next.js application to view images and add persistent notes.

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Database Setup**:
   This app uses Vercel Postgres.
   - Creating a Vercel Project and adding a Postgres store will provide the environment variables.
   - Copy `.env.example` to `.env.local` and add your `POSTGRES_URL`.

3. **Database Migration**:
   To push the schema to your database:
   ```bash
   npm run db:push
   ```

4. **Images**:
   Place your images in `public/images/`.
   The app automatically detects images during build or dev server start.
   To manually update the image index:
   ```bash
   node scripts/generate-manifest.js
   ```

5. **Run Locally**:
   ```bash
   npm run dev
   ```

## Deployment

Deploy to Vercel:
1. Push to GitHub.
2. Import project in Vercel.
3. Add Vercel Postgres integration.
4. Deploy.
