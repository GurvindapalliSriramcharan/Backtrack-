const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'lostandfound.db');

function ensureUploadsExist() {
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
}

function createSampleSVGs() {
  const uploadsDir = path.join(__dirname, 'uploads');
  const samples = [
    {
      name: 'wallet.svg',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="#f8fafc"/><rect x="40" y="80" width="520" height="240" rx="20" fill="#334155"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="36" fill="#f8fafc">Lost Wallet</text></svg>`
    },
    {
      name: 'phone.svg',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="#f1f5f9"/><rect x="220" y="60" width="160" height="280" rx="24" fill="#0f172a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="36" fill="#f8fafc">Lost Phone</text></svg>`
    },
    {
      name: 'keys.svg',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="#eef2ff"/><circle cx="300" cy="200" r="110" fill="#3730a3"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="28" fill="#fff">Set of Keys</text></svg>`
    }
  ];

  for (const s of samples) {
    const fp = path.join(uploadsDir, s.name);
    if (!fs.existsSync(fp)) fs.writeFileSync(fp, s.content, 'utf8');
  }
}

function initDb() {
  ensureUploadsExist();
  createSampleSVGs();

  const db = new sqlite3.Database(DB_PATH);

  db.serialize(() => {
    // Create table with extended schema if not exists
    db.run(`CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT,
      image_path TEXT,
      lost_date TEXT,
      location TEXT,
      category TEXT,
      brand TEXT,
      model_no TEXT,
      colour TEXT,
      identifications TEXT
    )`);

    // Ensure new columns exist (for older DBs) - add if missing
  const requiredCols = ['lost_date','location','category','brand','model_no','colour','identifications','reported_by'];
    db.all("PRAGMA table_info(items)", (err, cols) => {
      if (err) return console.error('PRAGMA error', err);
      const existing = cols.map(c => c.name);
      requiredCols.forEach(col => {
        if (!existing.includes(col)) {
          db.run(`ALTER TABLE items ADD COLUMN ${col} TEXT`, (aErr) => {
            if (aErr) console.error('Failed to add column', col, aErr);
            else console.log('Added missing column', col);
          });
        }
      });
    });

    // Check if table has rows and seed if empty
    db.get('SELECT COUNT(*) as cnt FROM items', (err, row) => {
      if (err) {
        console.error('DB count error', err);
        return;
      }
      if (row && row.cnt === 0) {
  const stmt = db.prepare('INSERT INTO items (name, description, image_path, lost_date, location, category, brand, model_no, colour, identifications, reported_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  stmt.run('Black Wallet', 'Leather wallet lost near cafeteria.', '/uploads/wallet.svg', null, 'Cafeteria', 'wallet', 'Generic', null, 'black', null, null);
  stmt.run('Smartphone', 'Blue smartphone with a cracked screen.', '/uploads/phone.svg', null, 'Library', 'phone', 'Acme', 'X100', 'blue', null, null);
  stmt.run('Keychain', 'Bunch of keys with a red tag.', '/uploads/keys.svg', null, 'Main Gate', 'keys', 'KeyCorp', null, 'silver', null, null);
        stmt.finalize();
        console.log('Seeded database with sample items.');
      }
    });
  });

  return db;
}

module.exports = {
  initDb,
  DB_PATH
};
