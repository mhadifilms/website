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
      // Submit directly to Netlify Function
      const response = await fetch('/.netlify/functions/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to subscribe')
      }

      setStatus('success')
      setEmail('')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2 max-w-md">
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          disabled={status === 'loading' || status === 'success'}
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="px-4 py-1.5 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
  )
}
