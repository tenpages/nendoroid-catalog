# Nendoroid Catalog

An interactive catalog for Nendoroid collectible figures, hosted on GitHub Pages. Features search/filter capabilities, local storage for tracking owned and wishlist items, and DX version support.

## AI Disclamer

Most of the project, including this readme, is completed by AI. ROO Code (minimax-m2.1:free) and GitHub Copilot were used. This is a toy project for me to test AI coding.

## Features

- 🔍 **Search & Filter**: Search by character name, series, or ID. Filter by fandom, gender, hair color, clothes color, and parts.
- 💾 **Local Storage**: Your owned and wishlist collections are stored locally in your browser.
- 🎨 **Custom Theming**: Each Nendoroid displays with its own box color.
- 📱 **Responsive Design**: Works on desktop and mobile devices.
- 🖼️ **Local Images**: All images stored locally, no external dependencies.
- ⚡ **DX Version Toggle**: Show/hide deluxe versions separately or alongside base versions.

## DX Version Support

DX (Deluxe) versions are treated as separate entities linked to their base versions:

- **Separate Display**: Each DX version has its own entry in the catalog
- **Toggle Control**: Use the "Show DX versions" toggle to include or exclude DX versions from the catalog
- **Linked References**: Cards show which base version a DX is linked to (← 1580)
- **Standalone DX**: Some DX versions may be standalone with no linked base version

## Getting Started

### Local Development

1. Clone this repository
2. Open `index.html` in a web browser, OR use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js (with serve)
   npx serve
   ```
3. Navigate to `http://localhost:8000`

### Deploying to GitHub Pages

1. Create a new repository on GitHub
2. Push this project to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```
3. Go to repository Settings → Pages
4. Select "main" as the source branch
5. Click Save

Your site will be available at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

## Adding Your Own Nendoroids

Edit `data/nendoroids.json` to add your own Nendoroids:

### Base Version Example
```json
{
  "id": "1580",
  "name": "Goku Super Saiyan",
  "series": "Dragon Ball Super",
  "officialPhoto": "images/nendoroids/1580.jpg",
  "description": "Character description...",
  "fandom": "Dragon Ball",
  "gender": "Male",
  "hairColor": ["#FFD700", "#FFFF00"],
  "clothesColor": ["#FF6B00", "#0066CC"],
  "parts": ["Spiky Hair", "Orange Gi"],
  "releaseDate": "2023-10",
  "price": 5500,
  "boxColor": "#FFD700",
  "isDX": false,
  "linkedId": null
}
```

### DX Version Example
```json
{
  "id": "1580DX",
  "name": "Goku Super Saiyan DX",
  "series": "Dragon Ball Super",
  "officialPhoto": "images/nendoroids/1580DX.jpg",
  "description": "Deluxe version with extra accessories...",
  "fandom": "Dragon Ball",
  "gender": "Male",
  "hairColor": ["#FFD700", "#FFFF00"],
  "clothesColor": ["#FF6B00", "#0066CC"],
  "parts": ["Spiky Hair", "Ultra Instinct Aura", "Orange Gi", "Special Stand"],
  "releaseDate": "2023-10",
  "price": 8800,
  "boxColor": "#FFD700",
  "isDX": true,
  "linkedId": "1580"
}
```

### Data Field Guide

| Field | Description | Example |
|-------|-------------|---------|
| `id` | Unique Nendoroid ID (use ID + "DX" for DX) | `"1580"` or `"1580DX"` |
| `name` | Character name | `"Goku Super Saiyan"` |
| `series` | Series or game name | `"Dragon Ball Super"` |
| `officialPhoto` | Path to image | `"images/nendoroids/1580.jpg"` |
| `description` | Character description | `"..."` |
| `fandom` | Fandom/copyright name | `"Dragon Ball"` |
| `gender` | Character gender | `"Male"` |
| `hairColor` | Array of hair colors | `["#FFD700", "#FFFF00"]` |
| `clothesColor` | Array of clothing colors | `["#FF6B00", "#0066CC"]` |
| `parts` | Array of included parts | `["Spiky Hair", "Orange Gi"]` |
| `releaseDate` | Release date (YYYY-MM) | `"2023-10"` |
| `price` | Price in JPY | `5500` |
| `boxColor` | Box color for UI theming | `"#FFD700"` |
| `isDX` | Is this a deluxe version? | `true` or `false` |
| `linkedId` | Base version ID for DX | `"1580"` or `null` |

## Adding Images

1. Add images to `images/nendoroids/` folder
2. Supported formats: JPG, PNG, SVG, WebP
3. Recommended size: 400x400px or larger
4. Update the `officialPhoto` path in `nendoroids.json`

## Customization

### Colors

Edit `css/styles.css` to customize the color scheme:

```css
:root {
    --primary-color: #2c3e50;
    --accent-color: #3498db;
    /* ... */
}
```

### Layout

The catalog uses CSS Grid with `auto-fill` for responsive layout. Modify the `minmax` value in `css/styles.css` to adjust card sizes.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Images not loading
- Ensure images are in `images/nendoroids/` folder
- Check file extensions match in JSON and actual files
- Use relative paths starting with `images/`

### localStorage not working
- Ensure you're not in private/incognito mode
- Some browsers block localStorage in local files - use a local server

### DX toggle not persisting
- The DX preference is saved to localStorage separately
- Toggle will remember your preference across sessions

## License

MIT License - Feel free to use and modify for your personal collection!

## Credits

- Nendoroid is a registered trademark of Good Smile Company
- Sample data is for demonstration purposes
