# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.2] - 2026-02-01

### Fixed
- Fixed TypeScript configuration for proper module resolution
- Resolved all 376 compilation errors
- Updated dependency versions for compatibility:
  - react-native-gesture-handler@2.14.1
  - react-native-screens@3.29.0
- Added @types/react and @types/react-native for proper type support

### Added
- Android native project setup with proper package naming (com.shopwell)
- Release APK build configuration
- Built first native release APK (23.4 MB)

### Changed
- Updated tsconfig.json with proper React Native settings
- Improved type declarations configuration

## [0.0.1] - 2026-01-31

### Added
- Initial project setup with React Native
- Cross-platform support for Android, iOS, and Windows
- Flat/minimal design system with custom color palette
- Shopping Lists feature
  - Create, edit, and delete shopping lists
  - Add items to lists with quantity tracking
  - Mark items as completed
  - Progress tracking for each list
  - Schedule shopping trips
- Shops feature
  - Add and manage shops
  - Categorize shops (Grocery, Pharmacy, Electronics, Clothing, Home Goods, Other)
  - Mark shops as favorites
  - Add address and notes
- Scheduling feature
  - Create shopping schedules
  - Link schedules to shops and lists
  - Recurring schedule support (daily, weekly, monthly)
  - Reminder configuration
  - Mark schedules as complete
- Settings screen
  - View app version
  - Clear all data option
  - Contact support link
- Local data persistence with AsyncStorage
- TypeScript for type safety
- React Navigation for screen management
- Context API for state management

### Technical
- Set up project structure with organized folders
- Implemented reusable UI components (Button, Card, Input, Checkbox, FAB, EmptyState)
- Created constants for colors, typography, and spacing
- Added utility functions for date formatting and ID generation
- Configured Metro bundler and Babel
