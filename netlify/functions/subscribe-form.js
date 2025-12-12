// Netlify Forms webhook handler
// This function is triggered when a form is submitted via Netlify Forms
// Configure it in Netlify dashboard: Site settings > Forms > Form notifications > Outgoing webhook

const { Resend } = require('resend')

exports.handler = async (event, context) => {
  // Parse the webhook payload from Netlify Forms
  const payload = JSON.parse(event.body)
  
  // Only process subscribe form submissions
  if (payload.form_name !== 'subscribe') {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Form not handled' }),
    }
  }

  const email = payload.data?.email

  if (!email || !email.includes('@')) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid email' }),
    }
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('RESEND_API_KEY not set - skipping Resend integration')
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Form submitted (Resend not configured)' }),
      }
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.NEWSLETTER_FROM || 'onboarding@resend.dev'
    const siteUrl = process.env.SITE_URL || 'https://mhadi.tv'

    // Add to Resend Audience
    if (process.env.RESEND_AUDIENCE_ID) {
      try {
        await resend.contacts.create({
          email,
          audienceId: process.env.RESEND_AUDIENCE_ID,
        })
      } catch (err) {
        if (!err.message?.includes('already exists')) {
          console.error('Error adding to audience:', err)
        }
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
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Subscriber added to Resend' }),
    }
  } catch (error) {
    console.error('Error processing form submission:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error processing subscription' }),
    }
  }
}
