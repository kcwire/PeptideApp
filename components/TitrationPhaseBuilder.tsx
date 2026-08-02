import React from 'react';
import { View, Text, TextInput, TouchableOpacity, useColorScheme } from 'react-native';
import { ProtocolSubject, TitrationPhase } from '../types/protocol';
import { getStyles, colors } from '../theme';
import { safeFloat } from '../context/VialContext';
import FrequencyPicker from './FrequencyPicker';

interface Props {
  phases: TitrationPhase[];
  subjects?: ProtocolSubject[];
  onChangePhases: (phases: TitrationPhase[]) => void;
}

const FREQUENCY_OPTIONS = ['Daily', 'Mon-Fri', 'Specific Days'];

export default function TitrationPhaseBuilder({ phases, subjects = [], onChangePhases }: Props) {
  const theme = useColorScheme() ?? 'light';
  const styles = getStyles(theme);
  const c = colors[theme];

  const isMultiSubject = subjects.length > 1;

  const handleAddPhase = () => {
    const nextIdx = phases.length + 1;
    const lastPhase = phases[phases.length - 1];

    const initialSubjectDoses = isMultiSubject
      ? subjects.map(s => ({
          subjectId: s.id,
          subjectName: s.name,
          doseAmount: lastPhase ? safeFloat(lastPhase.doseAmount) * 2 : 2.5,
          doseUnit: (lastPhase ? lastPhase.doseUnit : 'mg') as 'mg' | 'mcg',
        }))
      : undefined;

    const newPhase: TitrationPhase = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      phaseName: `Phase ${nextIdx} Titration`,
      durationWeeks: 4,
      doseAmount: lastPhase ? safeFloat(lastPhase.doseAmount) * 2 : 2.5,
      doseUnit: lastPhase ? lastPhase.doseUnit : 'mg',
      subjectDoses: initialSubjectDoses,
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

  const handleUpdateSubjectDose = (phaseId: string, subjectId: string, field: 'doseAmount' | 'doseUnit', value: any) => {
    const updated = phases.map(p => {
      if (p.id !== phaseId) return p;
      const currentSubjectDoses = p.subjectDoses || subjects.map(s => ({
        subjectId: s.id,
        subjectName: s.name,
        doseAmount: p.doseAmount,
        doseUnit: p.doseUnit,
      }));

      const updatedSubDoses = currentSubjectDoses.map(sd => {
        if (sd.subjectId === subjectId) {
          return { ...sd, [field]: value };
        }
        return sd;
      });

      return {
        ...p,
        subjectDoses: updatedSubDoses,
      };
    });
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

          {/* Duration & Single/Primary Dose Row */}
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

            {!isMultiSubject && (
              <>
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
              </>
            )}
          </View>

          {/* PER-SUBJECT DOSAGE INPUTS IN MULTI-SUBJECT MODE */}
          {isMultiSubject && (
            <View style={{ backgroundColor: c.inputBg, borderRadius: 8, padding: 10, marginBottom: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: c.textMain, marginBottom: 6 }}>👥 Per-Subject Phase Doses</Text>
              {subjects.map(s => {
                const sDose = (phase.subjectDoses || []).find(sd => sd.subjectId === s.id) || {
                  doseAmount: phase.doseAmount,
                  doseUnit: phase.doseUnit,
                };
                return (
                  <View key={s.id} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: c.textSub }}>{s.name || 'Subject'}</Text>
                    <TextInput
                      style={[styles.input, { flex: 1, backgroundColor: c.card }]}
                      keyboardType="numeric"
                      placeholder="Dose"
                      placeholderTextColor={c.textMuted}
                      value={sDose.doseAmount ? sDose.doseAmount.toString() : ''}
                      onChangeText={val => handleUpdateSubjectDose(phase.id, s.id, 'doseAmount', safeFloat(val))}
                    />
                    <TouchableOpacity
                      onPress={() => handleUpdateSubjectDose(phase.id, s.id, 'doseUnit', sDose.doseUnit === 'mg' ? 'mcg' : 'mg')}
                      style={{ backgroundColor: c.primaryBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: c.primary }}
                    >
                      <Text style={{ color: c.primary, fontWeight: '700', fontSize: 12 }}>{sDose.doseUnit}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* Abstracted FrequencyPicker Component */}
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
