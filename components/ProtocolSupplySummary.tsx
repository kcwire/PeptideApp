import React from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { ProtocolSupplyResult } from '../types/protocol';
import { getStyles, colors } from '../theme';

interface Props {
  supplies: ProtocolSupplyResult;
}

export default function ProtocolSupplySummary({ supplies }: Props) {
  const theme = useColorScheme() ?? 'light';
  const styles = getStyles(theme);
  const c = colors[theme];

  return (
    <View style={{ marginVertical: 12 }}>
      <Text style={[styles.sectionTitle, { fontSize: 16, marginBottom: 10 }]}>📊 Protocol Supply Calculation</Text>

      {/* Main Metric Cards Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        {/* Total Peptide & Vials */}
        <View style={{ flex: 1, minWidth: '45%', backgroundColor: c.primaryBg, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: c.primary }}>
          <Text style={{ fontSize: 12, color: c.primary, fontWeight: '700', textTransform: 'uppercase' }}>Peptide Required</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: c.textMain, marginTop: 4 }}>
            {supplies.totalPeptideMgRequired} <Text style={{ fontSize: 14 }}>mg</Text>
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: c.primary, marginTop: 4 }}>
            🧪 {supplies.vialsRequired} {supplies.vialsRequired === 1 ? 'Vial' : 'Vials'} needed
          </Text>
        </View>

        {/* Total BAC Water */}
        <View style={{ flex: 1, minWidth: '45%', backgroundColor: c.mixBg, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: c.mixBorder }}>
          <Text style={{ fontSize: 12, color: c.mixLabel, fontWeight: '700', textTransform: 'uppercase' }}>BAC Water</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: c.mixValue, marginTop: 4 }}>
            {supplies.totalBacWaterMlRequired} <Text style={{ fontSize: 14 }}>mL</Text>
          </Text>
          <Text style={{ fontSize: 12, color: c.textSub, marginTop: 4 }}>
            💧 Reconstitution volume
          </Text>
        </View>

        {/* Total Syringes */}
        <View style={{ flex: 1, minWidth: '45%', backgroundColor: c.resultBg, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: c.resultBorder }}>
          <Text style={{ fontSize: 12, color: c.resultLabel, fontWeight: '700', textTransform: 'uppercase' }}>Syringes Needed</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: c.resultValue, marginTop: 4 }}>
            {supplies.totalSyringesRequired}
          </Text>
          <Text style={{ fontSize: 12, color: c.textSub, marginTop: 4 }}>
            💉 {supplies.totalInjectionsCount} injections + buffer
          </Text>
        </View>

        {/* Total Duration */}
        <View style={{ flex: 1, minWidth: '45%', backgroundColor: c.card, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: c.border }}>
          <Text style={{ fontSize: 12, color: c.textSub, fontWeight: '700', textTransform: 'uppercase' }}>Total Length</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: c.textMain, marginTop: 4 }}>
            {supplies.totalDurationWeeks} <Text style={{ fontSize: 14 }}>Weeks</Text>
          </Text>
          <Text style={{ fontSize: 12, color: c.textSub, marginTop: 4 }}>
            ⏱️ {supplies.phases.length} Titration Phases
          </Text>
        </View>
      </View>

      {/* Vial Expiration Warning Callout */}
      {supplies.vialExpirationWarning && (
        <View
          style={{
            backgroundColor: c.warningBg,
            borderColor: c.warningBorder,
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: c.warningTextMain, fontWeight: '700', fontSize: 13 }}>
            ⚠️ Reconstitution Shelf-Life Warning
          </Text>
          <Text style={{ color: c.warningTextSub, fontSize: 12, marginTop: 2 }}>
            Based on current low titration dosage, a single reconstituted vial may last longer than 45 days. Consider using smaller vial sizes to preserve peptide stability.
          </Text>
        </View>
      )}

      {/* Per-Phase Syringe Pull Breakdown Table */}
      <View style={{ backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14 }}>
        <Text style={{ fontWeight: '700', color: c.textMain, fontSize: 14, marginBottom: 10 }}>
          💉 Titration Syringe Pull Schedule (U-100)
        </Text>

        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: 6, marginBottom: 6 }}>
          <Text style={{ flex: 2, fontWeight: '700', color: c.textSub, fontSize: 12 }}>Phase</Text>
          <Text style={{ flex: 1, fontWeight: '700', color: c.textSub, fontSize: 12, textAlign: 'center' }}>Dose</Text>
          <Text style={{ flex: 1, fontWeight: '700', color: c.textSub, fontSize: 12, textAlign: 'center' }}>Duration</Text>
          <Text style={{ flex: 1, fontWeight: '700', color: c.primary, fontSize: 12, textAlign: 'right' }}>Syringe Pull</Text>
        </View>

        {supplies.phases.map(phase => (
          <View key={phase.phaseId} style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border }}>
            <Text style={{ flex: 2, color: c.textMain, fontWeight: '600', fontSize: 13 }}>{phase.phaseName}</Text>
            <Text style={{ flex: 1, color: c.textMain, fontSize: 13, textAlign: 'center' }}>
              {phase.doseMcg >= 1000 ? `${phase.doseMcg / 1000}mg` : `${phase.doseMcg}mcg`}
            </Text>
            <Text style={{ flex: 1, color: c.textSub, fontSize: 13, textAlign: 'center' }}>{phase.durationWeeks}w</Text>
            <Text style={{ flex: 1, color: c.primary, fontWeight: '800', fontSize: 13, textAlign: 'right' }}>
              {phase.syringeUnitsPull} <Text style={{ fontSize: 10 }}>Units</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
