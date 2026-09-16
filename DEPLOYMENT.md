# Occassia production deployment

The recommended hosting arrangement is:

- **Frontend:** Vercel using the `frontend` directory.
- **Backend:** Render, Railway, Fly.io, or another Docker host using `backend/Dockerfile`.
- **Database:** Managed PostgreSQL supplied by the backend host.

### Render Free-tier availability

The API exposes a lightweight `GET /health` endpoint and Render uses it for health checks. This improves deploy/restart detection and avoids loading Swagger for every health probe. It does not remove Render Free-tier suspension: Free web services sleep after 15 minutes without inbound traffic and can take about a minute to wake. Free Postgres can also restart, has no backups or managed connection pooling, and expires after 30 days. For an always-responsive production API, upgrade both the web service and database to paid plans. If you remain on Free, an external monitor can request `/health` every 5–10 minutes as a warm-up mitigation, but that is not a reliability guarantee.

An optional GitHub Actions workflow is included at `.github/workflows/render-warmup.yml`. Add a repository secret named `RENDER_HEALTH_URL` containing the full `/health` URL to run a scheduled warm-up every 10 minutes. Scheduled workflows may be delayed and cannot prevent Render maintenance, database restarts, or Free Postgres expiry.

Spring Boot is not a good fit for a Vercel serverless function without a separate adaptation. Keep the Java API on a long-running container service.

## Before deploying

1. Push the project to a Git provider.
2. Create a production PostgreSQL database or use the database created by the backend host.
3. Create a strong random `JWT_SECRET` of at least 32 characters.
4. Confirm that the database accepts SSL if required by the provider. Add `?sslmode=require` to `SPRING_DATASOURCE_URL` when the provider requires it.
5. Do not use the development database password or development JWT secret in production.

## Deploy the backend on Render

This repository includes [`render.yaml`](./render.yaml).

1. In Render, choose **New > Blueprint** and select the repository.
2. Confirm the `occassia-api` web service and `occassia-db` PostgreSQL database.
3. When prompted for `SPRING_DATASOURCE_URL`, enter the database's internal JDBC URL, for example `jdbc:postgresql://HOST:5432/occassia`. Render's copied connection string may need the `jdbc:` prefix added.
4. When prompted for `CORS_ALLOWED_ORIGINS`, enter the final Vercel origin, for example `https://occassia.vercel.app`. For multiple frontend origins, separate them with commas.
5. Deploy and wait for the service health check to pass.
6. Copy the backend URL, for example `https://occassia-api.onrender.com`.
7. Verify `https://your-backend-host/health` returns `{"status":"ok","service":"occassia-api"}` before deploying the frontend.

Required backend environment variables:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://...
SPRING_DATASOURCE_USERNAME=...
SPRING_DATASOURCE_PASSWORD=...
JWT_SECRET=<strong-random-secret>
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

Fly.io and Railway can use the same `backend/Dockerfile`; set the same environment variables and expose port `8080`.

## Deploy the frontend on Vercel

1. In Vercel, choose **Add New > Project** and select the repository.
2. Set **Root Directory** to `frontend`.
3. Keep the framework preset as **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add these production environment variables:

```text
VITE_API_URL=https://your-backend-host/api/v1
VITE_WS_URL=https://your-backend-host/ws
```

7. Deploy the frontend.
8. Copy the final Vercel origin into the backend's `CORS_ALLOWED_ORIGINS` environment variable and redeploy/restart the backend.

### Public attendance metric and compact tickets

The landing page reads `GET /api/v1/public/metrics` and displays the durable `totalCheckIns` value. Flyway migration `V6__add_permanent_attendance_counter.sql` initializes that value from all existing check-ins and increments it atomically only after a new NFC or QR check-in succeeds. It is deliberately separate from event records, so normal event/guest cleanup cannot reset the historical total. A full database restore or replacement still requires restoring the database backup containing `platform_metrics`.

Guest QR printing uses an 80mm × 50mm compact event-ticket layout. Check-in confirmation printing uses the same physical size and displays a category-specific letter, or `+O` for Plus one guests. Configure the browser/printer to use the ticket roll or custom 80mm × 50mm paper setting and disable automatic scaling. The Check-in screen's **Auto-print ticket** option starts printing after a successful check-in; truly unattended output requires kiosk or managed-browser silent-print configuration.

`frontend/vercel.json` keeps client-side routes working when a user refreshes a page such as `/events/{id}/dashboard`.

## Verify the live deployment

1. Open the Vercel URL and confirm the login page loads.
2. Log in with a production user; do not use seeded demo credentials in a public deployment.
3. In the browser Network tab, confirm API requests go to `https://your-backend-host/api/v1`.
4. Create or open an event and verify guest, card, and check-in pages load.
5. Confirm the live dashboard connects without repeated WebSocket failures.
6. Register one test NFC UID for an event, assign it to a confirmed and paid test guest, and check it in. Confirm the card becomes `CHECKED_IN` and a second NFC scan is rejected.
7. Remove test data before opening the system to real guests.
8. Confirm CORS rejects an unrelated origin and that Swagger is not exposing secrets.

## Custom domain and HTTPS

Use HTTPS for both services. Add the final custom frontend origin, including scheme and port when applicable, to `CORS_ALLOWED_ORIGINS`, for example:

```text
https://app.occassia.com
```

If the frontend and backend use custom domains, set `VITE_API_URL` and `VITE_WS_URL` to those exact HTTPS URLs and redeploy the frontend after changing them.

## Production cleanup

- Do not commit `.env` files, JWT secrets, database passwords, or bridge tokens.
- Keep `node_modules`, `frontend/dist`, and `backend/target` out of version control.
- Run database backups and configure retention on the managed PostgreSQL service.
- Set a service restart policy and monitor backend logs.
- Restrict CORS to known frontend origins; do not use `*` with credentials.
- Disable or protect Swagger in public production environments if it is not needed.
