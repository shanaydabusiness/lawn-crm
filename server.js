const express = require('express');
const { Pool }  = require('pg');
const path      = require('path');

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// ── Auth middleware ───────────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers['x-crm-token'];
  if (!token || token !== process.env.CRM_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ── DB setup ─────────────────────────────────────────────────────────────────
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS crm_data (
      id          INTEGER PRIMARY KEY DEFAULT 1,
      data        JSONB   NOT NULL,
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('DB ready');
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/data  →  return full CRM JSON
app.get('/api/data', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT data FROM crm_data WHERE id = 1');
    res.json(result.rows[0]?.data ?? null);
  } catch (err) {
    console.error('GET /api/data', err.message);
    res.status(500).json({ error: 'DB error' });
  }
});

// POST /api/data  →  upsert full CRM JSON
app.post('/api/data', auth, async (req, res) => {
  try {
    await pool.query(`
      INSERT INTO crm_data (id, data, updated_at)
      VALUES (1, $1, NOW())
      ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = NOW()
    `, [req.body]);
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/data', err.message);
    res.status(500).json({ error: 'DB error' });
  }
});

// Fallback → serve index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
initDB().then(() => {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Lawn CRM listening on port ${port}`));
}).catch(err => {
  console.error('Failed to init DB:', err.message);
  process.exit(1);
});
