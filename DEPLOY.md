# PI Dashboard Deploy Guide

## 1. Supabase

1. Create a Supabase project.
2. Open the SQL editor and run [`supabase-schema.sql`](/Users/1112949/Documents/New%20project/PI-dashboard/supabase-schema.sql).
3. Copy `config.example.js` to `config.js`.
4. Fill in:
   - `supabaseUrl`
   - `supabaseAnonKey`

## 2. GitHub Pages

1. Push this project to a GitHub repository.
2. Keep the app files inside `PI-dashboard/`.
3. Use the GitHub Actions workflow at [`.github/workflows/deploy-pages.yml`](/Users/1112949/Documents/New%20project/.github/workflows/deploy-pages.yml).
4. In GitHub:
   - `Settings > Pages`
   - Source: `GitHub Actions`

## 3. Shared Data

- The app now syncs these documents to Supabase:
  - PI store
  - course list
  - org targets
  - org target metadata
  - user directory
  - About mySUNI PI content

- Login session itself remains browser-local, but the underlying shared data is loaded from the cloud on every device.

## 4. Important Note

- The included Supabase policy is convenient for an internal demo, but it allows anonymous read/write with the anon key.
- For production, replace it with stronger authentication or a protected backend layer.
