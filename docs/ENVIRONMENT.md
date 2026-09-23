# Environment Variables Reference — JeevanCare v1.0.0

This document lists all environment variables used across the JeevanCare platform.

---

## 1. Client-Side Variables (Vite Exposed)

Variables prefixed with `VITE_` are bundled into the client build and accessible in the browser.

| Variable Name | Purpose | Required? | Scope | Example Placeholder |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase project API gateway URL | **Yes** | Client | `https://xyzproject.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous API key for Supabase Auth and DB queries | **Yes** | Client | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key for Nearby Healthcare locator | Optional | Client | `AIzaSyD...` |

---

## 2. Server-Side Variables (Secrets)

Variables without the `VITE_` prefix are kept strictly server-side and are never bundled into the client browser application.

| Variable Name | Purpose | Required? | Scope | Example Placeholder |
| :--- | :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API key for server-side AI processing | **Yes** | Server | `AIzaSyB...` |

---

## 3. Environment Security Rules

1. Never commit `.env` or `.env.local` files to version control.
2. Only declare variable names in `.env.example`.
3. Never expose the Supabase `service_role` key to the frontend client.
