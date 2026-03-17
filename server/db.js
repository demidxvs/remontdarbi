/*
Projekta nosaukums: Remontdarbi
Autors: Artjoms Demidovs
Versija: 1.0
Izveides datums: 2026. gada 7. janvāris
Pēdējo izmaiņu datums: 2026. gada 17. marts
Mērķauditorija: Klienti, administratori un sistēmas lietotāji
Projekta mērķis: Nodrošināt remontdarbu pieteikumu iesniegšanu un pārvaldību tīmekļa vidē
Atsauksme uz resursiem: Izmantoti mācību materiāli, Vite, React, Tailwind CSS, Express un PostgreSQL dokumentācija
Faila apraksts: Savienojuma izveide ar PostgreSQL datubāzi
*/
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

// Savienojums ar PostgreSQL, izmantojot DATABASE_URL.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Vienota piekluve DB vaicajumiem.
export const query = (text, params) => pool.query(text, params)
