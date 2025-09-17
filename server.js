const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// статика для тестовой страницы
app.use(express.static(path.join(__dirname, 'public')));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2,8) + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('only images allowed'));
  }
});

const dataFile = path.join(__dirname, 'data.json');
const readAll = () => { try { return JSON.parse(fs.readFileSync(dataFile, 'utf8')); } catch { return []; } };
const writeAll = (rows) => fs.writeFileSync(dataFile, JSON.stringify(rows, null, 2));

app.get('/healthz', (_, res) => res.send('ok'));

app.post('/api/upload', upload.single('photo'), (req, res) => {
  const all = readAll();
  const rec = {
    id: Date.now(),
    name: req.body?.name || null,
    file: req.file ? {
      original: req.file.originalname,
      stored: req.file.filename,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    } : null,
    createdAt: new Date().toISOString()
  };
  all.push(rec);
  writeAll(all);
  res.json({ ok: true, record: rec });
});

app.get('/api/list', (_, res) => res.json(readAll()));
app.use('/uploads', express.static(uploadDir));

app.listen(process.env.PORT || 3000, () => {
  console.log('listening on', process.env.PORT || 3000);
});
