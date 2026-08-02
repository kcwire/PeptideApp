# PeptideApp: Operational Guidelines & Architecture Standard for AI Agents

Welcome, autonomous AI agent or contributing developer. This file serves as your architectural source of truth, establishing engineering principles and development commandments designed to **minimize technical debt, prevent runtime regressions, and enforce enterprise-grade mobile application standards** within PeptideApp.

When executing automated refactorings, adding features, or debugging bugs, you are expected to operate with the rigor of a senior mobile application developer. Adhere strictly to the practices outlined below.

---

## 1. The Core Commandments of PeptideApp

### Commandment I: Respect File-Based Routing Boundaries (`/app`)
- **Rule:** The `/app` directory is strictly reserved for Expo Router navigation layouts and route screens (e.g., `(tabs)/`, `_layout.tsx`, `add.tsx`).
- **Forbidden:** Never place reusable UI components, helper utilities, state providers, or formatting scripts inside `/app`. 
- **Rationale:** Metro Bundler parses every file in `/app` as a navigable web or app route. Placing utility scripts in `/app` creates routing collisions, build warnings, and deep-linking issues. All non-screen code **must** reside in `/components`, `/context`, or dedicated utility folders (e.g., `/utils`).

### Commandment II: Defend Database Integrity & Zero NaN Corruption
- **Rule:** Never insert raw text strings or unverified math operands directly into React state or `AsyncStorage`.
- **Enforcement:** Every single numerical user input (mass, BAC water volume, syringe dosages, inventory counts) **must** pass through explicit validation boundaries using the context helpers:
  ```typescript
  import { safeFloat, safeInt } from '../context/VialContext';

  const sanitizedMg = safeFloat(rawInput); // Converts NaN / undefined / empty string -> 0
  const count = safeInt(rawCountInput);    // Enforces safe integer parsing
  ```
- **Rationale:** Because PeptideApp relies on persistent on-device JSON disk records without an active relational database schema engine, a single propagated `NaN` value can corrupt an entire patient or subject dosage history permanently.

### Commandment III: Obey Split-Key Storage Patterns
- **Rule:** Do **not** append injection history arrays (`logs`) into the main `@peptide_vials` AsyncStorage payload during disk serialization.
- **Enforcement:** Keep primary protocol metadata separated from historical logs:
  - Parent metadata goes to `@peptide_vials`.
  - Individual vial histories go to `@peptide_logs_{vial.id}`.
  - Always utilize `AsyncStorage.multiGet()` during hydration and `AsyncStorage.multiSet()` during saving to ensure atomic state updates.
- **Rationale:** In high-frequency logging environments over years of usage, bundling logs directly inside the parent metadata key leads to memory bloat, sluggish boot times, and potential stringified JSON size limits on low-memory mobile hardware.

### Commandment IV: Dynamic Theme Governance
- **Rule:** Never hardcode HEX colors, RGB values, or static color names directly inside inline style attributes or JSX markup.
- **Enforcement:** All visual components must dynamically adapt to system Light and Dark settings using `useColorScheme()` combined with the master design system in `theme.js`:
  ```typescript
  import { useColorScheme } from 'react-native';
  import { getStyles, colors } from '../theme';

  export default function MyComponent() {
    const theme = useColorScheme() ?? 'light';
    const styles = getStyles(theme); // Dynamic responsive Stylesheet
    const activeColors = colors[theme]; // Raw token access if needed
    // ...
  }
  ```
- **Rationale:** Hardcoding color strings instantly degrades accessibility, causes visual glitches in Dark Mode, and fragments brand identity across screens.

---

## 2. Strategies for Minimizing Technical Debt

### A. Prioritize Component Reusability
- **Don't Duplicate UI Blocks:** If you spot repeated visual elements—such as dose indicator badges, input form card layouts, confirmation modals, or date selectors—do not copy-paste JSX across screens in `app/(tabs)/`.
- **Extract to `/components`:** Create small, testable, and highly controlled React Native components (e.g., `VialCard.tsx`, `DateInput.tsx`). 
- **Stateless Presentational Design:** Design child components to receive state and dispatch functions via typed props rather than tightly coupling them directly to complex global storage queries whenever possible.

### B. Decouple Computational Math from Render Cycles
- As features evolve to include complex biological algorithms (e.g., peptide half-life decay charting, plasma concentration estimating, multi-compound mixing matrices), **do not inline these calculations within component render loops**.
- Move pure domain mathematics into dedicated utility modules (e.g., `/utils/calculations.ts` or within `VialContext.tsx`). This renders your formulas entirely unit-testable without requiring simulated DOM or native mobile mock hooks.

### C. Defend Performance via Memoization
- Mobile screens such as the Dashboard (`app/(tabs)/index.tsx`) execute heavy calendar date aggregations and array filters against historical logs on every state change.
- **Always wrap derivative array filtering and scheduling computation in `useMemo` hooks**:
  ```typescript
  const scheduledVials = useMemo(() => {
    return vials.filter(vial => /* logic */);
  }, [vials, selectedDateString]);
  ```
- Avoid instantiating new inline arrow functions inside massive lists if frame drop or UI stutter occurs; pass memoized callbacks with `useCallback`.

### D. Enforce Strict TypeScript Conformance
- PeptideApp operates under `"strict": true` in `tsconfig.json`.
- **Never suppress type failures using `@ts-ignore` or explicit blanket `any` overrides** when adding new features or data models. Define clear interfaces for protocols, inventory items, and injection logs to maintain architectural readability and code completion safety.

---

## 3. Development Workflow & Verification Checklist

Before finalizing any task or committing changes as an AI agent, review this mandatory checklist:

1. **Clear Metro Cache After Structural Moves:**
   - When moving components, restructuring folders, or modifying asset resolution, run:
     ```bash
     npx expo start -c
     ```
     This forces Metro Bundler to purge obsolete file-path caches and eliminates phantom unresolved dependency warnings.
2. **Verify Offline Capability:**
   - Do not introduce network polling, third-party analytics telemetry, or remote server API blockers unless explicitly requested by user feature specifications. The app must launch and log injections instantly in airplane mode.
3. **Check Edge-Case Mathematics:**
   - Validate zero-division safety: If a user enters `0` for BAC water volume or mass, ensure the app renders `0 Units` or an error notice rather than crashing with `Infinity` or `NaN`.
4. **Sanity Check Multi-Subject compatibility:**
   - Whenever updating dosage tracking logic or calendar rendering, verify that protocols utilizing an array of multiple subjects (`vial.subjects`) continue to calculate total mass depletion correctly alongside single-subject protocols.

---

## 4. Feature Implementation & Roadmap Guide

### Monetization & In-App Purchases (RevenueCat)
- When integrating RevenueCat paywalls or premium feature gating (documented in historical feature plans), encapsulate native native entitlements inside a dedicated provider (e.g., `SubscriptionContext.tsx`) or custom hook (`useProTier`).
- Do not pollute Core Domain views with bare native billing SDK calls. Keep premium UI locks conditional on clean boolean properties (e.g., `isProEnabled`).
- *Note:* Implementing native billing APIs requires ejecting from standard Expo Go into an **EAS Development Build** (`npx expo run:ios` or `npx expo run:android`).

### Data Import & Export Resiliency
- Any enhancements to data backup or cross-device restoration must funnel through the existing validation boundary (`restoreData` in `VialContext.tsx`), ensuring imported JSON payloads are assigned valid UUIDs, timestamp structures, and initialized fallback arrays (`peptides: []`, `inventory: []`, `logs: []`) to prevent crashing the runtime storage state.
