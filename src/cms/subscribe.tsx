import { useEffect, useId, useState } from "react";
export function SubscribeForm() {
  const id = useId(),
    [endpoint, setEndpoint] = useState(""),
    [email, setEmail] = useState(""),
    [consent, setConsent] = useState(false),
    [website, setWebsite] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/newsletter/config.json")
      .then(async (r) => {
        if (!r.ok) return;
        const config = await r.json();
        const url = new URL(config.endpoint);
        if (url.protocol === "https:" && active) setEndpoint(url.href);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent, website }),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Please try again later.");
      setMessage(result.message);
      setEmail("");
      setConsent(false);
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "TimeoutError"
          ? e.message
          : "The connection took too long. Check your inbox before trying again.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!endpoint) return null;
  return (
    <section className="newsletter-signup" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>Follow the creative chaos.</h2>
      <p>Essays, notes, and things I’m figuring out. Straight to your inbox.</p>
      <form onSubmit={submit}>
        <label htmlFor={`${id}-email`}>Your email</label>
        <div className="newsletter-signup-row">
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={busy}
          />
          <button disabled={busy || !consent} type="submit">
            {busy ? "Sending…" : "Subscribe"}
          </button>
        </div>
        <label className="newsletter-consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
            disabled={busy}
          />
          <span>
            Email me new Creative Chaos posts. I can unsubscribe anytime.
          </span>
        </label>
        <div aria-hidden="true" className="newsletter-honeypot">
          <label>
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
        </div>
        {message && <p role="status">{message}</p>}
        {error && <p role="alert">{error}</p>}
      </form>
      <small>You’ll receive an email to confirm your subscription.</small>
    </section>
  );
}
