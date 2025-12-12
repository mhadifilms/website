# Deploy to Netlify & Setup Netlify Forms

## Quick Setup

### 1. Deploy to Netlify

**Option A: Via Netlify Dashboard (Easiest)**
1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Netlify will auto-detect settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click "Deploy site"

**Option B: Via Netlify CLI**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init
netlify deploy --prod
```

### 2. Configure Environment Variables

In Netlify Dashboard → Site settings → Environment variables, add:

**Required:**
- `RESEND_API_KEY` - Your Resend API key

**Optional:**
- `RESEND_AUDIENCE_ID` - Your Resend Audience ID (for newsletter emails)
- `NEWSLETTER_FROM` - Your verified email (defaults to `onboarding@resend.dev`)
- `SITE_URL` - Your site URL (defaults to `https://mhadi.tv`)

### 3. Setup Netlify Forms Webhook (Optional - for Resend integration)

If you want form submissions to automatically add subscribers to Resend:

1. Go to Netlify Dashboard → Site settings → Forms
2. Scroll to "Form notifications"
3. Click "Add notification" → "Outgoing webhook"
4. Set:
   - **Event**: Form submission
   - **URL**: `https://your-site.netlify.app/.netlify/functions/subscribe-form`
   - **Method**: POST
5. Save

### 4. View Form Submissions

- Go to Netlify Dashboard → Forms
- Click on "subscribe" form
- View all submissions

## How It Works

1. **User submits form** → Netlify Forms captures it
2. **Netlify stores submission** → Available in dashboard
3. **Webhook triggers** (if configured) → Adds to Resend Audience + sends welcome email
4. **Newsletter emails** → Still sent via GitHub Actions when new posts are published

## Benefits

✅ No backend needed - Netlify Forms handles everything  
✅ Form submissions stored in Netlify dashboard  
✅ Spam protection built-in  
✅ Works with React Router (SPA)  
✅ Optional Resend integration for welcome emails

## Troubleshooting

**Form not submitting?**
- Check browser console for errors
- Verify hidden form exists in `index.html`
- Make sure form has `name="subscribe"` attribute

**Not receiving emails?**
- Check Netlify Forms dashboard for submissions
- Verify `RESEND_API_KEY` is set in environment variables
- Check Netlify function logs

**Resend integration not working?**
- Verify webhook is configured correctly
- Check function logs in Netlify Dashboard → Functions
- Ensure `RESEND_API_KEY` is set
