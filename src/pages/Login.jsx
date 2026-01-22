import { useEffect, useState } from 'react'
import { apiUrl } from '../lib/api.js'

function Login({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', password: '' })
  const [message, setMessage] = useState(null)
  const [isBusy, setIsBusy] = useState(false)

  useEffect(() => {
    // Rāda paziņojumu pēc izrakstīšanās.
    const notice = localStorage.getItem('logoutNotice')
    if (notice === '1') {
      localStorage.removeItem('logoutNotice')
      setMessage({ type: 'success', text: 'Jūs esat izrakstījies.' })
    }
  }, [])

  // Apstrādā ievades lauku izmaiņas.
  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Login vai reģistrācija atkarībā no režīma.
  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.username.trim() || !form.password.trim()) {
      setMessage({ type: 'error', text: 'Lūdzu aizpildiet visus laukus.' })
      return
    }

    setIsBusy(true)
    setMessage(null)
    try {
      if (mode === 'register') {
        const response = await fetch(apiUrl('/api/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!response.ok) {
          throw new Error('Neizdevās reģistrēties.')
        }
        setMessage({
          type: 'success',
          text: 'Konts izveidots. Tagad varat pieslēgties.',
        })
        setMode('login')
        setForm({ username: '', password: '' })
      } else {
        const response = await fetch(apiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!response.ok) {
          throw new Error('Nepareizi lietotāja dati.')
        }
        const data = await response.json()
        localStorage.setItem('sessionToken', data.session_token)
        localStorage.removeItem('guestMode')
        onLogin?.(data.role)
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Radās kļūda.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-6">
      <div className="w-full max-w-md rounded-[10px] bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-[#1f2937]">
          {mode === 'login' ? 'Pieslēgties' : 'Reģistrācija'}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {mode === 'login'
            ? 'Ievadiet lietotājvārdu un paroli.'
            : 'Jauna konta izveide (loma: viewer).'}
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              Lietotājvārds
            </label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#1f3b64]"
              placeholder="username"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">Parole</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#1f3b64]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isBusy}
            className="h-[45px] w-full rounded-md bg-[#1f3b64] text-sm font-semibold text-white transition hover:bg-[#2b4a7a] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {mode === 'login' ? 'Pieslēgties' : 'Izveidot kontu'}
          </button>
        </form>

        {mode === 'login' && (
          <div className="mt-4">
            <button
              type="button"
              className="h-[45px] w-full rounded-md border border-[#1f3b64] text-sm font-semibold text-[#1f3b64] transition hover:bg-[#1f3b64]/5"
              onClick={() => {
                // Viesu režīms bez servera autentifikācijas.
                localStorage.setItem('guestMode', '1')
                onLogin?.('guest')
              }}
            >
              Turpināt kā viesis
            </button>
          </div>
        )}

        <div className="mt-4 flex justify-between text-sm text-gray-600">
          {mode === 'login' ? (
            <>
              <span>Nav konta?</span>
              <button
                type="button"
                className="font-medium text-[#1f3b64] hover:underline"
                onClick={() => setMode('register')}
              >
                Reģistrēties
              </button>
            </>
          ) : (
            <>
              <span>Jau ir konts?</span>
              <button
                type="button"
                className="font-medium text-[#1f3b64] hover:underline"
                onClick={() => setMode('login')}
              >
                Pieslēgties
              </button>
            </>
          )}
        </div>

        {message && (
          <div
            className={`mt-4 rounded-md border px-4 py-2 text-sm ${
              message.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}

export default Login
