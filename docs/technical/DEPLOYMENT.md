# Deployment Guide (Vercel Free)

The app is a standard Next.js 14 project — deployable in minutes. MongoDB Atlas M0 (free) is the recommended database.

## 1. Create the MongoDB Atlas cluster

1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas) → **Build a Database** → **M0 Free**.
2. Region: pick the closest free region to Saudi Arabia — **Frankfurt (eu-central-1)** works well with Vercel.
3. **Database Access** → add user (e.g. `masjed_app`) with a strong password.
4. **Network Access** → allow `0.0.0.0/0` (required: Vercel IPs are dynamic).
5. **Connect → Drivers** → copy the SRV string:
   ```
   mongodb+srv://masjed_app:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Append the database name before the query params: `…mongodb.net/masjed?retryWrites=true&w=majority`

## 2. Get the code onto Vercel

Either import the Git repository from the Vercel dashboard, or use the CLI:

```bash
npm i -g vercel
vercel login
vercel link          # associate the folder with a project
```

## 3. Environment variables

Vercel dashboard → **Project → Settings → Environment Variables**, or via CLI:

```bash
vercel env add MONGODB_URI production
# paste: mongodb+srv://...net/masjed?retryWrites=true&w=majority

vercel env add JWT_SECRET production
# generate one:
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

| Variable | Production value |
|---|---|
| `MONGODB_URI` | Atlas SRV string ending in `/masjed` |
| `JWT_SECRET` | long random string (48+ bytes) |

No other variables are required.

## 4. Deploy

```bash
vercel --prod
```

First build takes ~1–2 minutes. `vercel.json` already pins:
- region `fra1`
- function max duration 10s (Free plan limit)

## 5. First-run verification

1. Open `https://<project>.vercel.app/` → should redirect to `/teacher/setup`.
2. Create the teacher account (this is the only time setup appears).
3. Confirm you land on `/dashboard` and see both default groups.
4. From `/dashboard/settings`, set real group names + times.
5. From `/holidays`, confirm weekly defaults (Fri/Sat) and remove/add exceptional days as needed.

### Smoke checks

| Check | Expected |
|---|---|
| `/api/health` | `{"status":"ok","db":"up", …}` |
| `/attendance/group-1` | page loads, shows group + status badge |
| Outside window registration attempt | Arabic "لم يبدأ/انتهى وقت التسجيل" message |

## 6. Custom domain (optional)

1. Vercel → Project → **Settings → Domains** → Add.
2. At your registrar create `CNAME` → `cname.vercel-dns.com` (values are shown by Vercel).
3. Wait for DNS propagation; HTTPS certificate is issued automatically.
4. Redeploy once if the domain was added after the last deploy so absolute links update.

## 7. Operational notes

- Sessions: JWT in an httpOnly cookie (`Secure` in production), 7-day expiry.
- Edit tokens: shown to students once; stored as SHA-256 hashes; expire after 30 days.
- Rate limits persist in the `rate_limits` collection — safe across serverless instances.
- Logs: Vercel dashboard → Deployments → Functions (Arabic messages + logger lines for ≥500 errors).
