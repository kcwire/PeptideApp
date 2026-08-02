import React from 'react';
import { View, Text, TextInput, TouchableOpacity, useColorScheme } from 'react-native';
import { TitrationPhase } from '../types/protocol';
import { getStyles, colors } from '../theme';
import { safeFloat } from '../context/VialContext';
import FrequencyPicker from './FrequencyPicker';

interface Props {
  phases: TitrationPhase[];
  onChangePhases: (phases: TitrationPhase[]) => void;
}

const FREQUENCY_OPTIONS = ['Daily', 'Mon-Fri', 'Specific Days'];

export default function TitrationPhaseBuilder({ phases, onChangePhases }: Props) {
  const theme = useColorScheme() ?? 'light';
  const styles = getStyles(theme);
  const c = colors[theme];

  const handleAddPhase = () => {
    const nextIdx = phases.length + 1;
    const lastPhase = phases[phases.length - 1];

    const newPhase: TitrationPhase = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      phaseName: `Phase ${nextIdx} Titration`,
      durationWeeks: 4,
      doseAmount: lastPhase ? safeFloat(lastPhase.doseAmount) * 2 : 2.5,
      doseUnit: lastPhase ? lastPhase.doseUnit : 'mg',
      frequency: lastPhase ? lastPhase.frequency : 'Specific Days',
      selectedDays: lastPhase ? lastPhase.selectedDays || ['Mon'] : ['Mon'],
      injectionsPerWeek: lastPhase ? lastPhase.injectionsPerWeek : 1,
    };
    onChangePhases([...phases, newPhase]);
  };

  const handleUpdatePhase = (id: string, field: keyof TitrationPhase, value: any) => {
    const updated = phases.map(p => (p.id === id ? { ...p, [field]: value } : p));
    onChangePhases(updated);
  };

  const handleRemovePhase = (id: string) => {
    if (phases.length === 1) return;
    onChangePhases(phases.filter(p => p.id !== id));
  };

  return (
    <View style={{ marginVertical: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={[styles.sectionTitle, { fontSize: 16 }]}>📈 Titration Ramp-Up Phases</Text>
        <TouchableOpacity
          onPress={handleAddPhase}
          style={{ backgroundColor: c.primaryBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
        >
          <Text style={{ color: c.primary, fontWeight: '700', fontSize: 13 }}>+ Add Phase</Text>
        </TouchableOpacity>
      </View>

      {phases.map((phase, idx) => (
        <View
          key={phase.id}
          style={{
            backgroundColor: c.card,
            borderColor: c.border,
            borderWidth: 1,
            borderRadius: 12,
            padding: 14,
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontWeight: '700', color: c.textMain, fontSize: 14 }}>
              Step {idx + 1}: {phase.phaseName || `Phase ${idx + 1}`}
            </Text>
            {phases.length > 1 && (
              <TouchableOpacity onPress={() => handleRemovePhase(phase.id)}>
                <Text style={{ color: c.dangerText, fontWeight: '600', fontSize: 13 }}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Phase Name Input */}
          <TextInput
            style={[styles.input, { marginBottom: 10 }]}
            placeholder="Phase Label (e.g. Starting Dose, Step 2)"
            placeholderTextColor={c.textMuted}
            value={phase.phaseName}
            onChangeText={val => handleUpdatePhase(phase.id, 'phaseName', val)}
          />

          {/* Duration & Dose Row */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: c.textSub, marginBottom: 4 }}>Duration (Weeks)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="4"
                placeholderTextColor={c.textMuted}
                value={phase.durationWeeks ? phase.durationWeeks.toString() : ''}
                onChangeText={val => handleUpdatePhase(phase.id, 'durationWeeks', safeFloat(val))}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: c.textSub, marginBottom: 4 }}>Dose Amount</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="2.5"
                placeholderTextColor={c.textMuted}
                value={phase.doseAmount ? phase.doseAmount.toString() : ''}
                onChangeText={val => handleUpdatePhase(phase.id, 'doseAmount', safeFloat(val))}
              />
            </View>

            {/* Dose Unit Toggle */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: c.textSub, marginBottom: 4 }}>Unit</Text>
              <View style={{ flexDirection: 'row', backgroundColor: c.inputBg, borderRadius: 8, borderWidth: 1, borderColor: c.border }}>
                <TouchableOpacity
                  onPress={() => handleUpdatePhase(phase.id, 'doseUnit', 'mg')}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    alignItems: 'center',
                    backgroundColor: phase.doseUnit === 'mg' ? c.primary : 'transparent',
                    borderRadius: 7,
                  }}
                >
                  <Text style={{ color: phase.doseUnit === 'mg' ? '#fff' : c.textMain, fontWeight: '700', fontSize: 12 }}>mg</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleUpdatePhase(phase.id, 'doseUnit', 'mcg')}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    alignItems: 'center',
                    backgroundColor: phase.doseUnit === 'mcg' ? c.primary : 'transparent',
                    borderRadius: 7,
                  }}
                >
                  <Text style={{ color: phase.doseUnit === 'mcg' ? '#fff' : c.textMain, fontWeight: '700', fontSize: 12 }}>mcg</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Abstracted FrequencyPicker Component (Identical to Add Tab) */}
          <FrequencyPicker
            label="Injection Frequency"
            frequency={phase.frequency}
            selectedDays={phase.selectedDays || ['Mon']}
            options={FREQUENCY_OPTIONS}
            onFrequencyChange={freq => handleUpdatePhase(phase.id, 'frequency', freq)}
            onSelectedDaysChange={days => handleUpdatePhase(phase.id, 'selectedDays', days)}
          />
        </View>
      ))}
    </View>
  );
}
