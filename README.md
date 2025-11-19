# San Ramon Scout Troop Finder

![Cloudflare Pages](https://img.shields.io/badge/Deployed%20on-Cloudflare%20Pages-F38020?style=flat&logo=cloudflare&logoColor=white)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fsanramontroops.org)](https://sanramontroops.org)

A modern web tool helping Cub Scout families compare and choose the right Scouts BSA troop in the San Ramon, CA area. Compare local troops across key criteria with smart recommendations based on your preferences.

🔗 **Live Site**: [sanramontroops.org](https://sanramontroops.org)

## ✨ Key Features

- **Compare Local Troops** - Side-by-side comparison across 12+ criteria
- **Distance Calculator** - Find troops closest to your home
- **Smart Recommendations** - Get personalized suggestions based on preferences
- **Crowdsourced Updates** - Submit corrections via edit icons
- **Dark/Light Mode** - Theme toggle with saved preference
- **Fully Responsive** - Works on desktop, tablet, and mobile
- **Zero Backend** - Pure client-side, deploys anywhere

## 📊 Data Collection Workflow

```
🕷️ Scrape Troop Websites
   ↓ (using scrape2md Python package)
📝 Markdown Files
   ↓ (fed to LLMs for synthesis)
📋 troopData.json
   ↓ (powers the comparison tool)
🌐 sanramontroops.org
```

**Current Process** (Manual):
1. Scrape troop websites using [scrape2md](https://github.com/taralika/scrape2md) ([PyPI](https://pypi.org/project/scrape2md/))
2. Feed markdown files to LLMs (Claude, GPT, etc.) to synthesize structured data
3. Update `troopData.json` with extracted information

**Future Enhancement** (Automated):
- Periodic automated scraping of troop websites
- LLM-powered auto-synthesis of changes
- Fresh data pipeline keeps `troopData.json` current automatically

## 🚀 Quick Start

### Local Development
```bash
npm install
npm run build:css
npm run watch:css
./start-server.sh
```

## 📝 Updating Troop Data

1. **Manual Update**: Edit `troopData.json` directly
2. **Automated Collection** (current workflow):
   ```bash
   # Scrape troop website
   scrape2md https://www.troop888.us/ -o scraped_data
   
   # Feed markdown to LLM to extract structured data
   # Update troopData.json with synthesized info
   ```
3. Save and refresh (or redeploy)

### Data Sources
All troop information sourced from official troop websites:
[Troop 888](https://www.troop888.us/) | [Troop 201](https://www.troop201srv.org/) | [Troop 815](https://www.troop815.net/) | [Troop 805](https://troop805.org/) | [Troop 621](https://www.troopwebhost.org/Troop621SanRamon/) | [Troop 874](https://www.troopwebhost.org/Troop874SanRamon/) | [Troop 1776](https://www.troopwebhost.org/Troop1776SanRamon/)

## 🏗️ Tech Stack

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript (ES6+)
- **Data Collection**: [scrape2md](https://github.com/taralika/scrape2md) (Python)
- **APIs**: Nominatim (geocoding), Web3Forms (submissions)
- **No backend required** - fully static site

## 🤝 Contributing

- **Submit corrections**: Use ✏️ edit icons on the website
- **Report issues**: Open GitHub issue or contact maintainer
- **Update data**: PRs welcome for `troopData.json` updates

## 📄 License & Disclaimer

Open source for scout families. Not officially affiliated with BSA. Verify information by contacting troops directly.

---

Made with ⚜️ for San Ramon Scout families | [GitHub](https://github.com/taralika/scout-troop-picker)

