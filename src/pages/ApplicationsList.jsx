import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiUrl } from '../lib/api.js'

function ApplicationsList() {
  const [applications, setApplications] = useState([])
  const [status, setStatus] = useState('loading')
  const isGuest = localStorage.getItem('guestMode') === '1'

  useEffect(() => {
    // Ielādē publiski redzamos (apstiprinātos) pieteikumus.
    const loadApplications = async () => {
      try {
        const response = await fetch(apiUrl('/api/applications'))
        if (!response.ok) {
          throw new Error('Neizdevās ielādēt pieteikumus.')
        }
        const data = await response.json()
        setApplications(data)
        setStatus('ready')
      } catch (error) {
        setStatus('error')
      }
    }

    loadApplications()
  }, [])

  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-[#1f2937]">
          Pieteikumu saraksts
        </h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Šeit redzami visi sistēmā saglabātie pieteikumi.
          </p>
          {isGuest ? (
            <button
              type="button"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
              onClick={() => {
                // Pārslēdzas no viesu režīma uz login.
                localStorage.removeItem('guestMode')
                window.location.reload()
              }}
            >
              Ielogoties, lai izveidotu pieteikumu
            </button>
          ) : (
            <Link
              to="/"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              Atpakaļ uz jaunu pieteikumu
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[10px] bg-white shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-100 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Klients</th>
                <th className="px-4 py-3">Telefons</th>
                <th className="px-4 py-3">E-pasts</th>
                <th className="px-4 py-3">Adrese</th>
                <th className="px-4 py-3">Kategorija</th>
                <th className="px-4 py-3">Budžets (EUR)</th>
                <th className="px-4 py-3">Termiņš</th>
                <th className="px-4 py-3">Detaļas</th>
              </tr>
            </thead>
            <tbody>
              {status === 'loading' && (
                <tr>
                  <td className="px-4 py-4 text-gray-500" colSpan="8">
                    Ielādē pieteikumus...
                  </td>
                </tr>
              )}
              {status === 'error' && (
                <tr>
                  <td className="px-4 py-4 text-red-600" colSpan="8">
                    Neizdevās ielādēt pieteikumus.
                  </td>
                </tr>
              )}
              {status === 'ready' && applications.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-gray-500" colSpan="8">
                    Nav saglabātu pieteikumu.
                  </td>
                </tr>
              )}
              {status === 'ready' &&
                applications.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.client_name}
                    </td>
                    <td className="px-4 py-3">{item.phone}</td>
                    <td className="px-4 py-3">{item.email}</td>
                    <td className="px-4 py-3">{item.address}</td>
                    <td className="px-4 py-3">{item.category}</td>
                    <td className="px-4 py-3">
                      {Number(item.budget).toFixed(0)}
                    </td>
                    <td className="px-4 py-3">{item.desired_date || '—'}</td>
                    <td className="px-4 py-3">
                      <Link
                        className="rounded-md bg-[#1f3b64] px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#2b4a7a]"
                        to={`/applications/${item.id}`}
                      >
                        Skatīt
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default ApplicationsList
