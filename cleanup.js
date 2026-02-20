// Cleanup script to remove all photo records from MongoDB
// Run this to start fresh after deleting photos from Cloudinary

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://wedding:zqTZcdTWrkUS80Ku@madi-jake-wedding.xlh7ees.mongodb.net/?appName=madi-jake-wedding';

mongoose.connect(MONGODB_URI, {
  dbName: 'madi-jake-wedding'
}).then(async () => {
  console.log('Connected to MongoDB');
  
  // Define schema
  const photoSchema = new mongoose.Schema({
    id: String,
    filename: String,
    cloudinaryId: String,
    originalName: String,
    caption: String,
    uploaderName: String,
    date: Date
  });
  
  const Photo = mongoose.model('Photo', photoSchema);
  
  // Delete all photos
  const result = await Photo.deleteMany({});
  console.log(`Deleted ${result.deletedCount} photo records`);
  
  // Also clear comments if needed
  const commentSchema = new mongoose.Schema({
    id: String,
    photoId: String,
    text: String,
    authorName: String,
    date: Date
  });
  
  const Comment = mongoose.model('Comment', commentSchema);
  const commentResult = await Comment.deleteMany({});
  console.log(`Deleted ${commentResult.deletedCount} comment records`);
  
  console.log('Database cleaned!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
