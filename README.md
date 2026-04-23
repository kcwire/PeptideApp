# 🧬 PeptideApp

A robust, offline-first React Native (Expo) application designed to help users accurately track peptide reconstitutions, manage injection schedules, and monitor vial inventory. 

PeptideApp eliminates the guesswork from peptide therapies by providing dynamic math conversions for BAC water, multi-subject dosage tracking, and rigorous local data persistence.

## ✨ Features

- **Reconstitution Calculator**: Automatically calculates the exact syringe pull (in units and mL) based on the vial's total mg content and the amount of bacteriostatic (BAC) water added.
- **Custom Blends**: Create protocols with multiple peptides mixed into a single vial (e.g., BPC-157 + TB-500).
- **Multi-Subject Tracking**: Ideal for users managing doses for themselves, a partner, or even a pet from the exact same vial. Automatically decrements the total vial volume based on distinct user doses.
- **Inventory Management**: Keep track of unopened boxes or reserve vials. Seamlessly "start the next vial" and pull from your digital inventory when a current protocol is completed.
- **Injection Logging**: One-click logging for "today", or manually log past injections. The UI dynamically tracks remaining doses and prevents logging beyond the vial's capacity.
- **Offline-First Privacy**: 100% of user data is stored locally on-device using a scalable, split-key `AsyncStorage` architecture. No cloud syncing, no accounts, complete privacy.

## 🛠 Tech Stack

- **Framework**: React Native with [Expo](https://expo.dev)
- **Routing**: Expo Router (v3+)
- **Language**: TypeScript (Strict Mode enabled)
- **Storage**: `@react-native-async-storage/async-storage`
- **Styling**: Vanilla React Native StyleSheet with custom dark/light theme support.

## 🏗 Architecture & Codebase

The project structure adheres to modern Expo best practices, separating the file-based routing mechanism from application logic:

- `/app`: Contains ONLY file-based routing screens and layout definitions (`(tabs)/`, `_layout.tsx`, etc.).
- `/components`: Reusable UI elements (`VialCard.tsx`, `DateInput.tsx`).
- `/context`: Global state management (`VialContext.tsx`), housing all the complex reconstitution math and database serialization.
- `/theme.js`: Centralized design system and color palette supporting dynamic light and dark modes.

*Note: In previous iterations, utility files lived inside `/app`. They have been explicitly decoupled to prevent Metro Bundler route collision and improve SEO/deep-linking.*

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo CLI / Expo Go app on your physical device, or an iOS/Android simulator.

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Start the Metro Bundler:
   ```bash
   npx expo start
   ```
   *(If you encounter a caching error regarding missing components, run `npx expo start -c` to clear the Metro cache.)*

3. Open the app:
   - Press `i` to open in the iOS Simulator.
   - Press `a` to open in the Android Emulator.
   - Scan the QR code with the Expo Go app on your physical device.

## 🔒 Security & Data Integrity

- **Input Sanitization**: All mathematical inputs are sanitized via custom `safeFloat` and `safeInt` utilities to prevent `NaN` database corruption.
- **Storage Scalability**: Injection logs are stored in separate AsyncStorage keys (`@peptide_logs_{vial.id}`) to prevent the core metadata object (`@peptide_vials`) from hitting memory limits as user history grows.
- **Type Safety**: The app operates with `strict: true` in `tsconfig.json`. Context arguments and arrays are strictly typed to prevent runtime callback errors.

## 🗺 Roadmap

- **Monetization (RevenueCat)**: Implementation plan documented in the `feature/monetization` branch. Requires ejecting to EAS Development Builds.
- **Cloud Syncing**: Future evaluation for Supabase/Firebase if cross-device syncing is requested by users.

---

*Built with ❤️ using React Native & Expo.*
