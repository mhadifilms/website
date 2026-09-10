# Newsletter signup

The writing index and published articles include a subscription form. It stays hidden until `/newsletter/config.json` supplies an HTTPS endpoint:

```json
{"endpoint":"https://creative-chaos-signup.mhadifilms.workers.dev/subscribe"}
```

Do not add a placeholder endpoint to the public build. The confirmation service is maintained in the private CMS repository. The approved deployment runs on Cloudflare Workers Free with D1; the website remains on GitHub Pages and the CMS runs locally. No paid plan or payment card was added.

The browser sends `{ email, consent: true, website: "" }` as JSON. No API credential belongs in the public configuration. The service returns a human-readable `message` on success or `error` on failure. The form requires explicit consent, includes a honeypot, and reports submission errors without claiming subscription success. Only email confirmation completes signup.

Verified locally on 10 September 2026: production build and static-publication test passed; desktop (1440px) and mobile (390px) checks passed for consent, submitted fields, success state, cleared address, and horizontal overflow against a simulated endpoint. Real confirmation delivery succeeded to all three approved owner inboxes. GET confirmation links caused no subscription changes; explicit confirmation added the Creative Chaos topic, and repeat confirmation sent no additional messages. A real unsubscribe link was tested using a separate one-owner segment, then that owner's preference was restored and verified. The original 33 imported subscribers received no migration or test messages.
