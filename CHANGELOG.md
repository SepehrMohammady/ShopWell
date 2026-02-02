# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.5] - 2026-02-02

### Added
- **Product Availability Tracking**: Products can now be marked as "Available" or "Need to Buy"
  - Shopping List view shows products you need to buy
  - Available view shows products you already have
  - Toggle availability directly from product list or detail screen
- **Multi-Brand Pricing**: Products can now have multiple brands with different prices at each shop
  - Add unlimited brand/price combinations per shop
  - See all brand options when viewing a product
  - Compare prices across brands and shops
- **Best Shop Recommendations**: When viewing shopping list, see the best shop to buy from
  - Shows how many items available at each shop
  - Displays estimated total cost
  - Navigate directly to shop mode

### Changed
- **Updated Categories**: New product categories to better match shopping needs
  - Personal Care (was Health & Beauty)
  - Health & Wellness (new)
  - Household
  - Beverages (new)
  - Food
  - Other
  - Removed: Electronics, Clothing
- **Removed Default Unit**: Product unit field was removed as it was not useful
- **Enhanced Price Display**: Shows price ranges and multiple brand options

### Technical
- Renamed ShopProduct to ShopProductBrand with new `brand` field
- Added `isAvailable` boolean to Product interface
- Updated AppContext with new helper functions for shopping list
- New helper: getBestShopsForShoppingList for shop recommendations
- Updated all screens to work with new brand-based pricing model

## [0.0.4] - 2026-02-02

### Added
- **Product Management**: New Products tab with full CRUD operations
  - Add products with categories (Food, Health & Beauty, Household, Electronics, Clothing, Other)
  - Set prices for products at different shops
  - View price comparisons across all shops
- **Shop Mode**: "Shop Here" feature when viewing a shop
  - See all products available at selected shop
  - Price comparison warnings when products are cheaper elsewhere
  - Filter by category, toggle to show only items with warnings
- **Location-Based Notifications** (infrastructure)
  - Add GPS coordinates to shops for geofencing
  - Configure notification radius per shop (100m, 200m, 500m, 1km)
  - Toggle "Notify when nearby" for individual shops
  - Master toggle in Settings for location notifications
- **Price Comparison System**
  - Automatic detection of cheapest shop for each product
  - Savings calculations displayed in Shop Mode
  - "Best price" badges for cheapest options
- **Enhanced Settings**
  - Location notifications toggle with permission handling
  - Default geofence radius configuration
  - Improved data clearing to include products

### Changed
- Extended Shop model with location fields (latitude, longitude, geofenceRadius, notifyOnNearby)
- Extended AppContext with products, shopProducts, and settings management
- Added Products tab to main navigation (5 tabs total)
- Updated AndroidManifest with location and notification permissions

### Technical
- New types: Product, ShopProduct, ProductCategory, PriceComparison, AppSettings
- New screens: ProductsScreen, AddEditProductScreen, ProductDetailScreen, ShopModeScreen
- New services: LocationService, NotificationService
- New utilities: priceHelper.ts with price comparison functions

## [0.0.3] - 2026-02-01

### Added
- **Dark Mode Support**: Automatic system theme detection with Light/Dark/System options
- **Theme Settings**: Users can now choose between Light, Dark, or System theme in Settings
- **Centralized Version Management**: Single source of truth for app version (src/constants/Version.ts)
- **App Icons**: Added custom app icons from assets folder to Android mipmap resources

### Fixed
- **App Crash Fix**: Fixed crash when creating lists, shops, or schedules (replaced uuid library with native implementation)
- **Version Sync**: All version references now centralized and in sync across:
  - package.json
  - android/app/build.gradle
  - Settings screen
  - Version.ts constant

### Changed
- Updated all screens and components to support dynamic theming
- Migrated from static Colors to useTheme hook for runtime color updates
- Improved navigation theming with proper dark mode support
- Updated UI components (Card, Button, Input, etc.) to use theme context

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
