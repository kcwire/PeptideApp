# PeptideApp: Architectural Document & System Design

This document details the software architecture, domain modeling, state persistence strategies, and design patterns governing **PeptideApp**. It is authored from an enterprise and production-grade mobile engineering perspective to ensure scalability, data integrity, and zero technical debt as the application evolves.

---

## 1. Executive Summary & Design Principles

PeptideApp is an **offline-first, highly responsive React Native mobile application** built on top of Expo and Expo Router. The platform assists clinicians, researchers, and personal users in calculating precise peptide reconstitutions, managing multi-subject dosage logs, and monitoring physical vial inventories.

### Core Architectural Principles:
1. **Offline-First & Zero-Knowledge Privacy:** All user protocol metadata, medical schedules, and dosage histories are persisted entirely on-device via local storage. There is no enforced cloud reliance, avoiding network latency and HIPAA/privacy liability.
2. **Defensive Data Integrity:** All numerical inputs (mass, volume, counts, dosages) are enforced through strict sanitization boundaries before reaching global state or persistent storage, completely preventing NaN propagation or database corruption.
3. **Strict Separation of Concerns:** Application logic, computational math, visual styling, and routing mechanics are physically decoupled across distinct functional architectural layers.

---

## 2. System Architecture & Directory Structure

To prevent bundler routing collisions and maintain an extensible codebase, PeptideApp enforces a rigorous separation between routing endpoints, view components, business state, and styling tokens.

```
PeptideApp/
├── app/               # Layer 1: Routing & Screen Endpoints ONLY (Expo Router v6)
│   ├── _layout.tsx    # Root layout initializing global providers (VialProvider)
│   └── (tabs)/        # Bottom tab navigation structure & primary screens
├── components/        # Layer 2: Reusable UI & Presentational Components
│   ├── VialCard.tsx   # Protocol summary, mixing math display, and quick action cards
│   └── DateInput.tsx  # Cross-platform interactive date picker wrapper
├── context/           # Layer 3: State Management & Data Access Layer (DAL)
│   └── VialContext.tsx# Global UI state, persistence engine, and reconstitution calculations
└── theme.js           # Layer 4: Design System, Styling Tokens & Dynamic Style Factories
```

### Layer Responsibilities:
- **`app/` (Routing Layer):** Governs navigation flows and page layouts using file-based routing. **No business utilities, persistent data structures, or pure calculation helper files may reside here**, as Metro Bundler treats all files within `app/` as navigable route URLs.
- **`components/` (Presentational Layer):** Encapsulates visual markup and interactive widgets. Components receive data via React props and dispatch actions to the Context DAL. They should remain decoupled from direct AsyncStorage calls.
- **`context/` (Business Logic & DAL):** Acts as the single source of truth for protocol state. It serializes and hydrates state to storage, performs complex scheduling queries, and safely transforms input mutations.
- **`theme.js` (Design System Layer):** Houses harmonious color sets (Light and Dark mode) and exports dynamic style sheet generators (`getStyles(theme)`) to ensure brand consistency across devices and theme toggles.

---

## 3. Data & Persistence Architecture (Split-Key Storage)

A critical bottleneck in React Native applications using simple key-value storage (`AsyncStorage`) is **memory bloat caused by unbounded log growth**. Storing thousands of dosage records inside a single monolithic array causes massive CPU spiking and dropped frames during JSON deserialization on mobile devices.

### Split-Key Design Solution:
PeptideApp avoids monolithic storage bottlenecks by separating core entity metadata from transaction histories:

```
+-----------------------------------------------------------------------+
| Core Protocol Metadata (@peptide_vials)                              |
| -> Array of Objects [ { id, vialName, bacWaterMl, inventory, ... } ]  |
+-----------------------------------------------------------------------+
                                  |
                                  +--- Ref: ID ---> +---------------------------------------------+
                                                    | Injection History Log (@peptide_logs_{id})  |
                                                    | -> Array of Logs [ { timestamp, dose, ... }]|
                                                    +---------------------------------------------+
```

1. **`@peptide_vials`:** Contains lightweight metadata for all active and archived protocols (names, target ratios, frequencies, and physical inventory counts). This block can be queried instantly without memory strain.
2. **`@peptide_logs_{vial.id}`:** Isolated storage keys dedicated exclusively to individual protocol injection histories. When the application boots, `AsyncStorage.multiGet()` in `loadVials()` reconciles these separate streams into a cohesive in-memory representation.
3. **Atomic Multi-Writes:** State alterations involving logging or editing utilize `AsyncStorage.multiSet()` to guarantee atomic persistence between parent protocols and their child log streams.

---

## 4. Domain & Mathematical Modeling

The core utility of PeptideApp rests on its precise reconstitution calculation engine. All computations must account for single and multi-subject dosage splits from shared compounding vials.

### Core Formulas:

1. **Primary Peptide Concentration ($C$):**
   $$C \ (\text{mg/ml}) = \frac{\text{Peptide Mass (mg)}}{\text{BAC Water Volume (ml)}}$$

2. **Target Syringe Volume ($V$):**
   $$V \ (\text{ml}) = \frac{\text{Target Dose (mcg)} / 1000}{C}$$

3. **Insulin Syringe Pull (in Units):**
   $$\text{Units} = V \times 100$$

4. **Remaining Vial Capacity:**
   $$\text{Doses Left (Current)} = \left\lfloor \frac{\text{Total Mass (mcg)} - \sum \text{Doses Logged Since Recon (mcg)}}{\text{Current Dose Consumption (mcg)}} \right\rfloor$$

5. **Cycle Capacity (Current + Reserve Inventory):**
   $$\text{Cycle Doses Left} = \left\lfloor \frac{\text{Current Residual Mass (mg)} + \sum (\text{Inventory Mass} \times \text{Count})}{\text{Current Dose Consumption (mg)}} \right\rfloor$$

### Multi-Subject & Custom Blend Handling:
- **Custom Blends:** Protocols can contain an array of peptides mixed into one bottle (e.g., *BPC-157 + TB-500*). Calculations hinge on the *primary peptide ratio* while retaining secondary mass records for UI awareness.
- **Multi-Subject Tracking:** Protocols can contain a `subjects` array (e.g., self, partner, pet). In multi-subject mode, total daily consumption is computed as the algebraic sum of all subject doses, accurately accelerating vial depletion in real time.

---

## 5. State Management & Unidirectional Flow

The app adheres to a predictable **Unidirectional Data Flow** pattern driven by `VialContext`:

1. **Action Trigger:** User taps an interactive control (e.g., `Log Injection`, `Start Next Vial`, or `Edit Protocol`) inside a screen or reusable component.
2. **DAL Invocation:** Component invokes a contextual dispatcher (`logInjection(id, amount, unit, ...)`, `updateVial(...)`, or `startNextVial(...)`).
3. **State Synthesis:** The Context DAL validates operands via `safeFloat` / `safeInt`, merges timestamps, and executes functional updates against the immutable React state array (`vials`).
4. **Persistent Synchronization:** Immediately following React state hydration, the DAL commits updated representations to local `AsyncStorage` via atomic parallel disk writes.

---

## 6. Design System & Dynamic Theme Styling

PeptideApp eschews third-party CSS compilers (like native Tailwind ports) in favor of **Vanilla React Native StyleSheet with functional factories**. This maximizes runtime render speed by preventing JavaScript hook overhead during frame transitions.

### Key Tokens in `theme.js`:
- **Harmonized Color Palettes (`colors.light` & `colors.dark`):** Defines semantic roles (e.g., `card`, `cardDone`, `primary`, `successBg`, `resultBorder`, `warningBg`) rather than static color names.
- **Vial Identifiers (`vialColors`):** A curated array of vibrant accent colors tested for contrast ratios against both dark and light backgrounds.
- **Dynamic Factory (`getStyles(theme)`):** Functions consuming the system color scheme (`useColorScheme()`) to yield optimized style objects. All visual components invoke this generator to seamlessly adapt to system light/dark mode adjustments without requiring manual component restarts.
