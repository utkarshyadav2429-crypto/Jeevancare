# Deployment Guide — JeevanCare v1.0.0

## 1. Hosting Architecture

JeevanCare is designed for containerized deployment on **Google Cloud Run** or any Node.js container hosting environment.

- **Port Binding**: Must bind to host `0.0.0.0` and port `3000`.
- **Runtime**: Node.js 20+ (ES Module / CommonJS bundled runtime).
- **Edge Proxy**: Reverse proxy with TLS 1.3 termination.

---

## 2. Build Pipeline

The production build pipeline compiles the React SPA via Vite and bundles the Express backend server into a single self-contained CommonJS binary using `esbuild`.

```bash
# Clean previous build outputs
npm run clean

# Run production compilation
npm run build
```

The build produces:
- `dist/`: Static client assets (HTML, CSS, JS chunks, images).
- `dist/server.cjs`: Bundled backend server with external npm dependencies.

---

## 3. Production Start Command

```bash
# Launch production server
npm run start
```

The Express server in `dist/server.cjs` serves the `dist/` directory as static assets and routes all non-API wildcard paths (`*`) to `dist/index.html` to support deep-linked SPA navigation without hosting-level 404 errors.

---

## 4. Required Environment Configuration

Before deploying, ensure the following environment variables are set in the hosting platform's secrets manager:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://<your-supabase-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>

# Google Services
VITE_GOOGLE_MAPS_API_KEY=<your-maps-api-key>
GEMINI_API_KEY=<your-gemini-server-key>
```

---

## 5. Rollback Strategy

On Google Cloud Run:
1. Navigate to the Google Cloud Run console.
2. Select the `jeevancare` service.
3. Open the **Revisions** tab.
4. Select the last known stable revision.
5. Click **Manage Traffic** and route 100% of traffic to that revision.
