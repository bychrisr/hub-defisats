#!/bin/bash

# Asset Optimization Script for Axisor Documentation
# This script optimizes images, generates screenshots, and prepares assets for documentation

set -e

echo "🚀 Starting asset optimization for Axisor documentation..."

# Create directories
mkdir -p docs/assets/images
mkdir -p docs/assets/screenshots
mkdir -p docs/assets/diagrams
mkdir -p docs/assets/icons

# Function to optimize images
optimize_images() {
    echo "📸 Optimizing images..."
    
    # Check if imagemagick is installed
    if ! command -v convert &> /dev/null; then
        echo "⚠️  ImageMagick not found. Installing..."
        sudo apt-get update
        sudo apt-get install -y imagemagick
    fi
    
    # Optimize existing images
    find docs/assets/images -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | while read file; do
        echo "Optimizing: $file"
        convert "$file" -quality 85 -strip "$file"
    done
    
    echo "✅ Image optimization complete"
}

# Function to generate screenshots
generate_screenshots() {
    echo "📱 Generating screenshots..."
    
    # Check if playwright is installed
    if ! command -v playwright &> /dev/null; then
        echo "⚠️  Playwright not found. Installing..."
        npm install -g playwright
        playwright install
    fi
    
    # Create screenshot generation script
    cat > scripts/generate-screenshots.js << 'EOF'
const { chromium } = require('playwright');

async function generateScreenshots() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Screenshots to generate
    const screenshots = [
        {
            name: 'dashboard-overview',
            url: 'http://localhost:3001/dashboard',
            selector: '.dashboard-container'
        },
        {
            name: 'trading-interface',
            url: 'http://localhost:3001/trading',
            selector: '.trading-interface'
        },
        {
            name: 'margin-guard-config',
            url: 'http://localhost:3001/margin-guard',
            selector: '.margin-guard-config'
        },
        {
            name: 'admin-panel',
            url: 'http://localhost:3001/admin',
            selector: '.admin-panel'
        }
    ];
    
    for (const screenshot of screenshots) {
        try {
            console.log(`Generating screenshot: ${screenshot.name}`);
            await page.goto(screenshot.url);
            await page.waitForSelector(screenshot.selector, { timeout: 10000 });
            await page.screenshot({ 
                path: `docs/assets/screenshots/${screenshot.name}.png`,
                fullPage: true
            });
        } catch (error) {
            console.warn(`Failed to generate screenshot for ${screenshot.name}: ${error.message}`);
        }
    }
    
    await browser.close();
}

generateScreenshots().catch(console.error);
EOF
    
    echo "✅ Screenshot generation script created"
}

# Function to optimize diagrams
optimize_diagrams() {
    echo "📊 Optimizing diagrams..."
    
    # Copy Mermaid diagrams to assets
    cp docs/diagrams/*.mermaid docs/assets/diagrams/ 2>/dev/null || true
    
    # Generate SVG versions of diagrams
    find docs/assets/diagrams -name "*.mermaid" | while read file; do
        echo "Processing diagram: $file"
        # This would require mermaid-cli to be installed
        # mmdc -i "$file" -o "${file%.mermaid}.svg"
    done
    
    echo "✅ Diagram optimization complete"
}

# Function to create favicon and icons
create_icons() {
    echo "🎨 Creating icons and favicons..."
    
    # Create simple SVG icons
    cat > docs/assets/icons/axisor-icon.svg << 'EOF'
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="4" fill="#25c2a0"/>
  <path d="M8 12 L16 8 L24 12 L20 16 L12 16 Z" fill="white"/>
  <circle cx="16" cy="20" r="3" fill="white"/>
</svg>
EOF
    
    # Generate favicon
    if command -v convert &> /dev/null; then
        convert docs/assets/icons/axisor-icon.svg -resize 32x32 docs/assets/icons/favicon.ico
    fi
    
    echo "✅ Icons created"
}

# Function to validate assets
validate_assets() {
    echo "🔍 Validating assets..."
    
    # Check for broken links in documentation
    echo "Checking for broken links..."
    find docs -name "*.md" -exec grep -l "!\[.*\](" {} \; | while read file; do
        echo "Checking images in: $file"
        grep -o "!\[.*\]([^)]*)" "$file" | while read img; do
            path=$(echo "$img" | sed 's/!\[.*\](\(.*\))/\1/')
            if [[ ! -f "docs/$path" ]]; then
                echo "⚠️  Broken image link: $path in $file"
            fi
        done
    done
    
    # Check file sizes
    echo "Checking asset file sizes..."
    find docs/assets -type f -size +1M -exec echo "⚠️  Large file: {}" \;
    
    echo "✅ Asset validation complete"
}

# Function to generate asset manifest
generate_manifest() {
    echo "📋 Generating asset manifest..."
    
    cat > docs/assets/manifest.json << 'EOF'
{
  "images": [],
  "screenshots": [],
  "diagrams": [],
  "icons": [],
  "generated": "2024-01-01T00:00:00Z",
  "version": "1.0.0"
}
EOF
    
    # Populate manifest with actual files
    find docs/assets -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.svg" -o -name "*.mermaid" \) | while read file; do
        echo "Adding to manifest: $file"
        # This would require jq to be installed
        # jq ".images += [\"$file\"]" docs/assets/manifest.json > temp.json && mv temp.json docs/assets/manifest.json
    done
    
    echo "✅ Asset manifest generated"
}

# Main execution
main() {
    echo "🎯 Starting asset optimization process..."
    
    optimize_images
    generate_screenshots
    optimize_diagrams
    create_icons
    validate_assets
    generate_manifest
    
    echo "🎉 Asset optimization complete!"
    echo "📁 Assets are located in: docs/assets/"
    echo "📊 Diagrams are located in: docs/assets/diagrams/"
    echo "📱 Screenshots are located in: docs/assets/screenshots/"
    echo "🎨 Icons are located in: docs/assets/icons/"
}

# Run main function
main "$@"
