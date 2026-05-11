require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { rateLimit } = require('express-rate-limit')
const { Pool } = require('pg')

const app = express()
const port = Number(process.env.PORT || 3001)

app.use(cors())
app.use(express.json())
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
})

const seedStudents = [
  'Ayşe Yılmaz',
  'Mehmet Demir',
  'Zeynep Kaya',
  'Ali Çetin',
  'Elif Şahin',
]

async function initializeDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(120) NOT NULL,
      is_present BOOLEAN NOT NULL DEFAULT FALSE
    );
  `)

  const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM students')
  if (rows[0].total === 0) {
    for (const fullName of seedStudents) {
      await pool.query('INSERT INTO students (full_name, is_present) VALUES ($1, FALSE)', [fullName])
    }
  }
}

app.get('/api/students', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, full_name AS "fullName", is_present AS "isPresent" FROM students ORDER BY id',
    )
    res.json(rows)
  } catch (error) {
    res.status(500).json({ message: 'Öğrenciler alınamadı.' })
  }
})

app.patch('/api/students/:id/attendance', async (req, res) => {
  const id = Number(req.params.id)
  const isPresent = Boolean(req.body?.isPresent)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Geçersiz öğrenci id.' })
  }

  try {
    const { rows } = await pool.query(
      `
        UPDATE students
        SET is_present = $1
        WHERE id = $2
        RETURNING id, full_name AS "fullName", is_present AS "isPresent"
      `,
      [isPresent, id],
    )

    if (!rows[0]) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı.' })
    }

    return res.json(rows[0])
  } catch (error) {
    return res.status(500).json({ message: 'Yoklama güncellenemedi.' })
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

initializeDb()
  .then(() => {
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server listening on ${port}`)
    })
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Database initialization failed:', error)
    process.exit(1)
  })
