# FertaFind

FertaFind compares fertilizer quotes using crop, location, weather, irrigation, soil-test and supplier context.

## Deploy with Vercel

This is a TanStack Start server application. GitHub Pages cannot run its API routes. Import this repository into Vercel instead.

1. In Vercel, choose **Add New → Project** and import this GitHub repository.
2. Keep the repository root as the Root Directory.
3. Use `pnpm build` as the Build Command. Leave Output Directory blank.
4. Add the following Environment Variables for Production, Preview and Development:

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_RECAPTCHA_SITE_KEY`
   - `OPENAI_API_KEY`
   - `OPENAI_QUOTE_MODEL`
   - `RECAPTCHA_SECRET_KEY`
   - `RECAPTCHA_HOSTNAME`

5. Deploy, then add the Vercel hostname to the allowed domains for Google reCAPTCHA and your Supabase authentication redirect URLs.

Never commit `.env`; use `.env.example` only as a list of required variable names.

## Local development

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Add your own environment-variable values to `.env` before testing authentication or quote analysis.
