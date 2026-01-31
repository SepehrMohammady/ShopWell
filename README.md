# ShopWell

A cross-platform shopping list and shop management app built with React Native.

## Version

**0.0.1** - Initial Release

## Features

- 📝 **Shopping Lists**: Create and manage multiple shopping lists with items
- 🏪 **Shops**: Add and organize your favorite shops by category
- 📅 **Scheduling**: Plan your shopping trips with reminders
- 🔄 **Cross-Platform**: Works on Android, iOS, and Windows
- 💾 **Offline Storage**: All data stored locally on device
- 🎨 **Flat/Minimal Design**: Clean and modern UI

## Platforms

- **Android** (Primary focus)
- **iOS**
- **Windows**

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Visual Studio with React Native tools (for Windows development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/SepehrMohammady/ShopWell.git
cd ShopWell
```

2. Install dependencies:
```bash
npm install
```

3. Install iOS pods (macOS only):
```bash
cd ios && pod install && cd ..
```

### Running the App

#### Android
```bash
npm run android
```

#### iOS
```bash
npm run ios
```

#### Windows
```bash
npm run windows
```

## Project Structure

```
src/
├── App.tsx                 # Main app component
├── components/
│   └── common/            # Reusable UI components
├── constants/             # Colors, typography, spacing
├── context/               # React Context for state management
├── navigation/            # Navigation configuration
├── screens/               # App screens
├── services/              # Storage and other services
├── types/                 # TypeScript type definitions
└── utils/                 # Helper functions
```

## Tech Stack

- **React Native** - Cross-platform framework
- **TypeScript** - Type safety
- **React Navigation** - Navigation library
- **AsyncStorage** - Local data persistence
- **React Context** - State management

## Version History

### 0.0.1 (Initial Release)
- Initial project setup
- Shopping lists with items management
- Shops management with categories
- Schedule management with reminders
- Settings screen with data management
- Flat/minimal design system
- Cross-platform support (Android, iOS, Windows)

## License

This project is private.

## Author

ShopWell Team
