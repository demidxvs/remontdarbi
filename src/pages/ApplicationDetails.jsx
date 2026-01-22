import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiUrl } from '../lib/api.js'

function ApplicationDetails() {
  const { id } = useParams()
  const [application, setApplication] = useState(null)
  const [status, setStatus] = useState('loading')
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [saveStatus, setSaveStatus] = useState(null)
  const [categories, setCategories] = useState([])
  const [authRole, setAuthRole] = useState(null)

  const sessionToken = localStorage.getItem('sessionToken')

  useEffect(() => {
    // Ielādē pieteikumu; adminam izmanto admin API.
    const loadApplication = async () => {
      try {
        const useAdmin =
          sessionToken && ['admin', 'manager'].includes(authRole || '')
        const response = await fetch(
          apiUrl(
            useAdmin ? `/api/admin/applications/${id}` : `/api/applications/${id}`,
          ),
          useAdmin
            ? {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionToken }),
              }
            : undefined,
        )
        if (response.status === 404) {
          setStatus('missing')
          return
        }
        if (!response.ok) {
          throw new Error('Neizdevās ielādēt pieteikumu.')
        }
        const data = await response.json()
        setApplication(data)
        setForm({
          clientName: data.client_name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          category: data.category,
          budget: data.budget,
          desiredDate: data.desired_date,
        })
        setStatus('ready')
      } catch (error) {
        setStatus('error')
      }
    }

    loadApplication()
  }, [id, authRole, sessionToken])

  useEffect(() => {
    // Ielādē kategoriju sarakstu rediģēšanai.
    const loadCategories = async () => {
      try {
        const response = await fetch(apiUrl('/api/categories'))
        if (!response.ok) {
          throw new Error('Failed')
        }
        const data = await response.json()
        setCategories(data)
      } catch (error) {
        setCategories([])
      }
    }

    loadCategories()
  }, [])

  useEffect(() => {
    // Noskaidro lietotāja lomu sesijai.
    const loadSession = async () => {
      if (!sessionToken) {
        setAuthRole(null)
        return
      }
      try {
        const response = await fetch(apiUrl('/api/admin/status'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken }),
        })
        if (!response.ok) {
          throw new Error('Failed')
        }
        const data = await response.json()
        setAuthRole(data.is_authenticated ? data.role : null)
      } catch (error) {
        setAuthRole(null)
      }
    }

    loadSession()
  }, [sessionToken])

  // Validē pieteikuma laukus pirms saglabāšanas.
  const validateForm = (values) => {
    const validationErrors = {}
    if (!values.clientName.trim() || values.clientName.trim().length < 2) {
      validationErrors.clientName =
        'Ievadiet vārdu un uzvārdu (min. 2 simboli).'
    }
    if (!/^\+371\d{8}$/.test(values.phone)) {
      validationErrors.phone = 'Tālrunis formātā +371xxxxxxxx.'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      validationErrors.email = 'Ievadiet korektu e-pastu.'
    }
    if (!values.address.trim()) {
      validationErrors.address = 'Ievadiet objekta adresi.'
    }
    if (!values.category) {
      validationErrors.category = 'Izvēlieties remonta kategoriju.'
    }
    const budgetValue = Number(values.budget)
    if (Number.isNaN(budgetValue) || budgetValue < 500 || budgetValue > 10000) {
      validationErrors.budget = 'Budžetam jābūt 500-10000.'
    }
    if (!values.desiredDate) {
      validationErrors.desiredDate = 'Norādiet vēlamo termiņu.'
    } else {
      const desired = new Date(values.desiredDate)
      const minDate = new Date()
      minDate.setDate(minDate.getDate() + 7)
      minDate.setHours(0, 0, 0, 0)
      if (desired < minDate) {
        validationErrors.desiredDate =
          'Termiņš nevar būt ātrāk kā pēc 7 dienām.'
      }
    }
    return validationErrors
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Saglabā admina veiktās izmaiņas pieteikumā.
  const handleSave = async (event) => {
    event.preventDefault()
    if (!form) return
    if (!sessionToken) {
      setSaveStatus({
        type: 'error',
        message: 'Pieslēdzieties, lai rediģētu pieteikumu.',
      })
      return
    }
    const validationErrors = validateForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setSaveStatus(null)
    try {
      const response = await fetch(apiUrl(`/api/applications/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          clientName: form.clientName,
          phone: form.phone,
          email: form.email,
          address: form.address,
          category: form.category,
          budget: Number(form.budget),
          desiredDate: form.desiredDate,
        }),
      })
      if (!response.ok) {
        throw new Error('Kļūda saglabājot pieteikumu.')
      }
      setSaveStatus({ type: 'success', message: 'Pieteikums atjaunots.' })
      setIsEditing(false)
      setApplication((prev) =>
        prev
          ? {
              ...prev,
              client_name: form.clientName,
              phone: form.phone,
              email: form.email,
              address: form.address,
              category: form.category,
              budget: form.budget,
              desired_date: form.desiredDate,
            }
          : prev,
      )
    } catch (error) {
      setSaveStatus({
        type: 'error',
        message: error.message || 'Kļūda saglabājot pieteikumu.',
      })
    }
  }

  if (status === 'missing') {
    return (
      <div className="rounded-[10px] bg-white p-10 text-center shadow-lg">
        <h2 className="text-2xl font-bold text-[#1f2937]">
          Pieteikums nav atrasts
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Iespējams, norādītais ID neeksistē vai pieteikums ir dzēsts.
        </p>
      </div>
    )
  }

  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#1f2937]">
          Pieteikuma detaļas
        </h2>
        <Link
          to="/applications"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
        >
          Atpakaļ uz sarakstu
        </Link>
      </div>

      <div className="mx-auto w-full max-w-xl rounded-[10px] bg-white p-6 shadow-lg">
        {status === 'loading' && (
          <p className="text-sm text-gray-600">Ielādē pieteikumu...</p>
        )}
        {status === 'error' && (
          <p className="text-sm text-red-600">
            Neizdevās ielādēt pieteikumu.
          </p>
        )}
        {status === 'ready' && application && !isEditing && (
          <>
            <div className="grid gap-3 text-sm text-gray-700">
              <div>
                <span className="font-semibold text-gray-900">Klients: </span>
                {application.client_name}
              </div>
              <div>
                <span className="font-semibold text-gray-900">Telefons: </span>
                {application.phone}
              </div>
              <div>
                <span className="font-semibold text-gray-900">E-pasts: </span>
                {application.email}
              </div>
              <div>
                <span className="font-semibold text-gray-900">Adrese: </span>
                {application.address}
              </div>
              <div>
                <span className="font-semibold text-gray-900">
                  Remonta kategorija:{' '}
                </span>
                {application.category}
              </div>
              <div>
                <span className="font-semibold text-gray-900">
                  Paredzamais budžets (EUR):{' '}
                </span>
                {Number(application.budget).toFixed(0)}
              </div>
              <div>
                <span className="font-semibold text-gray-900">
                  Vēlamais termiņš:{' '}
                </span>
                {application.desired_date || '—'}
              </div>
              <div>
                <span className="font-semibold text-gray-900">
                  Pieteikuma ID:{' '}
                </span>
                {application.id}
              </div>
              <div>
                <span className="font-semibold text-gray-900">
                  Izveides datums:{' '}
                </span>
                {application.created_at}
              </div>
            </div>
            {['admin', 'manager'].includes(authRole || '') && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="mt-4 h-[40px] rounded-md bg-[#1f3b64] px-4 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#2b4a7a]"
              >
                Rediģēt
              </button>
            )}
          </>
        )}

        {status === 'ready' &&
          application &&
          isEditing &&
          form &&
          ['admin', 'manager'].includes(authRole || '') && (
          <form className="grid gap-3 text-sm text-gray-700" onSubmit={handleSave}>
            <div className="grid gap-1">
              <label className="text-sm font-medium text-gray-700">
                Klienta vārds, uzvārds
              </label>
              <input
                name="clientName"
                value={form.clientName}
                onChange={handleChange}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1f3b64]"
              />
              {errors.clientName && (
                <p className="text-xs text-red-600">{errors.clientName}</p>
              )}
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium text-gray-700">
                Telefons
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1f3b64]"
              />
              {errors.phone && (
                <p className="text-xs text-red-600">{errors.phone}</p>
              )}
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium text-gray-700">E-pasts</label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1f3b64]"
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email}</p>
              )}
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium text-gray-700">Adrese</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1f3b64]"
              />
              {errors.address && (
                <p className="text-xs text-red-600">{errors.address}</p>
              )}
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium text-gray-700">
                Remonta kategorija
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1f3b64]"
              >
                <option value="">Izvēlieties kategoriju</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-red-600">{errors.category}</p>
              )}
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium text-gray-700">
                Paredzamais budžets (EUR)
              </label>
              <input
                name="budget"
                type="number"
                min="500"
                max="10000"
                value={form.budget}
                onChange={handleChange}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1f3b64]"
              />
              {errors.budget && (
                <p className="text-xs text-red-600">{errors.budget}</p>
              )}
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium text-gray-700">
                Vēlamais termiņš
              </label>
              <input
                name="desiredDate"
                type="date"
                value={form.desiredDate}
                onChange={handleChange}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1f3b64]"
              />
              {errors.desiredDate && (
                <p className="text-xs text-red-600">{errors.desiredDate}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="h-[40px] rounded-md bg-[#1f3b64] px-4 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#2b4a7a]"
              >
                Saglabāt
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="h-[40px] rounded-md border border-gray-300 px-4 text-xs font-semibold uppercase tracking-[0.15em] text-gray-700 transition hover:bg-gray-50"
              >
                Atcelt
              </button>
            </div>
            {saveStatus && (
              <div
                className={`rounded-md border px-4 py-2 text-sm ${
                  saveStatus.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {saveStatus.message}
              </div>
            )}
          </form>
        )}
      </div>
    </section>
  )
}

export default ApplicationDetails
