import { useEffect, useState } from 'react'
import { apiUrl } from '../lib/api.js'

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    role: 'viewer',
  })
  const [userEdits, setUserEdits] = useState({})
  const [message, setMessage] = useState(null)
  const [isBusy, setIsBusy] = useState(false)
  const [role, setRole] = useState(null)

  const sessionToken = localStorage.getItem('sessionToken')

  // Ielādē lietotājus no admin API.
  const loadUsers = async () => {
    if (!sessionToken) return
    try {
      const response = await fetch(apiUrl('/api/admin/users/list'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken }),
      })
      if (!response.ok) {
        throw new Error('Neizdevās ielādēt lietotājus.')
      }
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Neizdevās ielādēt lietotājus.',
      })
    }
  }

  useEffect(() => {
    // Pārbauda sesijas lomu un ielādē lietotājus tikai adminam.
    const checkRole = async () => {
      if (!sessionToken) {
        setRole(null)
        return
      }
      try {
        const response = await fetch(apiUrl('/api/admin/status'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken }),
        })
        const data = await response.json()
        setRole(data.is_authenticated ? data.role : null)
        if (data.is_authenticated && data.role === 'admin') {
          await loadUsers()
        }
      } catch (error) {
        setRole(null)
      }
    }

    checkRole()
  }, [])

  // Izveido jaunu lietotāju.
  const createUser = async () => {
    if (
      !userForm.username.trim() ||
      !userForm.password.trim() ||
      !userForm.role
    ) {
      setMessage({ type: 'error', text: 'Lūdzu aizpildiet visus laukus.' })
      return
    }
    setIsBusy(true)
    setMessage(null)
    try {
      const response = await fetch(apiUrl('/api/admin/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          username: userForm.username,
          password: userForm.password,
          role: userForm.role,
        }),
      })
      if (!response.ok) {
        throw new Error('Neizdevās izveidot lietotāju.')
      }
      setUserForm({ username: '', password: '', role: 'viewer' })
      await loadUsers()
      setMessage({ type: 'success', text: 'Lietotājs izveidots.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Neizdevās izveidot lietotāju.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  // Atjauno lietotāja lomu un/vai paroli.
  const updateUser = async (userId) => {
    const edit = userEdits[userId] || {}
    const newRole = edit.role || users.find((u) => u.id === userId)?.role
    const newPassword = edit.password || ''
    setIsBusy(true)
    setMessage(null)
    try {
      const response = await fetch(apiUrl(`/api/admin/users/${userId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken, newRole, newPassword }),
      })
      if (!response.ok) {
        throw new Error('Neizdevās atjaunot lietotāju.')
      }
      await loadUsers()
      setUserEdits((prev) => ({ ...prev, [userId]: {} }))
      setMessage({ type: 'success', text: 'Lietotājs atjaunots.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Neizdevās atjaunot lietotāju.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  // Dzēš lietotāju pēc ID.
  const deleteUser = async (userId) => {
    setIsBusy(true)
    setMessage(null)
    try {
      const response = await fetch(apiUrl(`/api/admin/users/${userId}`), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken }),
      })
      if (!response.ok) {
        throw new Error('Neizdevās dzēst lietotāju.')
      }
      await loadUsers()
      setMessage({ type: 'success', text: 'Lietotājs dzēsts.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Neizdevās dzēst lietotāju.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  return (
    role !== 'admin' ? (
      <section className="rounded-[10px] bg-white p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-[#1f2937]">Nav piekļuves</h2>
        <p className="mt-2 text-sm text-gray-600">
          Šī sadaļa pieejama tikai administratoram.
        </p>
      </section>
    ) : (
    <section className="grid gap-6">
      <div className="rounded-[10px] bg-white p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-[#1f2937]">
          Lietotāju pārvaldība
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Izveidojiet, dzēsiet vai mainiet lietotāju lomas.
        </p>

        <div className="mt-4 grid gap-3">
          <div className="grid gap-2 md:grid-cols-3">
            <input
              value={userForm.username}
              onChange={(event) =>
                setUserForm((prev) => ({
                  ...prev,
                  username: event.target.value,
                }))
              }
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1f3b64]"
              placeholder="Lietotājvārds"
            />
            <input
              value={userForm.password}
              onChange={(event) =>
                setUserForm((prev) => ({
                  ...prev,
                  password: event.target.value,
                }))
              }
              type="password"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1f3b64]"
              placeholder="Parole"
            />
            <select
              value={userForm.role}
              onChange={(event) =>
                setUserForm((prev) => ({
                  ...prev,
                  role: event.target.value,
                }))
              }
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1f3b64]"
            >
              <option value="admin">admin</option>
              <option value="manager">manager</option>
              <option value="viewer">viewer</option>
            </select>
          </div>
          <button
            type="button"
            onClick={createUser}
            disabled={isBusy}
            className="h-[40px] rounded-md bg-[#1f3b64] px-4 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#2b4a7a] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Izveidot lietotāju
          </button>
        </div>
      </div>

      <div className="rounded-[10px] bg-white p-6 shadow-lg">
        <div className="overflow-hidden rounded-md border border-gray-200">
          <table className="min-w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-100 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Lietotājvārds</th>
                <th className="px-4 py-3">Loma</th>
                <th className="px-4 py-3">Jauna parole</th>
                <th className="px-4 py-3">Darbības</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-gray-500" colSpan="4">
                    Nav lietotāju.
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{user.username}</td>
                  <td className="px-4 py-3">
                    <select
                      value={userEdits[user.id]?.role || user.role}
                      onChange={(event) =>
                        setUserEdits((prev) => ({
                          ...prev,
                          [user.id]: {
                            ...prev[user.id],
                            role: event.target.value,
                          },
                        }))
                      }
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs outline-none focus:border-[#1f3b64]"
                    >
                      <option value="admin">admin</option>
                      <option value="manager">manager</option>
                      <option value="viewer">viewer</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={userEdits[user.id]?.password || ''}
                      onChange={(event) =>
                        setUserEdits((prev) => ({
                          ...prev,
                          [user.id]: {
                            ...prev[user.id],
                            password: event.target.value,
                          },
                        }))
                      }
                      type="password"
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs outline-none focus:border-[#1f3b64]"
                      placeholder="Neobligāti"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => updateUser(user.id)}
                        className="rounded-md border border-gray-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-gray-700 transition hover:bg-gray-50"
                      >
                        Saglabāt
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteUser(user.id)}
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
    </section>
    )
  )
}

export default AdminUsers
