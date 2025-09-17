# Prayer Times Web Calculator

A simple, clean web testing interface for the [@masaajid/prayer-times](https://www.npmjs.com/package/@masaajid/prayer-times) TypeScript library. This calculator serves as both a practical prayer times tool and a demonstration of the library's capabilities.

## 🎯 Purpose

This web calculator has dual purposes:

1. **Library Testing Interface** - Test different calculation methods, validate results, and identify edge cases
2. **Practical Prayer Times Tool** - Calculate accurate prayer times for any location worldwide

Suitable for developers evaluating the library or users needing quick prayer time calculations.

## 🌟 Features

### Core Functionality

- **Location Support**: Address search with geocoding or manual coordinate entry
- **Multiple Calculation Methods**: All major Islamic calculation authorities
- **Madhab Selection**: Hanafi and Shafi/Maliki/Hanbali jurisprudence options
- **Time Range Options**: Single day, week, month, or full year calculations
- **Export Capabilities**: Copy to clipboard or download as CSV

### Technical Features

- **Timezone Handling**: Automatic detection with manual override options
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Clean Interface**: Accessible design with Islamic aesthetics
- **Real-time Updates**: Instant calculation updates as you change parameters

## 🚀 Live Demo

Visit the live calculator: [https://masaajid-hub.github.io/prayer-times-web/](https://masaajid-hub.github.io/prayer-times-web/)

## 🛠️ Development

This project uses Bun for development and building.

### Prerequisites

- [Bun](https://bun.sh/) installed

### Setup

```bash
# Clone the repository
git clone https://github.com/masaajid-hub/prayer-times-web.git
cd prayer-times-web

# Install dependencies
bun install

# Start development server
bun run dev
```

The development server will be available at `http://localhost:8000`.

### Build

```bash
# Build for production
bun run build
```

Built files will be in the `dist/` directory.

### Project Structure

```
src/
├── index.html       # Main calculator interface
├── main.js         # Core logic and library integration
└── style.css       # Styling and responsive design

dist/               # Built output (auto-generated)
serve.js           # Development server
package.json       # Dependencies and build scripts
```

## 📦 Dependencies

- [@masaajid/prayer-times](https://www.npmjs.com/package/@masaajid/prayer-times) - Core prayer times calculation library

## 🎯 Supported Calculation Methods

The calculator supports the following authoritative calculation methods:

- **Muslim World League** (MWL)
- **Egyptian General Authority** (Egypt)
- **University of Islamic Sciences, Karachi** (Karachi)
- **Umm Al-Qura University, Makkah** (UmmAlQura)
- **Dubai**
- **Moonsighting Committee** (Moonsighting)
- **Islamic Society of North America** (ISNA)
- **Qatar**
- **Singapore**
- **Jabatan Kemajuan Islam Malaysia** (JAKIM)
- **Kementerian Agama, Indonesia** (Kemenag)
- **Institute of Geophysics, University of Tehran** (Tehran)
- **Turkey Diyanet** (Turkey)
- **France (12°)** (France12)
- **France (15°)** (France15)
- **France (18°)** (France18)
- **Russia**

## 🌍 Browser Support

- Modern browsers with ES6+ support
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## 📱 Mobile Features

- Responsive design optimized for mobile devices
- GPS location detection
- Touch-friendly interface
- Proper viewport handling

## 🔧 GitHub Pages Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions. On every push to the main branch:

1. Dependencies are installed using Bun
2. The project is built
3. Built files are deployed to GitHub Pages

## 🤝 Contributing

We welcome contributions to improve this web calculator! Here's how you can help:

### Types of Contributions

#### 🐛 Bug Reports

- Found incorrect prayer time calculations? [Report issues](https://github.com/masaajid-hub/prayer-times-web/issues)
- Include: location, calculation method, expected vs actual times
- For calculation bugs, also check the [@masaajid/prayer-times library](https://github.com/masaajid-hub/prayer-times)

#### 💡 Feature Requests for Web Interface

- Suggest new export formats (JSON, XML, etc.)
- Request UI/UX improvements for better usability
- Propose mobile experience optimizations
- Suggest accessibility enhancements

#### 🔧 Code Contributions

- Fix UI bugs or improve responsiveness
- Enhance user experience features
- Add new export functionality
- Improve error handling and validation

### What NOT to Contribute Here

- **Prayer Time Calculation Logic**: This belongs in the [@masaajid/prayer-times library](https://github.com/masaajid-hub/prayer-times)
- **New Calculation Methods**: Submit these to the core library instead
- **Backend Features**: This is a frontend-only calculator
- **Major Feature Additions**: This is intentionally kept simple as a library testing tool

### Development Setup

1. Fork this repository
2. Clone your fork: `git clone https://github.com/yourusername/prayer-times-web.git`
3. Install dependencies: `bun install`
4. Start development: `bun run dev`
5. Make your changes
6. Test thoroughly with different locations and methods
7. Submit a Pull Request

### Pull Request Guidelines

- **Clear Description**: Explain what changes you made and why
- **Test Instructions**: How to test your changes
- **Screenshots**: For UI changes, include before/after screenshots
- **Browser Testing**: Ensure changes work on major browsers

### Questions?

- **Web Interface Issues**: Use [GitHub Issues](https://github.com/masaajid-hub/prayer-times-web/issues)
- **Calculation Problems**: Report to [@masaajid/prayer-times library](https://github.com/masaajid-hub/prayer-times)
- **General Discussion**: Join our community discussions

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🏗️ Part of Masaajid Platform

This web calculator is part of the larger [Masaajid Platform](https://github.com/masaajid-hub) ecosystem, which aims to connect Muslims with their local masjids and provide comprehensive mosque management tools.

## 🧪 Testing the Library

This web interface provides a way to test the `@masaajid/prayer-times` library:

### Test Scenarios

- **Edge Cases**: Try extreme coordinates (near poles, international date line)
- **Method Comparison**: Compare different calculation methods for the same location
- **Date Ranges**: Test leap years, seasonal changes, and long-term accuracy
- **Timezone Validation**: Verify correct local times across different zones

### Debugging Features

- **Console Logging**: Export functions provide detailed debugging information
- **Error Reporting**: Browser console shows specific calculation failures
- **CSV Export**: Download full year data for external validation

### Common Testing Areas

- High latitude locations (>60°) during summer/winter
- Locations near timezone boundaries
- Comparison with other prayer time sources
- Performance with large date ranges (full year calculations)

## 📞 Support & Questions

### For This Web Calculator

- [GitHub Issues](https://github.com/masaajid-hub/prayer-times-web/issues) - Report bugs or request features
- Include browser version, location tested, and steps to reproduce

### For Prayer Time Calculations

- [@masaajid/prayer-times Issues](https://github.com/masaajid-hub/prayer-times/issues) - Calculation accuracy or library bugs
- [npm Package](https://www.npmjs.com/package/@masaajid/prayer-times) - Library documentation and usage

### General Questions

- [Masaajid Platform](https://github.com/masaajid-hub) - Explore the full ecosystem
- [Discussions](https://github.com/masaajid-hub/prayer-times-web/discussions) - Community help and suggestions
