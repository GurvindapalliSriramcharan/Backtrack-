const express = require('express');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const { initDb, DB_PATH } = require('./database');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Ensure DB and uploads are ready
const db = initDb();

// Static serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, unique + '-' + safeName);
  }
});
const upload = multer({ storage });

// Routes
app.get('/api/items', (req, res) => {
  db.all('SELECT * FROM items ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/items/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM items WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});

// Delete an item by id (and remove uploaded image file if present)
app.delete('/api/items/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM items WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });

    // remove file if exists
    if (row.image_path) {
      const fp = path.join(__dirname, row.image_path);
      fs.unlink(fp, (unlinkErr) => {
        // ignore unlink errors, continue to delete DB record
        if (unlinkErr && unlinkErr.code !== 'ENOENT') console.error('Failed to remove file', fp, unlinkErr);

        db.run('DELETE FROM items WHERE id = ?', [id], function (delErr) {
          if (delErr) return res.status(500).json({ error: delErr.message });
          res.json({ success: true });
        });
      });
    } else {
      db.run('DELETE FROM items WHERE id = ?', [id], function (delErr) {
        if (delErr) return res.status(500).json({ error: delErr.message });
        res.json({ success: true });
      });
    }
  });
});

// Update an item (accepts multipart form-data including optional new image)
app.put('/api/items/:id', upload.single('image'), (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM items WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });

    const file = req.file;
    const image_path = file ? '/uploads/' + path.basename(file.path) : row.image_path;

    // fields from body
    const {
      name,
      description,
      lost_date,
      location: loc,
      category,
      brand,
      model_no,
      colour,
      identifications,
      reported_by,
      is_admin_item
    } = req.body;

    const updated = {
      name: name !== undefined ? name : row.name,
      description: description !== undefined ? description : row.description,
      image_path,
      lost_date: lost_date !== undefined ? lost_date : row.lost_date,
      location: loc !== undefined ? loc : row.location,
      category: category !== undefined ? category : row.category,
      brand: brand !== undefined ? brand : row.brand,
      model_no: model_no !== undefined ? model_no : row.model_no,
      colour: colour !== undefined ? colour : row.colour,
      identifications: identifications !== undefined ? identifications : row.identifications,
      reported_by: reported_by !== undefined ? reported_by : row.reported_by,
      is_admin_item: is_admin_item !== undefined ? is_admin_item : row.is_admin_item,
      status: row.status || 'available',
      resale_price: row.resale_price,
      resale_date: row.resale_date,
      created_at: row.created_at
    };

  console.log('Updating item', id, 'with', updated, 'fileUploaded=', !!file);

    // If a new image was uploaded and there was an old image, try to remove old file
    if (file && row.image_path) {
      const oldFp = path.join(__dirname, row.image_path);
      fs.unlink(oldFp, (uErr) => {
        if (uErr && uErr.code !== 'ENOENT') console.error('Failed to remove old image', oldFp, uErr);
      });
    }

    db.run(
      `UPDATE items SET name = ?, description = ?, image_path = ?, lost_date = ?, location = ?, category = ?, brand = ?, model_no = ?, colour = ?, identifications = ?, reported_by = ?, is_admin_item = ?, status = ?, resale_price = ?, resale_date = ?, created_at = ? WHERE id = ?`,
      [updated.name, updated.description, updated.image_path, updated.lost_date, updated.location, updated.category, updated.brand, updated.model_no, updated.colour, updated.identifications, updated.reported_by, updated.is_admin_item, updated.status, updated.resale_price, updated.resale_date, updated.created_at, id],
      function (uErr) {
        if (uErr) return res.status(500).json({ error: uErr.message });
        db.get('SELECT * FROM items WHERE id = ?', [id], (err2, newRow) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json(newRow);
        });
      }
    );
  });
});

app.post('/api/items', upload.single('image'), (req, res) => {
  // accept extended fields; image is optional now
  const {
    name,
    description,
    lost_date,
    location: loc,
    category,
    brand,
    model_no,
    colour,
    identifications,
    reported_by,
    is_admin_item
  } = req.body;
  const file = req.file;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  const image_path = file ? '/uploads/' + path.basename(file.path) : null;

  const created_at = nowIso();

  db.run(
    `INSERT INTO items (name, description, image_path, lost_date, location, category, brand, model_no, colour, identifications, reported_by, is_admin_item, status, resale_price, resale_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, description || null, image_path, lost_date || null, loc || null, category || null, brand || null, model_no || null, colour || null, identifications || null, reported_by || null, is_admin_item ? is_admin_item : null, 'available', null, null, created_at],
    function (err) {
      console.log('Insert item:', { name, reported_by, is_admin_item, created_at });
      if (err) return res.status(500).json({ error: err.message });
      const insertedId = this.lastID;
      db.get('SELECT * FROM items WHERE id = ?', [insertedId], (err2, row) => {
        if (err2) return res.status(500).json({ error: err2.message });

        // If this was reported by a student, server-side create match notifications
        (async () => {
          try {
            if (reported_by) {
              // reuse match-suggestions style matching (case-insensitive LIKE)
              const safeValue = v => (v ? v.toString().replace(/%/g, '').trim() : null);
              const likeName = safeValue(name) ? '%' + safeValue(name) + '%' : null;
              const catLike = safeValue(category) ? '%' + safeValue(category) + '%' : null;
              const brandLike = safeValue(brand) ? '%' + safeValue(brand) + '%' : null;
              const colourLike = safeValue(colour) ? '%' + safeValue(colour) + '%' : null;
              const locLike = safeValue(loc) ? '%' + safeValue(loc) + '%' : null;

              const sql = `SELECT * FROM items WHERE (claimed_by IS NULL OR claimed_by='') AND (reported_by IS NULL OR reported_by='') AND (
                lower(category) LIKE lower(?) OR lower(brand) LIKE lower(?) OR lower(colour) LIKE lower(?) OR lower(name) LIKE lower(?) OR lower(location) LIKE lower(?)
              ) ORDER BY id DESC LIMIT 20`;
              const params = [catLike || '', brandLike || '', colourLike || '', likeName || '', locLike || ''];
              db.all(sql, params, (mErr, matches) => {
                if (mErr) return console.error('match lookup failed', mErr);
                try {
                  const created_at2 = nowIso();
                  const matchedIds = [];
                  for (const m of matches || []) {
                    matchedIds.push(m.id);
                    const msg = `Match found: ${m.name} (${m.location || 'unknown location'})`;
                    db.run('INSERT INTO notifications (username, message, type, payload, created_at) VALUES (?, ?, ?, ?, ?)', [reported_by, msg, 'match', JSON.stringify({ item_id: m.id }), created_at2], function (nErr) {
                      if (nErr) console.error('Failed to insert notification', nErr);
                    });
                  }
                  // attach match_count to response row for client feedback
                  const out = Object.assign({}, row, { match_count: (matches || []).length, matched_ids: matchedIds });
                  return res.json(out);
                } catch (e) {
                  console.error('Failed creating notifications', e);
                  return res.json(Object.assign({}, row, { match_count: 0, matched_ids: [] }));
                }
              });
            } else {
              // no reporter (admin-added), return row immediately
              return res.json(Object.assign({}, row, { match_count: 0, matched_ids: [] }));
            }
          } catch (e) {
            console.error('Post-insert match processing failed', e);
            return res.json(Object.assign({}, row, { match_count: 0, matched_ids: [] }));
          }
        })();
      });
    }
  );
});

// Helper for timestamps
function nowIso() {
  return new Date().toISOString();
}

// Return matching items for a newly reported lost item (simple heuristic)
app.post('/api/match-suggestions', (req, res) => {
  const { name, category, brand, colour, location } = req.body || {};
  // Build case-insensitive LIKE patterns so small differences in case/spacing don't prevent matches
  const safeValue = v => (v ? v.toString().replace(/%/g, '').trim() : null);
  const likeName = safeValue(name) ? '%' + safeValue(name) + '%' : null;
  const catLike = safeValue(category) ? '%' + safeValue(category) + '%' : null;
  const brandLike = safeValue(brand) ? '%' + safeValue(brand) + '%' : null;
  const colourLike = safeValue(colour) ? '%' + safeValue(colour) + '%' : null;
  const locLike = safeValue(location) ? '%' + safeValue(location) + '%' : null;

  console.log('match-suggestions criteria', { name, category, brand, colour, location });

  const sql = `SELECT * FROM items WHERE (claimed_by IS NULL OR claimed_by='') AND (reported_by IS NULL OR reported_by='') AND (
    lower(category) LIKE lower(?) OR lower(brand) LIKE lower(?) OR lower(colour) LIKE lower(?) OR lower(name) LIKE lower(?) OR lower(location) LIKE lower(?)
  ) ORDER BY id DESC LIMIT 20`;

  const params = [catLike || '', brandLike || '', colourLike || '', likeName || '', locLike || ''];
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    console.log('match-suggestions found', (rows || []).length, 'rows', 'params=', params);
    res.json(rows || []);
  });
});

// Create a claim request by a student for an item
app.post('/api/claims', (req, res) => {
  const { item_id, student, message } = req.body || {};
  if (!item_id || !student) return res.status(400).json({ error: 'item_id and student are required' });
  const created_at = nowIso();
  db.run(`INSERT INTO claims (item_id, student, message, status, created_at) VALUES (?, ?, ?, 'pending', ?)`, [item_id, student, message || null, created_at], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    const claimId = this.lastID;
    // notify admin
    const notifMsg = `New claim request by ${student} for item #${item_id}`;
    db.run(`INSERT INTO notifications (username, message, type, payload, created_at) VALUES (?, ?, ?, ?, ?)`, ['admin', notifMsg, 'claim_request', JSON.stringify({ claim_id: claimId, item_id }), created_at], () => {});
    db.get('SELECT * FROM claims WHERE id = ?', [claimId], (e2, row) => {
      if (e2) return res.status(500).json({ error: e2.message });
      res.json(row);
    });
  });
});

// Get claims (admin view) - optional ?status filter
app.get('/api/claims', (req, res) => {
  const status = req.query.status;
  let sql = `SELECT c.*, i.name as item_name, i.image_path as item_image FROM claims c LEFT JOIN items i ON c.item_id = i.id`;
  const params = [];
  if (status) { sql += ' WHERE c.status = ?'; params.push(status); }
  sql += ' ORDER BY c.created_at DESC';
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// Admin decision on a claim: accept or reject
app.post('/api/claims/:id/decision', (req, res) => {
  const id = req.params.id;
  const { action, admin, note } = req.body || {};
  if (!action || (action !== 'accept' && action !== 'reject')) return res.status(400).json({ error: 'action must be accept or reject' });

  db.get('SELECT * FROM claims WHERE id = ?', [id], (err, claim) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!claim) return res.status(404).json({ error: 'claim not found' });

    const updated_at = nowIso();
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    db.run('UPDATE claims SET status = ?, admin = ?, decision_note = ?, updated_at = ? WHERE id = ?', [newStatus, admin || null, note || null, updated_at, id], function (uErr) {
      if (uErr) return res.status(500).json({ error: uErr.message });

      // If accepted, mark item as claimed
      if (action === 'accept') {
        db.run('UPDATE items SET claimed_by = ?, claimed_at = ? WHERE id = ?', [claim.student, updated_at, claim.item_id], () => {});
      }

      // notify the student
      const notifMsg = action === 'accept' ? `Your claim for item #${claim.item_id} was accepted. Collect ur claim at security officer.` : `Your claim for item #${claim.item_id} was rejected.`;
      db.run('INSERT INTO notifications (username, message, type, payload, created_at) VALUES (?, ?, ?, ?, ?)', [claim.student, notifMsg, action === 'accept' ? 'claim_accepted' : 'claim_rejected', JSON.stringify({ claim_id: id, item_id: claim.item_id }), nowIso()], () => {});

      db.get('SELECT * FROM claims WHERE id = ?', [id], (e2, row) => {
        if (e2) return res.status(500).json({ error: e2.message });
        res.json(row);
      });
    });
  });
});

// Notifications endpoints
app.get('/api/notifications', (req, res) => {
  const user = req.query.user;
  if (!user) return res.status(400).json({ error: 'user query param required' });
  db.all('SELECT * FROM notifications WHERE username = ? ORDER BY created_at DESC', [user], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/notifications', (req, res) => {
  const { username, message, type, payload } = req.body || {};
  console.log('create-notification', { username, message, type, payload });
  if (!username || !message) return res.status(400).json({ error: 'username and message required' });
  const created_at = nowIso();
  db.run('INSERT INTO notifications (username, message, type, payload, created_at) VALUES (?, ?, ?, ?, ?)', [username, message, type || 'info', payload ? JSON.stringify(payload) : null, created_at], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM notifications WHERE id = ?', [this.lastID], (e2, row) => {
      if (e2) return res.status(500).json({ error: e2.message });
      res.json(row);
    });
  });
});

app.post('/api/items/:id/move-to-resale', (req, res) => {
  const id = req.params.id;
  const { price } = req.body || {};
  if (!price || isNaN(price)) return res.status(400).json({ error: 'valid price required' });

  db.get('SELECT * FROM items WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'item not found' });
  // Treat missing/null status as available (older rows may have null)
  if (row.status && row.status !== 'available') return res.status(400).json({ error: 'item not available for resale' });

    const resale_date = nowIso();
  console.log('Move to resale', { id, price, resale_date });
    db.run('UPDATE items SET status = ?, resale_price = ?, resale_date = ? WHERE id = ?', ['resale', price, resale_date, id], function (uErr) {
      if (uErr) return res.status(500).json({ error: uErr.message });
      db.get('SELECT * FROM items WHERE id = ?', [id], (e2, newRow) => {
        if (e2) return res.status(500).json({ error: e2.message });
        res.json(newRow);
      });
    });
  });
});

// Security contacts endpoints
app.get('/api/security', (req, res) => {
  db.all('SELECT * FROM security_contacts ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/security', (req, res) => {
  const { name, designation, location: loc, phone } = req.body || {};
  if (!name || !phone) return res.status(400).json({ error: 'name and phone required' });
  const created_at = nowIso();
  db.run('INSERT INTO security_contacts (name, designation, location, phone, created_at) VALUES (?, ?, ?, ?, ?)', [name, designation || null, loc || null, phone, created_at], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM security_contacts WHERE id = ?', [this.lastID], (e2, row) => {
      if (e2) return res.status(500).json({ error: e2.message });
      res.json(row);
    });
  });
});

app.delete('/api/security/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM security_contacts WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Backtrack backend running on http://localhost:${PORT}`);
});
