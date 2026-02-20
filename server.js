const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Cookie parser middleware
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      req.cookies[name] = decodeURIComponent(value);
    });
  }
  next();
});

// Password protection
const WEDDING_PASSWORD = process.env.WEDDING_PASSWORD || 'MadiJake2026';

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || req.query.password || req.cookies?.wedding_auth;
  
  // Check query param or cookie first (simplest)
  if (auth && auth === WEDDING_PASSWORD) {
    return next();
  }
  
  // Check basic auth header
  if (auth && auth.startsWith('Basic ')) {
    const base64 = auth.split(' ')[1];
    const decoded = Buffer.from(base64, 'base64').toString('utf8');
    const parts = decoded.split(':');
    const pass = parts.length > 1 ? parts[1] : decoded;
    if (pass === WEDDING_PASSWORD) {
      return next();
    }
  }
  
  // Return 401 with HTML login form
  res.status(401).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Madi & Jake Wedding - Login</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Georgia', serif;
          background: linear-gradient(135deg, #1a3a2f 0%, #2d5a4a 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 0;
        }
        .login-box {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          text-align: center;
          max-width: 400px;
          width: 90%;
        }
        h1 {
          color: #2d5a4a;
          margin-bottom: 10px;
        }
        p {
          color: #666;
          margin-bottom: 30px;
        }
        input[type="password"] {
          width: 100%;
          padding: 15px;
          border: 2px solid #ddd;
          border-radius: 10px;
          font-size: 1rem;
          margin-bottom: 20px;
          box-sizing: border-box;
        }
        button {
          background: #2d5a4a;
          color: white;
          border: none;
          padding: 15px 40px;
          border-radius: 25px;
          font-size: 1rem;
          cursor: pointer;
          width: 100%;
        }
        button:hover {
          background: #1a3a2f;
        }
        .error {
          color: #d32f2f;
          margin-top: 15px;
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="login-box">
        <h1>💕 Madi & Jake 💕</h1>
        <p>Welcome to our wedding website!<br>Please enter the password to continue.</p>
        <form onsubmit="return login(event)">
          <input type="password" id="password" placeholder="Enter password" required>
          <button type="submit">Enter</button>
        </form>
        <p class="error" id="error">Incorrect password. Please try again.</p>
      </div>
      <script>
        function login(e) {
          e.preventDefault();
          const password = document.getElementById('password').value;
          fetch('/?password=' + encodeURIComponent(password))
            .then(r => {
              if (r.ok) {
                document.cookie = 'wedding_auth=' + password + '; path=/; max-age=86400';
                window.location.reload();
              } else {
                document.getElementById('error').style.display = 'block';
              }
            });
          return false;
        }
      </script>
    </body>
    </html>
  `);
}

// Middleware
app.use(express.json());
app.use(requireAuth);
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

// Delete photo - requires uploader name verification
app.delete('/api/photos/:id', (req, res) => {
  const { uploaderName } = req.body;
  const photos = initDB(PHOTOS_DB);
  const photo = photos.find(p => p.id === req.params.id);
  
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  
  // Verify the person deleting is the uploader (case-insensitive)
  const providedName = (uploaderName || '').trim().toLowerCase();
  const storedName = (photo.uploaderName || 'Anonymous').trim().toLowerCase();
  
  if (providedName !== storedName) {
    return res.status(403).json({ error: 'Only the uploader can delete this photo' });
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
