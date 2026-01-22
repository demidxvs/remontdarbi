import { useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import Admin from './pages/Admin.jsx'
import AdminUsers from './pages/AdminUsers.jsx'
import ApplicationDetails from './pages/ApplicationDetails.jsx'
import ApplicationsList from './pages/ApplicationsList.jsx'
import Login from './pages/Login.jsx'
import NewApplication from './pages/NewApplication.jsx'
import { apiUrl } from './lib/api.js'

function App() {
  // Glabā autentifikācijas stāvokli (ielāde + loma).
  const [auth, setAuth] = useState({ loading: true, role: null })

  const sessionToken = localStorage.getItem('sessionToken')
  const guestMode = localStorage.getItem('guestMode') === '1'

  useEffect(() => {
    // Pārbauda sesiju serverī vai nosaka viesi bez sesijas.
    const checkAuth = async () => {
      if (!sessionToken) {
        setAuth({ loading: false, role: guestMode ? 'guest' : null })
        return
      }
      try {
        const response = await fetch(apiUrl('/api/admin/status'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken }),
        })
        if (!response.ok) {
          setAuth({ loading: false, role: null })
          return
        }
        const data = await response.json()
        setAuth({
          loading: false,
          role: data.is_authenticated ? data.role : null,
        })
      } catch (error) {
        setAuth({ loading: false, role: null })
      }
    }

    checkAuth()
  }, [sessionToken])

  const navItems = useMemo(() => {
    if (!auth.role) return []
    if (auth.role === 'guest') {
      return [{ to: '/applications', label: 'Pieteikumu saraksts' }]
    }
    // Navigācija atkarīga no lomas.
    const items = [
      { to: '/', label: 'Jauns pieteikums' },
      { to: '/applications', label: 'Pieteikumu saraksts' },
    ]
    if (['admin', 'manager'].includes(auth.role)) {
      items.push({ to: '/admin', label: 'Administrācija' })
    }
    if (auth.role === 'admin') {
      items.push({ to: '/admin/users', label: 'Lietotāji' })
    }
    return items
  }, [auth.role])

  if (auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-600">
        Ielādē...
      </div>
    )
  }

  if (!auth.role) {
    return <Login onLogin={(role) => setAuth({ loading: false, role })} />
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <header className="h-[70px] bg-[#2f3742] text-white">
        <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-6">
          <div className="text-sm font-semibold uppercase tracking-[0.2em]">
            Remontdarbu pieteikumu sistēma
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex gap-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'rounded-md px-3 py-2 text-sm font-medium transition',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:bg-white/10 hover:text-white',
                    ].join(' ')
                  }
                  end={item.to === '/'}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            {auth.role === 'guest' ? (
              <button
                type="button"
                onClick={() => {
                  // Iziešana no viesu režīma atgriež uz login.
                  localStorage.removeItem('guestMode')
                  window.location.reload()
                }}
                className="rounded-md border border-white/20 px-3 py-2 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white"
              >
                Ielogoties
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  if (sessionToken) {
                    try {
                      // Servera logout atjaunina last_logout_at.
                      await fetch(apiUrl('/api/admin/logout'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionToken }),
                      })
                    } catch (error) {
                      // Logout tiek mēģināts, bet lokālo stāvokli tīra jebkurā gadījumā.
                    }
                  }
                  localStorage.removeItem('sessionToken')
                  localStorage.removeItem('guestMode')
                  localStorage.setItem('logoutNotice', '1')
                  window.location.reload()
                }}
                className="rounded-md border border-white/20 px-3 py-2 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white"
              >
                Iziet
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-6">
        <Routes>
          <Route
            path="/"
            element={
              auth.role === 'guest' ? (
                <Navigate to="/applications" replace />
              ) : (
                <NewApplication />
              )
            }
          />
          <Route path="/applications" element={<ApplicationsList />} />
          <Route path="/applications/:id" element={<ApplicationDetails />} />
          <Route
            path="/admin"
            element={
              auth.role === 'guest' ? (
                <Navigate to="/applications" replace />
              ) : (
                <Admin />
              )
            }
          />
          <Route
            path="/admin/users"
            element={
              auth.role === 'guest' ? (
                <Navigate to="/applications" replace />
              ) : (
                <AdminUsers />
              )
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
