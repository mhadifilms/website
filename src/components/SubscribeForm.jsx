import { useState } from 'react'

export default function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      // Netlify Forms submission
      const formData = new FormData()
      formData.append('form-name', 'subscribe')
      formData.append('email', email)

      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString(),
      })

      if (!response.ok) {
        throw new Error('Failed to subscribe')
      }

      setStatus('success')
      setEmail('')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (error) {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <>
      {/* Hidden form for Netlify to detect during build */}
      <form name="subscribe" netlify netlify-honeypot="bot-field" hidden>
        <input type="email" name="email" />
      </form>

      {/* Visible form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <input type="hidden" name="form-name" value="subscribe" />
        <div className="flex gap-2 max-w-md">
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="flex-1 px-3 py-1.5 bg-slate-800/40 border border-slate-700/30 rounded text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-600 focus:border-slate-600 transition-colors"
            disabled={status === 'loading' || status === 'success'}
          />
          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="px-4 py-1.5 bg-slate-700 text-slate-200 rounded text-sm font-medium hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {status === 'loading' ? '...' : status === 'success' ? '✓' : 'Subscribe'}
          </button>
        </div>
        {status === 'success' && (
          <p className="text-xs text-emerald-400">Thanks! Check your email.</p>
        )}
        {status === 'error' && errorMessage && (
          <p className="text-xs text-red-400">{errorMessage}</p>
        )}
      </form>
    </>
  )
}
