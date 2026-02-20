import { useEffect, useState } from 'react'
import { apiUrl } from '../lib/api.js'

const emptyCredentials = {
  username: '',
  password: '',
}

function Admin() {
  const [credentials, setCredentials] = useState(emptyCredentials)
  const [session, setSession] = useState({
    authenticated: false,
    username: 'Guest',
    role: null,
    expiresAt: null,
  })
  const [applications, setApplications] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryName, setCategoryName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [message, setMessage] = useState(null)
  const [isBusy, setIsBusy] = useState(false)

  const sessionToken = localStorage.getItem('sessionToken')

  // Apstrādā ievadi login formā.
  const handleChange = (event) => {
    const { name, value } = event.target
    setCredentials((prev) => ({ ...prev, [name]: value }))
  }

  // Atjaunina lokālo sesijas stāvokli.
  const updateSession = (payload) => {
    if (!payload?.is_authenticated) {
      setSession({
        authenticated: false,
        username: 'Guest',
        role: null,
        expiresAt: null,
      })
      setApplications([])
      setMessage(null)
      return
    }

    setSession({
      authenticated: true,
      username: payload.username,
      role: payload.role,
      expiresAt: payload.expires_at,
    })
  }

  // Pārbauda, vai sesija ir derīga.
  const checkSession = async () => {
    if (!sessionToken) {
      setSession({
        authenticated: false,
        username: 'Guest',
        role: null,
        expiresAt: null,
      })
      setMessage(null)
      return
    }

    try {
      const response = await fetch(apiUrl('/api/admin/status'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken }),
      })
      const data = await response.json()
      updateSession(data)
    } catch (error) {
      setMessage({ type: 'error', text: 'Neizdevās pārbaudīt sesiju.' })
    }
  }

  useEffect(() => {
    checkSession()
  }, [])

  useEffect(() => {
    if (session.authenticated) {
      if (['admin', 'manager'].includes(session.role)) {
        loadApplications()
      }
      if (session.role === 'admin') {
        loadCategories()
      }
    }
  }, [session.authenticated])

  // Validē lietotājvārdu/paroli.
  const validateCredentials = (mode) => {
    const errors = {}
    if (!credentials.username.trim()) {
      errors.username = 'Ievadiet lietotājvārdu.'
    }
    if (!credentials.password.trim()) {
      errors.password = 'Ievadiet paroli.'
    }
    return errors
  }


  // Pieslēdz lietotāju ar API.
  const loginUser = async () => {
    const errors = validateCredentials('login')
    if (Object.keys(errors).length > 0) {
      setMessage({ type: 'error', text: 'Lūdzu aizpildiet visus laukus.' })
      return
    }
    setIsBusy(true)
    setMessage(null)
    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      })
      if (!response.ok) {
        throw new Error('Nepareizi lietotāja dati.')
      }
      const data = await response.json()
      localStorage.setItem('sessionToken', data.session_token)
      updateSession(data)
      setMessage({ type: 'success', text: 'Veiksmīgi pieslēgts.' })
      setCredentials((prev) => ({ ...prev, password: '' }))
      if (['admin', 'manager'].includes(data.role)) {
        await loadApplications(data.session_token)
      }
      if (data.role === 'admin') {
        await loadCategories()
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Neizdevās pieslēgties.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  // Ielādē pieteikumu sarakstu adminam/menedžerim.
  const loadApplications = async (token = sessionToken) => {
    if (!token) return
    try {
      const response = await fetch(apiUrl('/api/admin/applications'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: token }),
      })
      if (response.status === 401) {
        setApplications([])
        return
      }
      if (!response.ok) {
        throw new Error('Neizdevās ielādēt pieteikumus.')
      }
      const data = await response.json()
      setApplications(data)
      setMessage(null)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Neizdevās ielādēt pieteikumus.',
      })
    }
  }

  // Ielādē kategorijas admina sadaļai.
  const loadCategories = async () => {
    try {
      const response = await fetch(apiUrl('/api/categories'))
      if (!response.ok) {
        throw new Error('Neizdevās ielādēt kategorijas.')
      }
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Neizdevās ielādēt kategorijas.',
      })
    }
  }


  // Apstiprina pieteikumu.
  const confirmApplication = async (id) => {
    if (!sessionToken) return
    setIsBusy(true)
    setMessage(null)
    try {
      const response = await fetch(
        apiUrl(`/api/admin/applications/${id}/confirm`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken }),
        },
      )
      if (!response.ok) {
        throw new Error('Neizdevās apstiprināt pieteikumu.')
      }
      await loadApplications()
      setMessage({ type: 'success', text: 'Pieteikums apstiprināts.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Neizdevās apstiprināt pieteikumu.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  // Dzēš pieteikumu.
  const deleteApplication = async (id) => {
    if (!sessionToken) return
    setIsBusy(true)
    setMessage(null)
    try {
      const response = await fetch(
        apiUrl(`/api/admin/applications/${id}/delete`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken }),
        },
      )
      if (!response.ok) {
        throw new Error('Neizdevās dzēst pieteikumu.')
      }
      const data = await response.json()
      if (!data?.success) {
        throw new Error('Pieteikums netika dzēsts.')
      }
      await loadApplications()
      setMessage({ type: 'success', text: 'Pieteikums dzēsts.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Neizdevās dzēst pieteikumu.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  // Izveido jaunu kategoriju.
  const createCategory = async () => {
    if (!categoryName.trim() || !sessionToken) {
      setMessage({ type: 'error', text: 'Ievadiet kategorijas nosaukumu.' })
      return
    }
    setIsBusy(true)
    setMessage(null)
    try {
      const response = await fetch(apiUrl('/api/admin/categories'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken, name: categoryName.trim() }),
      })
      if (!response.ok) {
        throw new Error('Neizdevās izveidot kategoriju.')
      }
      setCategoryName('')
      await loadCategories()
      setMessage({ type: 'success', text: 'Kategorija izveidota.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Neizdevās izveidot kategoriju.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  // Atjauno esošu kategoriju.
  const updateCategory = async () => {
    if (!editingCategoryId || !categoryName.trim() || !sessionToken) {
      setMessage({ type: 'error', text: 'Norādiet nosaukumu.' })
      return
    }
    setIsBusy(true)
    setMessage(null)
    try {
      const response = await fetch(
        apiUrl(`/api/admin/categories/${editingCategoryId}`),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken, name: categoryName.trim() }),
        },
      )
      if (!response.ok) {
        throw new Error('Neizdevās atjaunot kategoriju.')
      }
      setEditingCategoryId(null)
      setCategoryName('')
      await loadCategories()
      setMessage({ type: 'success', text: 'Kategorija atjaunota.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Neizdevās atjaunot kategoriju.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  // Dzēš kategoriju pēc ID.
  const deleteCategory = async (id) => {
    if (!sessionToken) return
    setIsBusy(true)
    setMessage(null)
    try {
      const response = await fetch(
        apiUrl(`/api/admin/categories/${id}`),
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken }),
        },
      )
      if (!response.ok) {
        throw new Error('Neizdevās dzēst kategoriju.')
      }
      await loadCategories()
      setMessage({ type: 'success', text: 'Kategorija dzēsta.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Neizdevās dzēst kategoriju.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  // Atjauno sesiju un pārlādē datus.
  const refreshSession = async () => {
    setIsBusy(true)
    setMessage(null)
    try {
      const response = await fetch(apiUrl('/api/admin/status'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken }),
      })
      const data = await response.json()
      updateSession(data)
      if (data.is_authenticated) {
        setMessage({
          type: 'success',
          text: 'Sesija ir derīga un atjaunota.',
        })
        if (['admin', 'manager'].includes(data.role)) {
          await loadApplications()
        }
        if (data.role === 'admin') {
          await loadCategories()
        }
      } else {
        setMessage({
          type: 'error',
          text: 'Sesija nav derīga. Lūdzu pieslēdzieties vēlreiz.',
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Neizdevās atjaunot sesiju.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  // Izraksta lietotāju no sistēmas.
  const logoutUser = async () => {
    setIsBusy(true)
    setMessage(null)
    try {
      await fetch(apiUrl('/api/admin/logout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken }),
      })
      localStorage.removeItem('sessionToken')
      updateSession({ is_authenticated: false })
      setCategories([])
      setMessage({ type: 'success', text: 'Sesija noslēgta.' })
      window.location.reload()
    } catch (error) {
      setMessage({ type: 'error', text: 'Neizdevās iziet no sistēmas.' })
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <div className="rounded-[10px] bg-white p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-[#1f2937]">Administrācija</h2>
        <p className="mt-2 text-sm text-gray-600">
          Pieslēgšanās un lietotāju pārvaldība notiek tikai ar datubāzes
          funkcijām.
        </p>

        {!session.authenticated ? (
          <div className="mt-6 grid gap-5">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">
                Lietotājvārds
              </label>
              <input
                name="username"
                value={credentials.username}
                onChange={handleChange}
                required
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#1f3b64]"
                placeholder="admin"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">Parole</label>
              <input
                name="password"
                type="password"
                value={credentials.password}
                onChange={handleChange}
                required
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#1f3b64]"
                placeholder="••••••••"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loginUser}
                disabled={isBusy}
                className="h-[40px] rounded-md bg-[#1f3b64] px-4 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#2b4a7a] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Pieslēgties
              </button>
              <span className="text-xs text-gray-500">
                Reģistrācija ir pieejama sākumlapā.
              </span>
            </div>
          </div>
        ) : (
          <p className="mt-6 text-sm text-gray-600">
            Jūs esat pieslēdzies. Šeit redzamas administratora darbības.
          </p>
        )}

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

      {session.authenticated &&
        !['admin', 'manager'].includes(session.role) && (
          <div className="rounded-[10px] bg-white p-6 shadow-lg">
            <h3 className="text-xl font-bold text-[#1f2937]">Nav piekļuves</h3>
            <p className="mt-2 text-sm text-gray-600">
              Šī sadaļa pieejama tikai administratoram vai menedžerim.
            </p>
          </div>
        )}

      {session.authenticated &&
        ['admin', 'manager'].includes(session.role) && (
        <div className="rounded-[10px] bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-bold text-[#1f2937]">
              Pieteikumu pārvaldība
            </h3>
            <p className="text-sm text-gray-600">
              Apstipriniet vai dzēsiet pieteikumus pēc pārbaudes.
            </p>
          </div>
          <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-100 text-xs uppercase tracking-[0.15em] text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Klients</th>
                    <th className="px-4 py-3">Kategorija</th>
                    <th className="px-4 py-3">Statuss</th>
                    <th className="px-4 py-3">Darbības</th>
                    <th className="px-4 py-3">Skatīt</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 && (
                    <tr>
                      <td className="px-4 py-4 text-gray-500" colSpan="4">
                        Nav pieteikumu.
                      </td>
                    </tr>
                  )}
                  {applications.map((item) => (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="px-4 py-4 font-medium text-gray-900">
                        {item.client_name}
                      </td>
                      <td className="px-4 py-4">{item.category}</td>
                      <td className="px-4 py-4 capitalize">{item.status}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => confirmApplication(item.id)}
                            disabled={isBusy || item.status === 'confirmed'}
                            className="rounded-md border border-emerald-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:bg-gray-200"
                          >
                            Apstiprināt
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteApplication(item.id)}
                            disabled={isBusy}
                            className="rounded-md border border-red-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-gray-200"
                          >
                            Dzēst
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <a
                          href={`/applications/${item.id}`}
                          className="rounded-md border border-gray-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-gray-700 transition hover:bg-gray-50"
                        >
                          Skatīt
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {session.authenticated && session.role === 'admin' && (
        <div className="rounded-[10px] bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-bold text-[#1f2937]">
              Kategoriju pārvaldība
            </h3>
            <p className="text-sm text-gray-600">
              Pievienojiet vai rediģējiet kategorijas, kas redzamas formā.
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            <input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1f3b64]"
              placeholder="Kategorijas nosaukums"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={createCategory}
                disabled={isBusy}
                className="h-[40px] rounded-md bg-[#1f3b64] px-4 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#2b4a7a] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Pievienot
              </button>
              <button
                type="button"
                onClick={updateCategory}
                disabled={isBusy || !editingCategoryId}
                className="h-[40px] rounded-md border border-gray-300 px-4 text-xs font-semibold uppercase tracking-[0.15em] text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-200"
              >
                Saglabāt izmaiņas
              </button>
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
            <table className="min-w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3">Nosaukums</th>
                  <th className="px-4 py-3">Darbības</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 && (
                  <tr>
                    <td className="px-4 py-4 text-gray-500" colSpan="2">
                      Nav kategoriju.
                    </td>
                  </tr>
                )}
                {categories.map((category) => (
                  <tr key={category.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{category.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategoryId(category.id)
                            setCategoryName(category.name)
                          }}
                          className="rounded-md border border-gray-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-gray-700 transition hover:bg-gray-50"
                        >
                          Rediģēt
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCategory(category.id)}
                          className="rounded-md border border-red-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-red-700 transition hover:bg-red-50"
                        >
                          Dzēst
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {session.authenticated && session.role === 'admin' && (
        <div className="rounded-[10px] bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-bold text-[#1f2937]">
              Lietotāju pārvaldība
            </h3>
            <p className="text-sm text-gray-600">
              Atveriet lietotāju pārvaldības sadaļu.
            </p>
          </div>
          <div className="mt-4">
            <a
              href="/admin/users"
              className="inline-flex h-[40px] items-center rounded-md bg-[#1f3b64] px-4 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#2b4a7a]"
            >
              Atvērt lietotājus
            </a>
          </div>
        </div>
      )}

      <aside className="rounded-[10px] bg-white p-6 text-gray-700 shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
          Sesijas statuss
        </p>
        <h3 className="mt-3 text-xl font-bold text-[#1f2937]">
          {session.authenticated ? session.username : 'Guest'}
        </h3>
        <p className="mt-3 text-sm text-gray-600">
          {session.authenticated
            ? `Loma: ${session.role} | Derīga līdz: ${session.expiresAt}`
            : 'Nav aktīvas sesijas. Pieslēdzieties, lai turpinātu.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={refreshSession}
            disabled={isBusy}
            className="h-[40px] rounded-md bg-[#1f3b64] px-4 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#2b4a7a] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Darbība
          </button>
          <button
            type="button"
            onClick={logoutUser}
            disabled={isBusy}
            className="h-[40px] rounded-md border border-gray-300 px-4 text-xs font-semibold uppercase tracking-[0.15em] text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-200"
          >
            Iziet
          </button>
        </div>
      </aside>
    </section>
  )
}

export default Admin
