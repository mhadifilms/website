# Newsletter signup

The writing index and published articles include a subscription form. It stays hidden until `/newsletter/config.json` supplies an HTTPS endpoint:

```json
{"endpoint":"https://DEPLOYED-SIGNUP-HOST/subscribe"}
```

Do not add a placeholder endpoint to the public build. The confirmation service is maintained in the private CMS repository. Connect it only after deployment approval and verification of real signup, confirmation, suppression, and unsubscribe behavior using the owner's test addresses.

The browser sends `{ email, consent: true, website: "" }` as JSON. No API credential belongs in the public configuration. The service returns a human-readable `message` on success or `error` on failure. The form requires explicit consent, includes a honeypot, and reports submission errors without claiming subscription success. Only email confirmation completes signup.

Verified locally on 10 September 2026: production build and static-publication test passed; desktop (1440px) and mobile (390px) checks passed for consent, submitted fields, success state, cleared address, and horizontal overflow against a simulated endpoint. Real confirmation delivery is still pending service deployment.
