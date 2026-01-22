import express from 'express'
import cors from 'cors'
import { query } from './db.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

// Veselibas parbaude.
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Publiska kategoriju nolasissana.
app.get('/api/categories', async (_req, res) => {
  try {
    const result = await query('SELECT * FROM list_categories()')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories.' })
  }
})

// Lietotaja registracija (viewer).
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing required fields.' })
  }

  try {
    const result = await query('SELECT create_user($1, $2, $3) AS ok', [
      username,
      password,
      'viewer',
    ])
    res.status(201).json({ success: result.rows[0]?.ok === true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user.' })
  }
})

// Lietotaja pieslegsanas un sesijas izveide.
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials.' })
  }

  try {
    const result = await query('SELECT * FROM login_user($1, $2)', [
      username,
      password,
    ])
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' })
    }
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to login.' })
  }
})

// Jauna pieteikuma izveide.
app.post('/api/applications', async (req, res) => {
  const { clientName, phone, email, address, category, budget, desiredDate } =
    req.body

  const phoneRegex = /^\+371\d{8}$/
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const budgetValue = Number(budget)
  const desiredDateValue = new Date(desiredDate)
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 7)
  minDate.setHours(0, 0, 0, 0)

  if (
    !clientName ||
    !phone ||
    !email ||
    !address ||
    !category ||
    !budget ||
    !desiredDate
  ) {
    return res.status(400).json({ error: 'Missing required fields.' })
  }

  if (clientName.trim().length < 2) {
    return res.status(400).json({ error: 'Invalid name.' })
  }

  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone format.' })
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' })
  }

  if (Number.isNaN(budgetValue) || budgetValue < 500 || budgetValue > 10000) {
    return res.status(400).json({ error: 'Invalid budget.' })
  }

  if (Number.isNaN(desiredDateValue.getTime()) || desiredDateValue < minDate) {
    return res.status(400).json({ error: 'Invalid desired date.' })
  }

  try {
    // Use stored functions only; the API never touches tables directly.
    const result = await query(
      'SELECT create_application($1, $2, $3, $4, $5, $6, $7) AS id',
      [clientName, phone, email, address, category, budgetValue, desiredDate],
    )
    res.status(201).json({ id: result.rows[0].id })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create application.' })
  }
})

// Pieteikuma atjaunosana (admin/manager).
app.put('/api/applications/:id', async (req, res) => {
  const {
    sessionToken,
    clientName,
    phone,
    email,
    address,
    category,
    budget,
    desiredDate,
  } = req.body

  const phoneRegex = /^\+371\d{8}$/
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const budgetValue = Number(budget)
  const desiredDateValue = new Date(desiredDate)
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 7)
  minDate.setHours(0, 0, 0, 0)

  if (
    !sessionToken ||
    !clientName ||
    !phone ||
    !email ||
    !address ||
    !category ||
    !budget ||
    !desiredDate
  ) {
    return res.status(400).json({ error: 'Missing required fields.' })
  }

  if (clientName.trim().length < 2) {
    return res.status(400).json({ error: 'Invalid name.' })
  }

  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone format.' })
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' })
  }

  if (Number.isNaN(budgetValue) || budgetValue < 500 || budgetValue > 10000) {
    return res.status(400).json({ error: 'Invalid budget.' })
  }

  if (Number.isNaN(desiredDateValue.getTime()) || desiredDateValue < minDate) {
    return res.status(400).json({ error: 'Invalid desired date.' })
  }

  try {
    const result = await query(
      'SELECT update_application($1, $2, $3, $4, $5, $6, $7, $8, $9) AS ok',
      [
        sessionToken,
        req.params.id,
        clientName,
        phone,
        email,
        address,
        category,
        budgetValue,
        desiredDate,
      ],
    )

    if (!result.rows[0]?.ok) {
      return res.status(404).json({ error: 'Not found.' })
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application.' })
  }
})

// Publisks apstiprinato pieteikumu saraksts.
app.get('/api/applications', async (_req, res) => {
  try {
    const result = await query('SELECT * FROM list_applications()')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications.' })
  }
})

// Publiskas pieteikuma detalas (apstiprinatam).
app.get('/api/applications/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM get_application($1)', [
      req.params.id,
    ])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found.' })
    }
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch application.' })
  }
})

// Admina pieteikuma detalas.
app.post('/api/admin/applications/:id', async (req, res) => {
  const { sessionToken } = req.body
  if (!sessionToken) {
    return res.status(400).json({ error: 'Missing session token.' })
  }

  try {
    const result = await query('SELECT * FROM get_application_admin($1, $2)', [
      sessionToken,
      req.params.id,
    ])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found.' })
    }
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch application.' })
  }
})

// Admina pieteikumu saraksts.
app.post('/api/admin/applications', async (req, res) => {
  const { sessionToken } = req.body
  if (!sessionToken) {
    return res.status(400).json({ error: 'Missing session token.' })
  }

  try {
    const result = await query('SELECT * FROM list_applications_admin($1)', [
      sessionToken,
    ])
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin applications.' })
  }
})

// Admina kategorijas izveide.
app.post('/api/admin/categories', async (req, res) => {
  const { sessionToken, name } = req.body
  if (!sessionToken || !name) {
    return res.status(400).json({ error: 'Missing required fields.' })
  }

  try {
    const result = await query('SELECT create_category($1, $2) AS ok', [
      sessionToken,
      name,
    ])
    res.json({ success: result.rows[0]?.ok === true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category.' })
  }
})

// Admina kategorijas atjaunosana.
app.patch('/api/admin/categories/:id', async (req, res) => {
  const { sessionToken, name } = req.body
  if (!sessionToken || !name) {
    return res.status(400).json({ error: 'Missing required fields.' })
  }

  try {
    const result = await query('SELECT update_category($1, $2, $3) AS ok', [
      sessionToken,
      req.params.id,
      name,
    ])
    res.json({ success: result.rows[0]?.ok === true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category.' })
  }
})

// Admina kategorijas dzesana.
app.delete('/api/admin/categories/:id', async (req, res) => {
  const { sessionToken } = req.body
  if (!sessionToken) {
    return res.status(400).json({ error: 'Missing session token.' })
  }

  try {
    const result = await query('SELECT delete_category($1, $2) AS ok', [
      sessionToken,
      req.params.id,
    ])
    res.json({ success: result.rows[0]?.ok === true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category.' })
  }
})

// Pieteikuma apstiprinasana.
app.post('/api/admin/applications/:id/confirm', async (req, res) => {
  const { sessionToken } = req.body
  if (!sessionToken) {
    return res.status(400).json({ error: 'Missing session token.' })
  }

  try {
    const result = await query('SELECT confirm_application($1, $2) AS ok', [
      sessionToken,
      req.params.id,
    ])
    res.json({ success: result.rows[0]?.ok === true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm application.' })
  }
})

// Pieteikuma dzesana.
app.post('/api/admin/applications/:id/delete', async (req, res) => {
  const { sessionToken } = req.body
  if (!sessionToken) {
    return res.status(400).json({ error: 'Missing session token.' })
  }

  try {
    const result = await query('SELECT delete_application($1, $2) AS ok', [
      sessionToken,
      req.params.id,
    ])
    res.json({ success: result.rows[0]?.ok === true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete application.' })
  }
})

// Admina lietotaja izveide.
app.post('/api/admin/users', async (req, res) => {
  const { sessionToken, username, password, role } = req.body
  if (!sessionToken || !username || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields.' })
  }

  try {
    const result = await query('SELECT create_user_admin($1, $2, $3, $4) AS ok', [
      sessionToken,
      username,
      password,
      role,
    ])
    res.status(201).json({ success: result.rows[0]?.ok === true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user.' })
  }
})

// Admina lietotaju saraksts.
app.post('/api/admin/users/list', async (req, res) => {
  const { sessionToken } = req.body
  if (!sessionToken) {
    return res.status(400).json({ error: 'Missing session token.' })
  }

  try {
    const result = await query('SELECT * FROM list_users_admin($1)', [
      sessionToken,
    ])
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users.' })
  }
})

// Admina lietotaja atjaunosana.
app.patch('/api/admin/users/:id', async (req, res) => {
  const { sessionToken, newPassword, newRole } = req.body
  if (!sessionToken || !newRole) {
    return res.status(400).json({ error: 'Missing required fields.' })
  }

  try {
    if (newPassword && newPassword.trim().length > 0) {
      const result = await query(
        'SELECT update_user_admin($1, $2, $3, $4) AS ok',
        [sessionToken, req.params.id, newPassword, newRole],
      )
      return res.json({ success: result.rows[0]?.ok === true })
    }

    const result = await query(
      'SELECT update_user_role_admin($1, $2, $3) AS ok',
      [sessionToken, req.params.id, newRole],
    )
    res.json({ success: result.rows[0]?.ok === true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user.' })
  }
})

// Admina lietotaja dzesana.
app.delete('/api/admin/users/:id', async (req, res) => {
  const { sessionToken } = req.body
  if (!sessionToken) {
    return res.status(400).json({ error: 'Missing session token.' })
  }

  try {
    const result = await query('SELECT delete_user_admin($1, $2) AS ok', [
      sessionToken,
      req.params.id,
    ])
    res.json({ success: result.rows[0]?.ok === true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user.' })
  }
})

// Admina login (tapat ka parastais).
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials.' })
  }

  try {
    const result = await query('SELECT * FROM login_user($1, $2)', [
      username,
      password,
    ])
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' })
    }
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to login.' })
  }
})

// Sesijas statuss un pagarinasana.
app.post('/api/admin/status', async (req, res) => {
  const { sessionToken } = req.body
  if (!sessionToken) {
    return res.status(400).json({ error: 'Missing session token.' })
  }

  try {
    const result = await query('SELECT * FROM is_user_authenticated($1)', [
      sessionToken,
    ])
    if (result.rows.length === 0) {
      return res.json({ is_authenticated: false })
    }
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate session.' })
  }
})

// Logout un sesijas dzesana.
app.post('/api/admin/logout', async (req, res) => {
  const { sessionToken } = req.body
  if (!sessionToken) {
    return res.status(400).json({ error: 'Missing session token.' })
  }

  try {
    await query('SELECT logout_user($1)', [sessionToken])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to logout.' })
  }
})

// HTTP servera palaisana.
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
