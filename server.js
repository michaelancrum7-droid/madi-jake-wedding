const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware for Safari compatibility - MUST be before auth
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Vary', 'Origin');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://wedding:zqTZcdTWrkUS80Ku@madi-jake-wedding.xlh7ees.mongodb.net/?appName=madi-jake-wedding';

mongoose.connect(MONGODB_URI, {
  dbName: 'madi-jake-wedding'
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Photo Schema
const photoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  filename: { type: String, required: true },
  cloudinaryId: { type: String, required: true },
  originalName: String,
  caption: String,
  uploaderName: { type: String, default: 'Anonymous' },
  date: { type: Date, default: Date.now }
});

const Photo = mongoose.model('Photo', photoSchema);

// Comment Schema
const commentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  photoId: { type: String, required: true },
  text: { type: String, required: true },
  authorName: { type: String, default: 'Anonymous' },
  date: { type: Date, default: Date.now }
});

const Comment = mongoose.model('Comment', commentSchema);

// Update Schema
const updateSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: 'general' },
  date: { type: Date, default: Date.now }
});

const Update = mongoose.model('Update', updateSchema);

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dlxmqdzy4',
  api_key: process.env.CLOUDINARY_API_KEY || '974422397166563',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'HaM7l5q9bXhP0_QIVvemQNXiGTI'
});

// Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'madi-jake-wedding',
    allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }]
  }
});

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

// Multer upload config (uses Cloudinary storage)
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Routes

// Get all photos
app.get('/api/photos', async (req, res) => {
  try {
    const photos = await Photo.find().sort({ date: -1 });
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load photos' });
  }
});

// Upload photo
app.post('/api/photos', upload.single('photo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { caption, uploaderName } = req.body;
  
  try {
    // Build full Cloudinary URL
    const cloudName = 'dlxmqdzy4';
    const publicId = req.file.filename;
    const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
    
    const newPhoto = new Photo({
      id: uuidv4(),
      filename: cloudinaryUrl, // Full Cloudinary URL
      cloudinaryId: publicId, // Cloudinary public_id for deletion
      originalName: req.file.originalname,
      caption: caption || '',
      uploaderName: uploaderName || 'Anonymous',
      date: new Date()
    });
    
    await newPhoto.save();
    res.json(newPhoto);
  } catch (err) {
    console.error('Error saving photo:', err);
    res.status(500).json({ error: 'Failed to save photo' });
  }
});

// Delete photo - requires uploader name verification
app.delete('/api/photos/:id', async (req, res) => {
  const { uploaderName } = req.body;
  
  try {
    const photo = await Photo.findOne({ id: req.params.id });
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Verify the person deleting is the uploader (case-insensitive)
    const providedName = (uploaderName || '').trim().toLowerCase();
    const storedName = (photo.uploaderName || 'Anonymous').trim().toLowerCase();
    
    if (providedName !== storedName) {
      return res.status(403).json({ error: 'Only the uploader can delete this photo' });
    }
    
    // Delete from Cloudinary if cloudinaryId exists
    if (photo.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(photo.cloudinaryId);
      } catch (err) {
        console.error('Cloudinary delete error:', err);
      }
    }
    
    // Remove from MongoDB
    await Photo.deleteOne({ id: req.params.id });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting photo:', err);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Get comments for a photo
app.get('/api/photos/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ photoId: req.params.id }).sort({ date: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

// Add comment
app.post('/api/photos/:id/comments', async (req, res) => {
  const { text, authorName } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Comment text required' });
  }
  
  try {
    const newComment = new Comment({
      id: uuidv4(),
      photoId: req.params.id,
      text: text.trim(),
      authorName: authorName || 'Anonymous',
      date: new Date()
    });
    
    await newComment.save();
    res.json(newComment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get all updates
app.get('/api/updates', async (req, res) => {
  try {
    const updates = await Update.find().sort({ date: -1 });
    res.json(updates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load updates' });
  }
});

// Add update
app.post('/api/updates', async (req, res) => {
  const { title, content, category } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }
  
  try {
    const newUpdate = new Update({
      id: uuidv4(),
      title: title.trim(),
      content: content.trim(),
      category: category || 'general',
      date: new Date()
    });
    
    await newUpdate.save();
    res.json(newUpdate);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add update' });
  }
});

// Delete update
app.delete('/api/updates/:id', async (req, res) => {
  try {
    await Update.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete update' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`🎉 Wedding website running at http://localhost:${PORT}`);
});
