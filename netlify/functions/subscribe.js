// Netlify Functions version
// This file should be in /netlify/functions/subscribe.js

const { Resend } = require('resend')

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: 'Method not allowed' }),
    }
  }

  const { email } = JSON.parse(event.body || '{}')

  if (!email || !email.includes('@')) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: 'Valid email is required' }),
    }
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set')
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'Server configuration error. Please contact support.' }),
      }
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.NEWSLETTER_FROM || 'onboarding@resend.dev'
    const siteUrl = process.env.SITE_URL || 'https://mhadi.tv'

    // Add to Resend Audience (if configured - create audience in Resend dashboard)
    if (process.env.RESEND_AUDIENCE_ID) {
      try {
        const { data, error } = await resend.contacts.create({
          email,
          audienceId: process.env.RESEND_AUDIENCE_ID,
        })

        if (error && !error.message?.includes('already exists')) {
          console.error('Resend audience error:', error)
        }
      } catch (err) {
        console.error('Error adding to audience:', err)
      }
    }

    // Send welcome email
    try {
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Welcome to Creative Chaos',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
            <div style="background-color: #fff; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px; font-weight: 600;">Welcome to Creative Chaos!</h1>
              <p style="color: #64748b; line-height: 1.6; margin-bottom: 16px;">
                Thanks for subscribing. You'll receive updates when new posts are published.
              </p>
              <a href="${siteUrl}/writings" 
                 style="display: inline-block; background-color: #0f172a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 16px;">
                View Posts →
              </a>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">
              <a href="${siteUrl}/writings" style="color: #64748b; text-decoration: none;">${siteUrl}/writings</a>
            </p>
          </body>
          </html>
        `,
      })
    } catch (err) {
      console.error('Error sending welcome email:', err)
      // Continue - subscription was successful even if welcome email fails
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: 'Successfully subscribed!' }),
    }
  } catch (error) {
    console.error('Subscription error:', error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: 'Failed to subscribe. Please try again.' }),
    }
  }
}

