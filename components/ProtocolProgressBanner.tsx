import React from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { getStyles, colors } from '../theme';
import { safeFloat } from '../context/VialContext';
import { getProtocolPhaseForDate } from '../utils/protocolMath';

interface Props {
  vial: any;
  targetDate?: Date;
}

export default function ProtocolProgressBanner({ vial, targetDate = new Date() }: Props) {
  const theme = useColorScheme() ?? 'light';
  const styles = getStyles(theme);
  const c = colors[theme];

  if (!vial.protocolPhases || !Array.isArray(vial.protocolPhases) || vial.protocolPhases.length === 0) {
    return null;
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

  // Calculate total duration in weeks across all phases
  const totalWeeks = vial.protocolPhases.reduce((sum: number, p: any) => sum + (safeFloat(p.durationWeeks) || 1), 0);
  const percentComplete = Math.min(100, Math.round((currentWeek / Math.max(1, totalWeeks)) * 100));

  // Compute active phase info for targetDate
  const phaseInfo = getProtocolPhaseForDate(vial, targetDate);

  // Check if targetDate falls in Week 1 of a phase transition (i.e. first 7 days of a new phase)
  let accumulatedWeeks = 0;
  let isTransitionWeek = false;
  let prevDoseText = '';

  for (let i = 0; i < vial.protocolPhases.length; i++) {
    const p = vial.protocolPhases[i];
    const duration = safeFloat(p.durationWeeks) || 1;
    const phaseStartWeek = accumulatedWeeks + 1;
    
    if (i > 0 && currentWeek === phaseStartWeek) {
      isTransitionWeek = true;
      const prevPhase = vial.protocolPhases[i - 1];
      prevDoseText = `${prevPhase.doseAmount}${prevPhase.doseUnit}`;
      break;
    }
    accumulatedWeeks += duration;
  }

  return (
    <View style={{ backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 14 }}>
      {/* Header Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ fontWeight: '800', color: c.textMain, fontSize: 14 }}>
          📋 {vial.vialName || vial.name}
        </Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color: c.primary }}>
          Week {currentWeek} of {totalWeeks} ({percentComplete}%)
        </Text>
      </View>

      {/* Progress Bar Track */}
      <View style={{ height: 8, backgroundColor: c.inputBg, borderRadius: 4, overflow: 'hidden', marginVertical: 6 }}>
        <View style={{ height: '100%', width: `${percentComplete}%`, backgroundColor: vial.color || c.primary, borderRadius: 4 }} />
      </View>

      {/* Active Phase & Target Dose */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <Text style={{ fontSize: 12, color: c.textSub }}>
          Phase: <Text style={{ fontWeight: '700', color: c.textMain }}>{phaseInfo.phaseName || `Phase ${phaseInfo.phaseIndex + 1}`}</Text>
        </Text>
        <Text style={{ fontSize: 12, color: c.textSub }}>
          Target Dose: <Text style={{ fontWeight: '700', color: c.primary }}>{phaseInfo.doseAmount}{phaseInfo.doseUnit}</Text>
        </Text>
      </View>

      {/* Transition Alert Callout (Phase Escalation Week) */}
      {isTransitionWeek && (
        <View style={{ backgroundColor: c.warningBg, borderColor: c.warningBorder, borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 10 }}>
          <Text style={{ color: c.warningTextMain, fontWeight: '800', fontSize: 12 }}>
            🚀 Phase Escalation Week!
          </Text>
          <Text style={{ color: c.warningTextSub, fontSize: 12, marginTop: 2 }}>
            Target dose escalated from <Text style={{ fontWeight: '700' }}>{prevDoseText}</Text> ➔ <Text style={{ fontWeight: '700' }}>{phaseInfo.doseAmount}{phaseInfo.doseUnit}</Text>.
          </Text>
        </View>
      )}
    </View>
  );
}
