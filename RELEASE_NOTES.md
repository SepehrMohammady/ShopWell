# v0.0.12 — Unit Price Comparison, Shop Sorting & Quick Shop Creation

> **Covers all changes since v0.0.7 (v0.0.8 through v0.0.12)**

## New Features

### Unit Price Comparison (v0.0.11)
- Add **quantity** and **unit** (pcs, g, kg, ml, L) per brand/price entry
- All price comparisons now use **price-per-unit** when brands share the same unit type
- Example: €1 for 12 pieces (€0.083/pcs) vs €2 for 25 pieces (€0.080/pcs) — the app correctly identifies the second as cheaper
- Unit price shown alongside absolute price on Product Detail and Shop Mode screens

### Create Shop from Product Screen (v0.0.12)
- **"Add New Shop"** button at the top of the shop picker modal when adding brand/price entries
- If no shops exist yet, a prompt offers to navigate directly to shop creation
- No more need to leave the product form to create a missing shop

### Sorted Shop Lists (v0.0.12)
- Shops are now sorted **alphabetically** with **favorites pinned to the top**
- Applied everywhere: Shops tab and product pricing shop picker modal

### Shop Dropdown for Product Pricing (v0.0.8)
- Replaced inline shop selector with a clean modal dropdown for selecting shops when adding brand prices

### Online Shops (v0.0.8)
- Shops can be marked as **Online** with an optional URL field
- Online shops display with a web icon and URL in the shops list

### GPS Location & Map Picker (v0.0.9 – v0.0.10)
- Physical shops support GPS coordinates via **"Use My Location"** button
- **Map picker** with a fixed crosshair overlay — pan the map to position the pin
- Uses `react-native-maps` v1.10.3 with Google Maps provider

### Real Notifications (v0.0.8)
- Replaced placeholder notifications with **@notifee/react-native** for actual local notifications
- Two notification channels: `shop-nearby` and `schedule-reminders`

### Backup & Restore (v0.0.10)
- **Export** all app data as a CSV file via the system Share sheet
- **Import** from a CSV file using a document picker
- Now includes quantity and unit fields for full data fidelity

## Improvements

- **All emojis replaced** with `MaterialCommunityIcons` for consistent cross-device rendering (v0.0.8)
- **"Cheapest here" label** now applies to all brands sharing the minimum price, not just the first one (v0.0.9)
- **Removed Shopping List references** from the Schedule screen (v0.0.8)
- **Version bump script** (`npm run bump -- X.Y.Z`) keeps all 4 version locations in sync: `package.json`, `package-lock.json`, `Version.ts`, and `build.gradle` (v0.0.12)

## Housekeeping

- Cleaned up 9 auto-created git tags; only the manual `v0.0.7` release remains
- Removed redundant Shopping List data references

## Technical

- React Native 0.73.2
- react-native-maps 1.10.3
- @notifee/react-native 9.1.8
- @react-native-community/geolocation 3.4.0
- react-native-share + react-native-document-picker + react-native-fs (backup/restore)
