# Madi & Jake Wedding Website - Setup Guide

## 🎉 Website Status: RUNNING

**Local URL:** http://localhost:3000

---

## 📸 Adding The Homestead Images

Since the Omni website blocks automated downloads, here's how to manually add images:

### Method 1: Download from Omni Website (Recommended)

1. Visit: https://www.omnihotels.com/hotels/homestead
2. Browse the photo gallery
3. Right-click on images → "Save Image As..."
4. Save to: `wedding-website/public/images/`
5. Name them: `homestead-1.jpg`, `homestead-2.jpg`, etc.

### Method 2: Google Images

1. Search: "Omni Homestead Resort Virginia"
2. Click "Images" tab
3. Right-click good photos → "Save Image As..."
4. Save to the images folder

### Method 3: Your Own Photos

If you have photos from visiting The Homestead, copy them to:
`wedding-website/public/images/`

---

## 🌐 Viewing the Website

### On This Computer:
```
http://localhost:3000
```
Open your browser and go to that URL.

### On Other Devices (Same WiFi):

**Step 1:** Find your computer's IP address
```bash
# On Mac:
ipconfig getifaddr en0

# On Windows:
ipconfig | findstr "IPv4"
```

**Step 2:** Share this URL with others on your network
```
http://YOUR_IP:3000
```

Example: `http://192.168.1.45:3000`

### Public Access (Anyone on the internet):

**Option A: Ngrok (Easiest)**
```bash
cd wedding-website
npx ngrok http 3000
```
This gives you a public URL like `https://abc123.ngrok.io`

**Option B: Cloudflare Tunnel**
```bash
brew install cloudflared
cloudflared tunnel --url http://localhost:3000
```

**Option C: Tailscale (if configured)**
Already set up on your system. Share via Tailscale.

---

## 🎨 Customizing the Website

### Change Couple Names
Edit `public/index.html`, find:
```html
<h1>💕 Madi & Jake 💕</h1>
```

### Change Venue Info
Find the `.venue-info` section in the HTML.

### Change Colors
Look for CSS color codes like `#2d5a4a` (green) and replace with your wedding colors.

### Add Password Protection
Edit `server.js` and add authentication middleware.

---

## 📁 File Structure

```
wedding-website/
├── server.js           # Backend API
├── public/
│   ├── index.html      # Main website
│   └── images/         # Add Homestead photos here
├── uploads/            # Guest uploaded photos
├── data/               # Database (photos.json, comments.json, etc.)
└── package.json
```

---

## 🚀 Deployment Options

### Free Options:
1. **Railway** - railway.app (free tier)
2. **Render** - render.com (free tier)
3. **Vercel** - vercel.com (good for static sites)
4. **Netlify** - netlify.com (free tier)

### Paid Options:
- VPS (DigitalOcean, Linode)
- AWS/GCP/Azure

---

## 🆘 Troubleshooting

**Site won't load:**
- Make sure server is running: `npm start`
- Check port 3000 isn't in use

**Images won't upload:**
- Check `uploads/` folder exists
- Check file size under 10MB
- Check file type (jpg, png, gif, webp only)

**Can't access from other devices:**
- Make sure devices are on same WiFi
- Check firewall settings
- Use your IP address, not localhost

---

## 📞 Need Help?

The website is running locally on your machine. Everything is self-contained and your data stays private.

For support, check the OpenClaw documentation or ask me!
