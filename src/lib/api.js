// Bazes URL API pieprasijumiem (nem no env vai localhost).
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

// Paligfunkcija pilna API URL izveidei.
export const apiUrl = (path) => `${API_BASE}${path}`
