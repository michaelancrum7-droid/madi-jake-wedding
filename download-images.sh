#!/bin/bash
# Download placeholder images for The Homestead wedding site

echo "Downloading sample wedding/homestead images..."

# Create images directory
mkdir -p /Users/michaelancrum/.openclaw/workspace/wedding-website/public/images

# Download sample images (these are placeholder URLs - user should replace with actual photos)
cd /Users/michaelancrum/.openclaw/workspace/wedding-website/public/images

# Note: These are placeholder instructions
cat << 'EOF' > README.txt
PLACEHOLDER IMAGES FOR MADI & JAKE'S WEDDING WEBSITE
=====================================================

To add real photos of The Homestead:

1. MANUAL DOWNLOAD (Recommended):
   - Visit https://www.omnihotels.com/hotels/homestead
   - Right-click on images you want → "Save Image As"
   - Save to this folder: wedding-website/public/images/
   - Rename files: homestead-1.jpg, homestead-2.jpg, etc.

2. FROM GOOGLE IMAGES:
   - Search: "Omni Homestead Resort Hot Springs Virginia"
   - Right-click images → "Save Image As"
   - Or use Google Images download feature

3. YOUR OWN PHOTOS:
   - Copy any photos you have of The Homestead into this folder
   - Recommended: at least 3-5 images for the gallery

4. UPDATE THE WEBSITE:
   Edit public/index.html and replace the placeholder section with actual images:
   
   Search for: "PLACEHOLDER_IMAGES_SECTION"
   Replace with your actual homestead images.

SUGGESTED IMAGES TO DOWNLOAD:
- Resort exterior/mountain view
- The historic building facade
- Wedding venue space
- Spa or hot springs area
- Guest rooms or suites
- Dining/restaurant areas

After adding images, the website will automatically display them!
EOF

echo "Created instructions at: wedding-website/public/images/README.txt"
echo ""
echo "To view the website locally:"
echo "  http://localhost:3000"
echo ""
echo "To share with others on your network:"
echo "  1. Find your computer's IP: ipconfig getifaddr en0"
echo "  2. Share: http://YOUR_IP:3000"
echo ""
echo "For public access, run: npx ngrok http 3000"
