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
