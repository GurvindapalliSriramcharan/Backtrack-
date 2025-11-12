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
      identifications TEXT,
      reported_by TEXT,
      claimed_by TEXT,
      claimed_at TEXT,
      is_admin_item TEXT,
      status TEXT DEFAULT 'available',
      resale_price TEXT,
      resale_date TEXT,
      created_at TEXT
    )`);

    // Ensure new columns exist (for older DBs) - add if missing
  const requiredCols = ['lost_date','location','category','brand','model_no','colour','identifications','reported_by','claimed_by','claimed_at','is_admin_item','status','resale_price','resale_date','created_at'];
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

    // Create claims table for student claim requests
    db.run(`CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER,
      student TEXT,
      message TEXT,
      status TEXT DEFAULT 'pending',
      admin TEXT,
      decision_note TEXT,
      created_at TEXT,
      updated_at TEXT
    )`);

    // Create notifications table
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      message TEXT,
      type TEXT,
      payload TEXT,
      read INTEGER DEFAULT 0,
      created_at TEXT
    )`);

    // Create security contacts table
    db.run(`CREATE TABLE IF NOT EXISTS security_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      designation TEXT,
      location TEXT,
      phone TEXT,
      created_at TEXT
    )`);

    // Check if table has rows and seed if empty
    db.get('SELECT COUNT(*) as cnt FROM items', (err, row) => {
      if (err) {
        console.error('DB count error', err);
        return;
      }
      if (row && row.cnt === 0) {
  const stmt = db.prepare('INSERT INTO items (name, description, image_path, lost_date, location, category, brand, model_no, colour, identifications, reported_by, is_admin_item, status, resale_price, resale_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const now = new Date().toISOString();
  stmt.run('Black Wallet', 'Leather wallet lost near cafeteria.', '/uploads/wallet.svg', null, 'Cafeteria', 'wallet', 'Generic', null, 'black', null, null, null, 'available', null, null, now);
  stmt.run('Smartphone', 'Blue smartphone with a cracked screen.', '/uploads/phone.svg', null, 'Library', 'phone', 'Acme', 'X100', 'blue', null, null, null, 'available', null, null, now);
  stmt.run('Keychain', 'Bunch of keys with a red tag.', '/uploads/keys.svg', null, 'Main Gate', 'keys', 'KeyCorp', null, 'silver', null, null, 'available', null, null, now);
  stmt.run('Gold Watch', 'Elegant gold watch.', '/uploads/keys.svg', null, 'Cafeteria', 'watch', 'Generic', null, 'gold', null, null, null, 'available', null, null, now);
  stmt.run('Headphones', 'Wireless headphones.', '/uploads/keys.svg', null, 'Library', 'headphones and headset', 'Sony', null, 'black', null, null, null, 'available', null, null, now);
  stmt.run('Charger', 'Phone charger cable.', '/uploads/keys.svg', null, 'Main Gate', 'charger', 'Generic', null, 'white', null, null, null, 'available', null, null, now);
  stmt.run('Water Bottle', 'Blue water bottle.', '/uploads/keys.svg', null, 'Cafeteria', 'bottle', 'Generic', null, 'blue', null, null, null, 'available', null, null, now);
  stmt.run('Calculator', 'Scientific calculator.', '/uploads/keys.svg', null, 'Library', 'calculator', 'Casio', null, 'black', null, null, null, 'available', null, null, now);
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
