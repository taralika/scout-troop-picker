# San Ramon Scout Troop Finder

A modern, responsive web application to help parents of Cub Scouts transitioning to Boy Scouts (Scouts BSA) compare and choose the right troop in the San Ramon, CA area.

## 🎯 Features

- **📊 Detailed Comparison Table**: Compare 7 local troops across 12+ criteria
- **📍 Distance Calculator**: Calculate distance from your home to each troop meeting location
- **🎯 Smart Recommendations**: Get personalized troop recommendations based on your preferences
- **✏️ Crowdsourced Updates**: Submit corrections via per-cell edit icons
- **🌓 Dark/Light Mode**: Toggle between themes with preference saved
- **📱 Fully Responsive**: Works seamlessly on desktop, tablet, and mobile
- **⚡ Zero Backend**: Pure client-side application, no server required
- **🎨 Scout-Themed Design**: Modern UI using BSA colors

## 🚀 Quick Start

### Option 1: Open Locally
1. Clone or download this repository
2. Install dependencies: `npm install`
3. Build CSS: `npm run build:css`
4. Open `index.html` in any modern web browser

### Option 2: Deploy to Cloudflare Pages

1. **Sign in to Cloudflare Pages**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Navigate to Workers & Pages → Create application → Pages → Connect to Git

2. **Connect Your Repository**
   - Connect your GitHub account and select this repository
   - Or use Direct Upload to upload the files

3. **Configure Build Settings**
   - Framework preset: `None`
   - Build command: (leave empty)
   - Build output directory: `/`
   
4. **Deploy**
   - Click "Save and Deploy"
   - Your site will be live in seconds at `your-project.pages.dev`

### Option 3: Deploy to GitHub Pages

1. Push this repository to GitHub
2. Go to Settings → Pages
3. Source: Deploy from a branch
4. Branch: `main` or `master`, folder: `/ (root)`
5. Save and wait a few minutes
6. Your site will be live at `username.github.io/repository-name`

## 🛠️ Development

### Prerequisites
- Node.js installed on your machine

### Setup
```bash
npm install
```

### Available Commands

**Build CSS (production)**
```bash
npm run build:css
```
Generates optimized `styles.css` from `input.css`. Run this before deploying.

**Watch CSS (development)**
```bash
npm run watch:css
```
Auto-rebuilds CSS when you modify `input.css` or `index.html`. Keep this running during development.

### Making Style Changes
1. Edit `input.css` for custom styles or `tailwind.config.js` for Tailwind settings
2. The CSS will auto-rebuild if you're running `npm run watch:css`
3. Or manually run `npm run build:css` to regenerate `styles.css`
4. Refresh your browser to see changes

### Files to Deploy
When deploying, only upload:
- ✅ `index.html`, `app.js`, `troopData.json`
- ✅ `styles.css` (generated file)
- ✅ `assets/` folder
- ✅ `robots.txt`, `sitemap.xml`

**Do NOT upload:**
- ❌ `node_modules/`, `package.json`, `input.css`, `tailwind.config.js`

## ⚙️ Configuration

### Web3Forms Setup (for correction submissions)

1. **Get a Free API Key**
   - Go to [web3forms.com](https://web3forms.com)
   - Enter your email to get a free access key
   - Verify your email

2. **Update the HTML**
   - Open `index.html`
   - Find line with `value="YOUR_WEB3FORMS_ACCESS_KEY"`
   - Replace with your actual access key:
     ```html
     <input type="hidden" name="access_key" value="your-actual-key-here">
     ```

3. **Test the Form**
   - Click any edit icon (✏️) in the comparison table
   - Submit a test correction
   - Check your email for the submission

## 📊 Troop Data

All troop data is stored in `troopData.json`. Data sources:

- [Troop 888 Website](https://www.troop888.us/)
- [Troop 201 Website](https://www.troop201srv.org/)
- [Troop 815 Website](https://www.troop815.net/)
- [Troop 805 Website](https://troop805.org/)
- [Troop 621 Website](https://www.troopwebhost.org/Troop621SanRamon/Index.htm)
- [Troop 874 Website](https://www.troopwebhost.org/Troop874SanRamon/)
- [Troop 1776 Website](https://www.troopwebhost.org/Troop1776SanRamon/)
- Various recruiting flyers and verified sources

## 🔄 Updating Troop Information

To update troop data:

1. Open `troopData.json`
3. Update the relevant fields
4. Save and refresh the page (or redeploy)

### Data Fields Explained

```javascript
{
    troop: "621",              // Troop number
    founded: 2012,             // Year founded
    meetingDay: "Wednesday",   // Meeting day
    meetingTime: "7:00 PM",    // Meeting time
    location: "School Name",   // Meeting location
    address: "Full address",   // Full address for geocoding
    city: "San Ramon",         // City
    distance: null,            // Calculated dynamically
    size: 80,                  // Number of scouts
    sizeCategory: "medium",    // small/medium/large
    eagles: "35+",             // Eagle Scout count (display)
    eagleCount: 35,            // Eagle count (for sorting)
    programFocus: "...",       // Program description
    activities: "...",         // Activities list
    dues: "$200",              // Annual dues
    contact: "email",          // Contact info
    website: "https://...",    // Website URL
    tags: ["outdoor"],         // Tags for filtering
    scoutAttributes: {         // Scoring attributes (1-5)
        outdoor: 5,
        eagle: 5,
        balanced: 4,
        newScoutFriendly: 4,
        largeGroup: 4
    }
}
```

## 🎨 Customization

### Colors
The app uses BSA-themed colors defined in `tailwind.config.js`:
- `scout-red`: #CE1126
- `scout-blue`: #003F87
- `scout-tan`: #E3B778
- `scout-gold`: #FFC72C

To customize, edit `tailwind.config.js` and rebuild CSS.

### Recommendation Algorithm
The scoring system in `applyFiltersAndRecommend()` function uses weighted criteria:
- Meeting day match: 20 points
- Within distance: 15 points
- Activity focus match: 25 points
- Size preference: 15 points
- New scout friendly: 15 points
- Other factors: 5-10 points

Adjust these weights in `app.js` to change recommendation priority.

## 🏗️ Tech Stack

- **HTML5** - Semantic markup
- **Tailwind CSS** - Utility-first CSS via Tailwind CLI
- **Vanilla JavaScript (ES6+)** - No frameworks, pure JS
- **Nominatim API** - Free geocoding via OpenStreetMap
- **Web3Forms** - Free form submission service

## 📈 Performance

- ✅ Optimized CSS (25KB minified)
- ✅ No external CDN dependencies
- ✅ Lightweight total bundle
- ✅ 95+ Lighthouse score target
- ✅ Fully responsive design
- ✅ Works offline (after initial load)

## 🔒 Privacy

- No tracking or analytics
- No cookies (except localStorage for theme preference)
- Geocoding requests go to OpenStreetMap's Nominatim
- Form submissions go to Web3Forms (you control the email)
- No user data is stored or transmitted elsewhere

## 📝 Future Enhancements

Ideas for future versions:
- [ ] Add more troops from neighboring areas
- [ ] Include parent reviews/ratings
- [ ] Add photos of troop activities
- [ ] Integrate live calendar feeds
- [ ] Add troop leader interviews/profiles
- [ ] Support for filtering by specific merit badges
- [ ] Email notifications for troop updates
- [ ] Backend API for automated data updates

## 🤝 Contributing

Have updated troop information? Found a bug? 

1. Use the edit icons (✏️) in the table to submit corrections
2. Or open an issue/PR on GitHub
3. Or contact the site maintainer directly

## 📄 License

This project is open source and available for use by scout families and troops.

## ⚠️ Disclaimer

This is an independent tool created to help families. It is not officially affiliated with the Boy Scouts of America (BSA) or any specific troop. All troop information is sourced from publicly available materials and should be verified by contacting troops directly.

## 📞 Support

For questions or issues:
- Use the correction form on the website
- Contact troops directly for specific troop questions
- Check troop websites for the most current information

---

Made with ⚜️ for San Ramon Scout families

