import { ProtocolConfig, ProtocolSupplyResult, PhaseCalculationResult, SubjectPhaseResult, TitrationPhase } from '../types/protocol';
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
 * Supports multi-subject dosage aggregation across all subjects.
 */
export const calculateProtocolSupplies = (config: ProtocolConfig): ProtocolSupplyResult => {
  const vialMg = safeFloat(config.reconstitution?.vialMg);
  const bacWaterMl = safeFloat(config.reconstitution?.bacWaterMl);
  const wasteBufferPercent = safeFloat(config.reconstitution?.wasteBufferPercent ?? 10);

  const concentrationMgMl = calculateConcentration(vialMg, bacWaterMl);

  let totalInjectionsCount = 0;
  let totalPeptideMgRequired = 0;
  let totalDurationWeeks = 0;

  const numSubjects = (config.isMultiSubject && config.subjects && config.subjects.length > 0) ? config.subjects.length : 1;

  const phaseResults: PhaseCalculationResult[] = (config.phases || []).map((phase: TitrationPhase) => {
    const durationWeeks = safeFloat(phase.durationWeeks);
    const doseAmount = safeFloat(phase.doseAmount);
    const doseMcg = phase.doseUnit === 'mg' ? doseAmount * 1000 : doseAmount;
    
    const injPerWeek = getInjectionsPerWeek(phase.frequency, phase.injectionsPerWeek, phase.selectedDays);
    const totalInjectionsPerSubject = Math.round(durationWeeks * injPerWeek);

    let phaseMgNeeded = 0;
    let subjectResults: SubjectPhaseResult[] | undefined = undefined;

    if (config.isMultiSubject && config.subjects && config.subjects.length > 0) {
      subjectResults = config.subjects.map(s => {
        const sDoseObj = (phase.subjectDoses || []).find(sd => sd.subjectId === s.id) || {
          doseAmount: phase.doseAmount,
          doseUnit: phase.doseUnit,
        };
        const sDoseAmount = safeFloat(sDoseObj.doseAmount);
        const sDoseMcg = sDoseObj.doseUnit === 'mg' ? sDoseAmount * 1000 : sDoseAmount;
        const sSyringeUnitsPull = calculateSyringeUnits(sDoseMcg, concentrationMgMl);
        return {
          subjectId: s.id,
          subjectName: s.name || 'Subject',
          doseAmount: sDoseAmount,
          doseUnit: (sDoseObj.doseUnit || 'mcg') as 'mg' | 'mcg',
          doseMcg: sDoseMcg,
          syringeUnitsPull: safeFloat(sSyringeUnitsPull.toFixed(1)),
        };
      });

      phaseMgNeeded = subjectResults.reduce((sum, sr) => sum + (totalInjectionsPerSubject * sr.doseMcg) / 1000, 0);
    } else {
      phaseMgNeeded = ((totalInjectionsPerSubject * doseMcg) / 1000) * numSubjects;
    }

    const totalPhaseInjections = totalInjectionsPerSubject * numSubjects;
    const syringeUnitsPull = calculateSyringeUnits(doseMcg, concentrationMgMl);

    totalDurationWeeks += durationWeeks;
    totalInjectionsCount += totalPhaseInjections;
    totalPeptideMgRequired += phaseMgNeeded;

    return {
      phaseId: phase.id,
      phaseName: phase.phaseName || 'Phase',
      durationWeeks,
      totalInjections: totalPhaseInjections,
      totalMgNeeded: safeFloat(phaseMgNeeded.toFixed(2)),
      doseMcg,
      syringeUnitsPull: safeFloat(syringeUnitsPull.toFixed(1)),
      subjectResults,
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
      if (daysPerVial > 45) {
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
export const getProtocolPhaseForDate = (vial: any, targetDate: Date) => {
  const phases: TitrationPhase[] = vial.protocolPhases || [];
  if (!phases || phases.length === 0) {
    return {
      phaseIndex: 0,
      phaseName: 'Standard Phase',
      doseAmount: vial.doseAmount || 0,
      doseUnit: vial.doseUnit || 'mcg',
      doseMcg: vial.doseUnit === 'mg' ? (vial.doseAmount || 0) * 1000 : (vial.doseAmount || 0),
      frequency: vial.frequency || 'Daily',
      selectedDays: vial.selectedDays || [],
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
  const currentWeek = Math.floor(diffDays / 7) + 1;

  let accumulatedWeeks = 0;
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const duration = safeFloat(phase.durationWeeks) || 1;
    accumulatedWeeks += duration;

    if (currentWeek <= accumulatedWeeks || i === phases.length - 1) {
      const doseAmount = safeFloat(phase.doseAmount);
      const doseMcg = phase.doseUnit === 'mg' ? doseAmount * 1000 : doseAmount;
      return {
        phaseIndex: i,
        phaseName: phase.phaseName || `Phase ${i + 1}`,
        doseAmount,
        doseUnit: phase.doseUnit || 'mcg',
        doseMcg,
        subjectDoses: phase.subjectDoses || [],
        frequency: phase.frequency || 'Daily',
        selectedDays: phase.selectedDays || [],
      };
    }
  }

  const lastPhase = phases[phases.length - 1];
  const lastDoseAmount = safeFloat(lastPhase.doseAmount);
  return {
    phaseIndex: phases.length - 1,
    phaseName: lastPhase.phaseName || 'Maintenance',
    doseAmount: lastDoseAmount,
    doseUnit: lastPhase.doseUnit || 'mcg',
    doseMcg: lastPhase.doseUnit === 'mg' ? lastDoseAmount * 1000 : lastDoseAmount,
    subjectDoses: lastPhase.subjectDoses || [],
    frequency: lastPhase.frequency || 'Daily',
    selectedDays: lastPhase.selectedDays || [],
  };
};
