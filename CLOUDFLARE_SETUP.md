# Cloudflare Pages Setup Guide

## Prerequisites
- Cloudflare account
- GitHub repository: `imsinghdurgesg/munimji-web-admin`

## Step-by-Step Setup

### 1. Connect GitHub to Cloudflare Pages

1. Go to https://dash.cloudflare.com/
2. Click **Workers & Pages** in the left sidebar
3. Click **Create application**
4. Select **Pages** tab
5. Click **Connect to Git**
6. **Authorize Cloudflare** to access your GitHub account
   - If already authorized, click **Add account** or **Configure account access**
7. Select repository: **imsinghdurgesg/munimji-web-admin**

### 2. Configure Build Settings

Set the following configuration:

```
Project name: munimji-admin
Production branch: main
Build command: npm run build
Build output directory: dist
Root directory: (leave blank)
```

### 3. Environment Variables

Add the following environment variable:

```
VITE_API_URL = https://showroom-pro-backend-production.up.railway.app/api
```

(Or your actual backend API URL)

### 4. Deploy

Click **Save and Deploy**

---

## Automatic Deployments

Once set up, Cloudflare Pages will automatically:
- Deploy when you push to the `main` branch
- Create preview deployments for pull requests
- Rebuild on every commit

## Verify Auto-Deploy is Enabled

1. Go to your project in Cloudflare Pages
2. Click **Settings**
3. Under **Builds & deployments**, verify:
   - ✅ **Automatic deployments** is ON
   - ✅ **Production branch** is set to `main`
   - ✅ **Source** shows your GitHub repo

## Troubleshooting

### Issue: Deployments Not Triggering

**Check:**
1. GitHub integration is properly connected (Settings → Builds & deployments)
2. Cloudflare has permission to access your repository
3. Webhook is installed in your GitHub repo (Settings → Webhooks)

**Fix:**
1. Go to Cloudflare Pages → Settings → Builds & deployments
2. Click **Configure Production deployments**
3. Reconnect your GitHub account
4. Re-authorize repository access

### Issue: Build Fails

**Check build logs:**
1. Go to Cloudflare Pages → Deployments
2. Click on the failed deployment
3. View logs to see the error

**Common fixes:**
- Ensure build command is: `npm run build`
- Ensure output directory is: `dist`
- Ensure `VITE_API_URL` environment variable is set

### Manual Deployment

If auto-deploy isn't working, you can manually trigger:
1. Go to Cloudflare Pages → Deployments
2. Click **Create deployment**
3. Select branch: `main`
4. Click **Save and Deploy**

---

## URLs

After deployment:
- **Production**: `https://munimji-admin.pages.dev`
- **Custom domain** (if configured): Your custom domain

## Re-enable Auto Deployments

If you disconnected the GitHub integration:

1. Go to https://dash.cloudflare.com/
2. Navigate to **Workers & Pages** → **munimji-admin**
3. Go to **Settings** → **Builds & deployments**
4. Under **Source control**, click **Connect repository**
5. Select GitHub and authorize
6. Choose the repository and branch
7. Save configuration

This will re-enable automatic deployments on every push to main.
