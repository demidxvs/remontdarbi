import { useEffect, useState } from 'react'
import { apiUrl } from '../lib/api.js'

const emptyForm = {
  clientName: '',
  phone: '',
  email: '',
  address: '',
  category: '',
  budget: '',
  desiredDate: '',
}

// Pārbauda ievades datus un atgriež kļūdu sarakstu.
const validateForm = (values) => {
  const errors = {}

  if (!values.clientName.trim() || values.clientName.trim().length < 2) {
    errors.clientName = 'Ievadiet vārdu un uzvārdu (min. 2 simboli).'
  }

  if (!/^\+371\d{8}$/.test(values.phone)) {
    errors.phone = 'Tālruņa numuram jābūt formātā +371xxxxxxxx.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Ievadiet derīgu e-pasta adresi.'
  }

  if (!values.address.trim()) {
    errors.address = 'Ievadiet objekta adresi.'
  }

  if (!values.category) {
    errors.category = 'Izvēlieties remonta kategoriju.'
  }

  const budgetValue = Number(values.budget)
  if (!values.budget || Number.isNaN(budgetValue)) {
    errors.budget = 'Norādiet budžetu.'
  } else if (budgetValue < 500 || budgetValue > 10000) {
    errors.budget = 'Budžetam jābūt robežās 500-10000.'
  }

  if (!values.desiredDate) {
    errors.desiredDate = 'Norādiet vēlamo termiņu.'
  } else {
    const desired = new Date(values.desiredDate)
    const minDate = new Date()
    minDate.setDate(minDate.getDate() + 7)
    minDate.setHours(0, 0, 0, 0)
    if (desired < minDate) {
      errors.desiredDate = 'Termiņš nevar būt ātrāk kā pēc 7 dienām.'
    }
  }

  return errors
}

function NewApplication() {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const isGuest = localStorage.getItem('guestMode') === '1'

  useEffect(() => {
    // Ielādē kategorijas no API.
    const loadCategories = async () => {
      try {
        const response = await fetch(apiUrl('/api/categories'))
        if (!response.ok) {
          throw new Error('Neizdevās ielādēt kategorijas.')
        }
        const data = await response.json()
        setCategories(data)
      } catch (error) {
        setStatus({
          type: 'error',
          message: 'Serveris nav pieejams.',
        })
      } finally {
        setIsLoadingCategories(false)
      }
    }

    loadCategories()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Nosūta pieteikumu uz serveri, ja validācija ir veiksmīga.
  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isGuest) {
      setStatus({
        type: 'error',
        message: 'Lai izveidotu pieteikumu, nepieciešams ielogoties.',
      })
      return
    }
    const validationErrors = validateForm(form)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      setStatus({ type: 'error', message: 'Lūdzu, izlabojiet kļūdas formā.' })
      return
    }

    setIsSubmitting(true)
    setStatus(null)

    try {
      const response = await fetch(apiUrl('/api/applications'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

      setForm(emptyForm)
      setErrors({})
      setStatus({
        type: 'success',
        message: 'Pieteikums saglabāts veiksmīgi.',
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Kļūda saglabājot pieteikumu.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="flex justify-center">
      <div className="w-full max-w-xl rounded-[10px] bg-white p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-[#1f2937]">
          Jauns remontdarbu pieteikums
        </h2>

        {isGuest && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Lai izveidotu pieteikumu, nepieciešams ielogoties.
            <button
              type="button"
              className="ml-2 font-semibold underline"
              onClick={() => {
                localStorage.removeItem('guestMode')
                window.location.reload()
              }}
            >
              Ielogoties
            </button>
          </div>
        )}

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-[#374151]">
              Klienta vārds, uzvārds
            </label>
            <input
              name="clientName"
              value={form.clientName}
              onChange={handleChange}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#1f3b64]"
              placeholder="Anna Bērziņa"
            />
            {errors.clientName && (
              <p className="text-xs text-red-600">{errors.clientName}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-[#374151]">
                Tālrunis
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#1f3b64]"
                placeholder="+37120000000"
              />
              {errors.phone && (
                <p className="text-xs text-red-600">{errors.phone}</p>
              )}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-[#374151]">
                E-pasts
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#1f3b64]"
                placeholder="anna@example.com"
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[#374151]">
              Objekta adrese
            </label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#1f3b64]"
              placeholder="Brīvības iela 12, Rīga"
            />
            {errors.address && (
              <p className="text-xs text-red-600">{errors.address}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-[#374151]">
                Remonta kategorija
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#1f3b64]"
                disabled={isLoadingCategories}
              >
                <option value="">
                  {isLoadingCategories
                    ? 'Ielādē kategorijas...'
                    : 'Izvēlieties kategoriju'}
                </option>
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

            <div className="grid gap-2">
              <label className="text-sm font-medium text-[#374151]">
                Budžets (EUR)
              </label>
              <input
                name="budget"
                value={form.budget}
                onChange={handleChange}
                type="number"
                min="500"
                max="10000"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#1f3b64]"
                placeholder="2500"
              />
              {errors.budget && (
                <p className="text-xs text-red-600">{errors.budget}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[#374151]">
              Vēlamais termiņš
            </label>
            <input
              name="desiredDate"
              value={form.desiredDate}
              onChange={handleChange}
              type="date"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#1f3b64]"
            />
            {errors.desiredDate && (
              <p className="text-xs text-red-600">{errors.desiredDate}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[45px] w-full rounded-md bg-[#1f3b64] text-sm font-semibold text-white transition hover:bg-[#2b4a7a] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSubmitting ? 'Saglabā...' : 'Saglabāt pieteikumu'}
          </button>
        </form>

        {status && (
          <div
            className={`mt-4 rounded-md border px-4 py-2 text-sm ${
              status.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {status.message}
          </div>
        )}
      </div>
    </section>
  )
}

export default NewApplication
