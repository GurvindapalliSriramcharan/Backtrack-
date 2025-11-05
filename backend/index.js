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
      reported_by
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
      reported_by: reported_by !== undefined ? reported_by : row.reported_by
    };

    // If a new image was uploaded and there was an old image, try to remove old file
    if (file && row.image_path) {
      const oldFp = path.join(__dirname, row.image_path);
      fs.unlink(oldFp, (uErr) => {
        if (uErr && uErr.code !== 'ENOENT') console.error('Failed to remove old image', oldFp, uErr);
      });
    }

    db.run(
      `UPDATE items SET name = ?, description = ?, image_path = ?, lost_date = ?, location = ?, category = ?, brand = ?, model_no = ?, colour = ?, identifications = ?, reported_by = ? WHERE id = ?`,
      [updated.name, updated.description, updated.image_path, updated.lost_date, updated.location, updated.category, updated.brand, updated.model_no, updated.colour, updated.identifications, updated.reported_by, id],
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
    reported_by
  } = req.body;
  const file = req.file;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  const image_path = file ? '/uploads/' + path.basename(file.path) : null;

  db.run(
    `INSERT INTO items (name, description, image_path, lost_date, location, category, brand, model_no, colour, identifications, reported_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, description || null, image_path, lost_date || null, loc || null, category || null, brand || null, model_no || null, colour || null, identifications || null, reported_by || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const insertedId = this.lastID;
      db.get('SELECT * FROM items WHERE id = ?', [insertedId], (err2, row) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json(row);
      });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Lost & Found backend running on http://localhost:${PORT}`);
});
