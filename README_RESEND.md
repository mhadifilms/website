# Resend Setup - Quick Guide

## Required: Just the API Key!

You only need to set **one required secret**:
- `RESEND_API_KEY` - Get it from [resend.com/api-keys](https://resend.com/api-keys)

## Optional (but recommended):

Everything else is configured in Resend's dashboard:

1. **Create an Audience** in Resend dashboard → Copy the Audience ID → Set `RESEND_AUDIENCE_ID` secret
   - This is where subscribers are stored
   - Newsletter emails are sent to everyone in this audience

2. **Verify your domain** in Resend dashboard → Use your domain email → Set `NEWSLETTER_FROM` secret
   - For production: `newsletter@yourdomain.com`
   - For testing: Uses `onboarding@resend.dev` by default

3. **Set `SITE_URL`** secret (optional, defaults to `https://mhadi.tv`)

## How it works:

1. **Subscriber form**: Adds email to your Resend Audience + sends welcome email
2. **New post published**: GitHub Actions fetches all subscribers from Audience → sends newsletter to everyone

That's it! Everything else is handled by Resend.

