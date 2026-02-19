const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Ensure directories exist
const DATA_DIR = './data';
const UPLOADS_DIR = './uploads';
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Database files
const PHOTOS_DB = path.join(DATA_DIR, 'photos.json');
const COMMENTS_DB = path.join(DATA_DIR, 'comments.json');
const UPDATES_DB = path.join(DATA_DIR, 'updates.json');

// Initialize databases
function initDB(file, defaultData = []) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// File storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Routes

// Get all photos
app.get('/api/photos', (req, res) => {
  const photos = initDB(PHOTOS_DB);
  res.json(photos.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

// Upload photo
app.post('/api/photos', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { caption, uploaderName } = req.body;
  const photos = initDB(PHOTOS_DB);
  
  const newPhoto = {
    id: uuidv4(),
    filename: req.file.filename,
    originalName: req.file.originalname,
    caption: caption || '',
    uploaderName: uploaderName || 'Anonymous',
    date: new Date().toISOString()
  };
  
  photos.push(newPhoto);
  fs.writeFileSync(PHOTOS_DB, JSON.stringify(photos, null, 2));
  
  res.json(newPhoto);
});

// Delete photo
app.delete('/api/photos/:id', (req, res) => {
  const photos = initDB(PHOTOS_DB);
  const photo = photos.find(p => p.id === req.params.id);
  
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  
  // Delete file
  const filePath = path.join(UPLOADS_DIR, photo.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  
  // Remove from DB
  const updated = photos.filter(p => p.id !== req.params.id);
  fs.writeFileSync(PHOTOS_DB, JSON.stringify(updated, null, 2));
  
  res.json({ success: true });
});

// Get comments for a photo
app.get('/api/photos/:id/comments', (req, res) => {
  const comments = initDB(COMMENTS_DB);
  const photoComments = comments.filter(c => c.photoId === req.params.id);
  res.json(photoComments.sort((a, b) => new Date(a.date) - new Date(b.date)));
});

// Add comment
app.post('/api/photos/:id/comments', (req, res) => {
  const { text, authorName } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Comment text required' });
  }
  
  const comments = initDB(COMMENTS_DB);
  const newComment = {
    id: uuidv4(),
    photoId: req.params.id,
    text: text.trim(),
    authorName: authorName || 'Anonymous',
    date: new Date().toISOString()
  };
  
  comments.push(newComment);
  fs.writeFileSync(COMMENTS_DB, JSON.stringify(comments, null, 2));
  
  res.json(newComment);
});

// Get all updates
app.get('/api/updates', (req, res) => {
  const updates = initDB(UPDATES_DB);
  res.json(updates.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

// Add update
app.post('/api/updates', (req, res) => {
  const { title, content, category } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }
  
  const updates = initDB(UPDATES_DB);
  const newUpdate = {
    id: uuidv4(),
    title: title.trim(),
    content: content.trim(),
    category: category || 'general',
    date: new Date().toISOString()
  };
  
  updates.push(newUpdate);
  fs.writeFileSync(UPDATES_DB, JSON.stringify(updates, null, 2));
  
  res.json(newUpdate);
});

// Delete update
app.delete('/api/updates/:id', (req, res) => {
  const updates = initDB(UPDATES_DB);
  const updated = updates.filter(u => u.id !== req.params.id);
  fs.writeFileSync(UPDATES_DB, JSON.stringify(updated, null, 2));
  res.json({ success: true });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`🎉 Wedding website running at http://localhost:${PORT}`);
});
