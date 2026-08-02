import { ProtocolConfig, ProtocolSupplyResult, PhaseCalculationResult, TitrationPhase } from '../types/protocol';
import { safeFloat } from '../context/VialContext';

/**
 * Derives the number of injections per week for a given frequency key and selectedDays array.
 */
export const getInjectionsPerWeek = (frequency: string, customCount?: number, selectedDays?: string[]): number => {
  switch (frequency) {
    case 'Daily':
      return 7;
    case 'Weekly':
      return 1;
    case 'Every 2 Days':
      return 3.5;
    case 'Every 3 Days':
      return 2.333;
    case 'Mon-Fri':
      return 5;
    case 'Specific Days':
      return selectedDays && selectedDays.length > 0 ? selectedDays.length : 1;
    case 'Mon/Thu':
    case 'Twice Weekly':
      return 2;
    default:
      return safeFloat(customCount) > 0 ? safeFloat(customCount) : 1;
  }
};

/**
 * Calculates concentration in mg/mL.
 * Enforces zero-division protection.
 */
export const calculateConcentration = (vialMg: number, bacWaterMl: number): number => {
  const safeMg = safeFloat(vialMg);
  const safeMl = safeFloat(bacWaterMl);
  if (safeMl <= 0 || safeMg <= 0) return 0;
  return safeMg / safeMl;
};

/**
 * Calculates U-100 syringe units pull for a given dose in mcg and concentration in mg/mL.
 */
export const calculateSyringeUnits = (doseMcg: number, concentrationMgMl: number): number => {
  const sDose = safeFloat(doseMcg);
  const sConc = safeFloat(concentrationMgMl);
  if (sConc <= 0 || sDose <= 0) return 0;
  return sDose / (sConc * 10);
};

/**
 * Calculates supply requirements for an entire peptide protocol configuration.
 */
export const calculateProtocolSupplies = (config: ProtocolConfig): ProtocolSupplyResult => {
  const vialMg = safeFloat(config.reconstitution?.vialMg);
  const bacWaterMl = safeFloat(config.reconstitution?.bacWaterMl);
  const wasteBufferPercent = safeFloat(config.reconstitution?.wasteBufferPercent ?? 10);

  const concentrationMgMl = calculateConcentration(vialMg, bacWaterMl);

  let totalInjectionsCount = 0;
  let totalPeptideMgRequired = 0;
  let totalDurationWeeks = 0;

  const phaseResults: PhaseCalculationResult[] = (config.phases || []).map((phase: TitrationPhase) => {
    const durationWeeks = safeFloat(phase.durationWeeks);
    const doseAmount = safeFloat(phase.doseAmount);
    const doseMcg = phase.doseUnit === 'mg' ? doseAmount * 1000 : doseAmount;
    
    const injPerWeek = getInjectionsPerWeek(phase.frequency, phase.injectionsPerWeek, phase.selectedDays);
    const totalInjections = Math.round(durationWeeks * injPerWeek);
    const totalMgNeeded = (totalInjections * doseMcg) / 1000;

    const syringeUnitsPull = calculateSyringeUnits(doseMcg, concentrationMgMl);

    totalDurationWeeks += durationWeeks;
    totalInjectionsCount += totalInjections;
    totalPeptideMgRequired += totalMgNeeded;

    return {
      phaseId: phase.id,
      phaseName: phase.phaseName || 'Phase',
      durationWeeks,
      totalInjections,
      totalMgNeeded: safeFloat(totalMgNeeded.toFixed(2)),
      doseMcg,
      syringeUnitsPull: safeFloat(syringeUnitsPull.toFixed(1)),
    };
  });

  const vialsRequired = vialMg > 0 ? Math.ceil(totalPeptideMgRequired / vialMg) : 0;
  const totalBacWaterMlRequired = safeFloat((vialsRequired * bacWaterMl).toFixed(1));
  const totalSyringesRequired = Math.ceil(totalInjectionsCount * (1 + wasteBufferPercent / 100));

  let vialExpirationWarning = false;
  if (vialMg > 0 && totalInjectionsCount > 0 && totalDurationWeeks > 0) {
    const avgDailyMgConsumption = totalPeptideMgRequired / (totalDurationWeeks * 7);
    if (avgDailyMgConsumption > 0) {
      const daysPerVial = vialMg / avgDailyMgConsumption;
      if (daysPerVial > 28) {
        vialExpirationWarning = true;
      }
    }
  }

  return {
    protocolId: config.id,
    totalDurationWeeks: safeFloat(totalDurationWeeks.toFixed(1)),
    totalInjectionsCount,
    totalPeptideMgRequired: safeFloat(totalPeptideMgRequired.toFixed(2)),
    vialsRequired,
    totalBacWaterMlRequired,
    totalSyringesRequired,
    concentrationMgMl: safeFloat(concentrationMgMl.toFixed(2)),
    phases: phaseResults,
    vialExpirationWarning,
  };
};

/**
 * Computes the active titration phase, dose, and frequency for a given vial on any target calendar date.
 */
export const getProtocolPhaseForDate = (vial: any, targetDate: Date = new Date()) => {
  if (!vial.protocolPhases || !Array.isArray(vial.protocolPhases) || vial.protocolPhases.length === 0) {
    const doseAmount = safeFloat(vial.doseAmount || vial.doseMcg || 0);
    const doseUnit = vial.doseUnit || 'mcg';
    const doseMcg = doseUnit === 'mg' ? doseAmount * 1000 : doseAmount;
    return {
      doseAmount,
      doseUnit,
      doseMcg,
      frequency: vial.frequency || 'Daily',
      selectedDays: vial.selectedDays || [],
      phaseName: null,
      phaseIndex: 0,
    };
  }

  const startDateStr = vial.startDate || vial.dateReconstituted || new Date().toISOString().split('T')[0];
  let startMidnight = new Date().getTime();
  
  if (startDateStr && typeof startDateStr === 'string' && startDateStr.includes('-')) {
    const [sYear, sMonth, sDay] = startDateStr.split('-').map((n: string) => parseInt(n, 10));
    startMidnight = new Date(sYear, sMonth - 1, sDay).getTime();
  }

  const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
  const diffDays = Math.max(0, Math.floor((targetMidnight - startMidnight) / (1000 * 60 * 60 * 24)));
  const diffWeeks = diffDays / 7;

  let accumulatedWeeks = 0;
  let activePhase = vial.protocolPhases[vial.protocolPhases.length - 1]; // fallback to last phase
  let activeIndex = vial.protocolPhases.length - 1;

  for (let i = 0; i < vial.protocolPhases.length; i++) {
    const p = vial.protocolPhases[i];
    const durationWeeks = safeFloat(p.durationWeeks) || 1;
    if (diffWeeks < accumulatedWeeks + durationWeeks) {
      activePhase = p;
      activeIndex = i;
      break;
    }
    accumulatedWeeks += durationWeeks;
  }

  const doseAmount = safeFloat(activePhase.doseAmount);
  const doseUnit = activePhase.doseUnit || 'mcg';
  const doseMcg = doseUnit === 'mg' ? doseAmount * 1000 : doseAmount;

  return {
    doseAmount,
    doseUnit,
    doseMcg,
    frequency: activePhase.frequency || vial.frequency || 'Daily',
    selectedDays: activePhase.selectedDays || vial.selectedDays || [],
    phaseName: activePhase.phaseName || `Phase ${activeIndex + 1}`,
    phaseIndex: activeIndex,
  };
};
