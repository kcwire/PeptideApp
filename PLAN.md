# PeptideApp Protocol Planner - Parallel Agent Task Execution Plan (`PLAN.md`)

This document outlines the architectural roadmap and modular task breakdown for implementing **Peptide Protocols with Titration Ramp-Up and Supply Calculations** in PeptideApp. 

---

## Confirmed User Specifications
1. **Titration Schedule**: Option A - Flexible multi-phase builder where each phase explicitly defines its duration (in weeks), dosage, and injection frequency.
2. **Syringe Buffer**: Include configurable waste/primer safety buffer (defaulting to +10% extra syringes).
3. **Dashboard Integration**: Protocols can be converted directly into active tracking vials on the Dashboard.

---

## Architectural Overview & Commandments

All participating AI agents **MUST** strictly adhere to `/Users/kcwire/workspace/PeptideApp/AGENTS.md`:
1. **Commandment I (File-Based Routing Boundaries):** Route screens ONLY in `/app`. Helper math, state providers, and components MUST reside in `/utils`, `/context`, `/types`, or `/components`.
2. **Commandment II (Zero NaN Corruption):** All numerical parsing MUST pass through `safeFloat` and `safeInt`.
3. **Commandment III (Split-Key Storage):** Store protocol configs under `@peptide_protocols` separately from active vials and injection logs.
4. **Commandment IV (Dynamic Theme Governance):** Use `getStyles(theme)` from `theme.js` and `useColorScheme()`. No hardcoded HEX colors.

---

## Domain Model Specification

### Protocol & Titration Data Schema
```typescript
export interface TitrationPhase {
  id: string;
  phaseName: string;         // e.g., "Ramp-up Phase 1", "Maintenance"
  durationWeeks: number;     // Length of this phase in weeks
  doseAmount: number;        // Dose quantity
  doseUnit: 'mg' | 'mcg';    // Dose unit
  frequency: 'Daily' | 'Weekly' | 'Every 2 Days' | 'Every 3 Days' | 'Mon/Thu' | 'Custom';
  injectionsPerWeek: number; // Injections per week for this phase
}

export interface ReconstitutionSpec {
  vialMg: number;               // Mass of peptide per vial (e.g., 5mg, 10mg)
  bacWaterMl: number;           // BAC water added per vial (e.g., 2ml)
  syringeCapacityUnits: number; // e.g. 100 Units (1ml U-100 syringe)
  wasteBufferPercent: number;   // Syringe safety buffer (default 10%)
}

export interface ProtocolConfig {
  id: string;
  name: string;              // e.g., "Tirzepatide 12-Week Titration"
  notes?: string;
  phases: TitrationPhase[];  // Array of sequential titration periods
  reconstitution: ReconstitutionSpec;
  createdAt: string;
  isArchived?: boolean;
}

export interface PhaseCalculationResult {
  phaseId: string;
  phaseName: string;
  durationWeeks: number;
  totalInjections: number;
  totalMgNeeded: number;
  doseMcg: number;
  syringeUnitsPull: number;  // Syringe tick marks for U-100
}

export interface ProtocolSupplyResult {
  protocolId: string;
  totalDurationWeeks: number;
  totalInjectionsCount: number;
  totalPeptideMgRequired: number;
  vialsRequired: number;           // Math.ceil(totalPeptideMgRequired / vialMg)
  totalBacWaterMlRequired: number; // vialsRequired * bacWaterMl
  totalSyringesRequired: number;    // Math.ceil(totalInjectionsCount * (1 + wasteBufferPercent / 100))
  concentrationMgMl: number;
  phases: PhaseCalculationResult[];
  vialExpirationWarning: boolean;   // Flag if 1 vial reconstituted lasts > 28-30 days
}
```

---

## Task Board & Execution Plan

- [x] **TASK-101**: Core Types & Pure Calculation Engine (`types/protocol.ts`, `utils/protocolMath.ts`)
- [x] **TASK-102**: Protocol State Provider & Active Vial Integration (`context/ProtocolContext.tsx`, `app/_layout.tsx`)
- [x] **TASK-103**: Titration Builder & Supply Summary Components (`components/TitrationPhaseBuilder.tsx`, `components/ProtocolSupplySummary.tsx`)
- [x] **TASK-104**: Router Screen & Navigation (`app/(tabs)/protocol.tsx`, `app/(tabs)/_layout.tsx`)
- [x] **TASK-105**: E2E Verification & Walkthrough
