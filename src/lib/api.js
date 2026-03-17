/*
Projekta nosaukums: Remontdarbi
Autors: Artjoms Demidovs
Versija: 1.0
Izveides datums: 2026. gada 7. janvāris
Pēdējo izmaiņu datums: 2026. gada 17. marts
Mērķauditorija: Klienti, administratori un sistēmas lietotāji
Projekta mērķis: Nodrošināt remontdarbu pieteikumu iesniegšanu un pārvaldību tīmekļa vidē
Atsauksme uz resursiem: Izmantoti mācību materiāli, Vite, React, Tailwind CSS, Express un PostgreSQL dokumentācija
Faila apraksts: Palīgfunkcijas API adrešu veidošanai
*/
// Bazes URL API pieprasijumiem (izstrade izmanto lokalo serveri, produkcija to pasu domenu).
export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.DEV ? 'http://localhost:4000' : '')

// Paligfunkcija pilna API URL izveidei.
export const apiUrl = (path) => `${API_BASE}${path}`
