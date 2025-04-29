#!/bin/bash
# Generate simple placeholder icons for the extension

# Create a 128x128 icon with blue background and white text
convert -size 128x128 xc:#0073b1 -gravity center -pointsize 40 -fill white -font Arial -annotate 0 "JH" icon128.png

# Create smaller versions from the large one
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 16x16 icon16.png

echo "Icons generated successfully!"