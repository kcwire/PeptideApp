export interface ProtocolSubject {
  id: string;
  name: string; // e.g., "Subject 1", "Subject 2"
}

export interface SubjectPhaseDose {
  subjectId: string;
  subjectName?: string;
  doseAmount: number;
  doseUnit: 'mg' | 'mcg';
}

export interface TitrationPhase {
  id: string;
  phaseName: string;         // e.g., "Ramp-up Phase 1", "Maintenance"
  durationWeeks: number;     // Length of phase in weeks
  doseAmount: number;        // Default / Primary subject dose
  doseUnit: 'mg' | 'mcg';    // Dose unit
  subjectDoses?: SubjectPhaseDose[]; // Per-subject dose overrides if multi-subject
  frequency: string;         // 'Daily' | 'Weekly' | 'Every 2 Days' | 'Every 3 Days' | 'Mon-Fri' | 'Specific Days'
  selectedDays?: string[];   // Array of days e.g. ['Mon', 'Thu'] when frequency is 'Specific Days'
  injectionsPerWeek: number; // Derived or explicit injections per week
}

export interface ReconstitutionSpec {
  vialMg: number;               // Total mass per vial (e.g. 5mg, 10mg)
  bacWaterMl: number;           // BAC water volume per vial in mL (e.g. 2ml)
  syringeCapacityUnits: number; // Syringe capacity in Units (e.g. 100 for U-100)
  wasteBufferPercent: number;   // Syringe buffer percentage (e.g. 10 for 10%)
}

export interface ProtocolPeptideItem {
  name: string;
  mg: number;
}

export interface ProtocolConfig {
  id: string;
  name: string;
  notes?: string;
  peptides?: ProtocolPeptideItem[]; // List of peptides for single or mixed blend vials
  isMultiSubject?: boolean;
  subjects?: ProtocolSubject[];     // List of subjects sharing this protocol
  phases: TitrationPhase[];
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
  syringeUnitsPull: number;  // Tick marks on U-100 syringe
}

export interface ProtocolSupplyResult {
  protocolId: string;
  totalDurationWeeks: number;
  totalInjectionsCount: number;
  totalPeptideMgRequired: number;
  vialsRequired: number;
  totalBacWaterMlRequired: number;
  totalSyringesRequired: number;
  concentrationMgMl: number;
  phases: PhaseCalculationResult[];
  vialExpirationWarning: boolean; // True if a single reconstituted vial lasts > 45 days
}
