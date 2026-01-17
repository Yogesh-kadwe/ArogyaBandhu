# ArogyaBandhu - Rural Healthcare Platform

A comprehensive AI-powered healthcare platform designed specifically for rural communities, working entirely in the browser without backend infrastructure.

## Features

### 🏥 Core Healthcare Services
- **AI Health Assistant**: Rule-based symptom analysis with disease predictions
- **Rural Doctor Finder**: Locate nearby hospitals and clinics using geolocation
- **Medicine Lookup**: Search medicine information with usage and side effects
- **Health Record Locker**: Store and manage patient data locally
- **Emergency Mode**: One-click SOS with emergency numbers and nearest hospitals

### 📊 Health Dashboard
- BMI Calculator with health indicators
- Water intake tracker with progress visualization
- Step counter for daily activity monitoring
- Interactive charts using Chart.js
- Weekly progress tracking

### 🌐 Multi-Language Support
- English, Hindi, and Marathi language options
- Rural-friendly interface with large touch targets
- Mobile-first responsive design

### 💾 Offline Capabilities
- Service worker caching for offline functionality
- LocalStorage for data persistence
- Works without internet connection using cached data

### 🏛️ Government Health Schemes
- Comprehensive list of government healthcare schemes
- Search and filter functionality
- Eligibility and application information

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: TailwindCSS
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **Storage**: Browser LocalStorage
- **PWA**: Service Worker support

## APIs Used

All APIs are free and public:
- **OpenStreetMap Overpass API**: Hospital and clinic locations
- **OpenFDA API**: Medicine information (for production)
- **Open-Meteo API**: Weather data
- **Disease.sh**: Disease information (for production)

## Installation & Usage

1. Clone or download the project files
2. Open `index.html` in a web browser
3. No installation or setup required - works immediately

### For Development
- Use a local web server for best results
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

## File Structure

```
ArogyaBandhu/
├── index.html          # Main application file
├── script.js           # All JavaScript functionality
├── manifest.json       # PWA manifest
├── README.md          # Documentation
└── sw.js              # Service worker (auto-generated)
```

## Key Features Explained

### AI Health Assistant
- Rule-based symptom analysis (no paid APIs)
- Common condition predictions
- Prevention and remedy suggestions
- Medical disclaimer included

### Doctor Finder
- Geolocation-based search
- Mock data for demonstration
- Real OpenStreetMap integration ready
- Distance calculation and directions

### Health Records
- Complete patient information storage
- LocalStorage persistence
- Export functionality (JSON)
- Edit and delete capabilities

### Emergency Mode
- Quick access to emergency numbers
- One-click hospital finder
- Prominent SOS button
- Critical information display

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Android Chrome)

## Data Privacy

- All data stored locally in browser
- No external data transmission
- No user tracking or analytics
- Complete privacy protection

## Future Enhancements

- Real API integrations
- Voice input support
- Video consultation integration
- More sophisticated AI analysis
- Additional regional languages

## Contributing

This is a demonstration project focused on rural healthcare accessibility. Feel free to extend and modify for specific community needs.

## License

MIT License - Free for educational and non-commercial use.

---

**ArogyaBandhu** - Your Healthcare Companion for Rural Communities 🏥💚
