import React, { useContext, useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, useColorScheme, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProtocolContext } from '../../context/ProtocolContext';
import { getStyles, colors } from '../../theme';
import TitrationPhaseBuilder from '../../components/TitrationPhaseBuilder';
import ProtocolSupplySummary from '../../components/ProtocolSupplySummary';
import { ProtocolConfig, TitrationPhase } from '../../types/protocol';
import { calculateProtocolSupplies } from '../../utils/protocolMath';
import { safeFloat } from '../../context/VialContext';

export default function ProtocolScreen() {
  const theme = useColorScheme() ?? 'light';
  const styles = getStyles(theme);
  const c = colors[theme];

  const { protocols, saveProtocol, deleteProtocol, convertProtocolToVials } = useContext(ProtocolContext) || {};

  const [modalVisible, setModalVisible] = useState(false);
  const [editingProtocolId, setEditingProtocolId] = useState<string | null>(null);

  const [protocolName, setProtocolName] = useState('');
  const [notes, setNotes] = useState('');
  const [vialMg, setVialMg] = useState('10');
  const [bacWaterMl, setBacWaterMl] = useState('2');
  const [wasteBufferPercent, setWasteBufferPercent] = useState('10');

  const [phases, setPhases] = useState<TitrationPhase[]>([
    { id: '1', phaseName: 'Phase 1 Ramp-Up', durationWeeks: 4, doseAmount: 2.5, doseUnit: 'mg', frequency: 'Specific Days', selectedDays: ['Mon'], injectionsPerWeek: 1 },
    { id: '2', phaseName: 'Phase 2 Step-Up', durationWeeks: 4, doseAmount: 5.0, doseUnit: 'mg', frequency: 'Specific Days', selectedDays: ['Mon'], injectionsPerWeek: 1 },
    { id: '3', phaseName: 'Phase 3 Target Maintenance', durationWeeks: 4, doseAmount: 7.5, doseUnit: 'mg', frequency: 'Specific Days', selectedDays: ['Mon'], injectionsPerWeek: 1 },
  ]);

  const draftConfig: ProtocolConfig = useMemo(() => {
    return {
      id: editingProtocolId || 'draft',
      name: protocolName || 'New Peptide Protocol',
      notes,
      phases,
      reconstitution: {
        vialMg: safeFloat(vialMg),
        bacWaterMl: safeFloat(bacWaterMl),
        syringeCapacityUnits: 100,
        wasteBufferPercent: safeFloat(wasteBufferPercent),
      },
      createdAt: new Date().toISOString().split('T')[0],
    };
  }, [editingProtocolId, protocolName, notes, phases, vialMg, bacWaterMl, wasteBufferPercent]);

  const draftSupplies = useMemo(() => {
    return calculateProtocolSupplies(draftConfig);
  }, [draftConfig]);

  const openCreateModal = () => {
    resetForm();
    setEditingProtocolId(null);
    setModalVisible(true);
  };

  const openEditModal = (protocol: ProtocolConfig) => {
    setEditingProtocolId(protocol.id);
    setProtocolName(protocol.name || '');
    setNotes(protocol.notes || '');
    setVialMg(protocol.reconstitution?.vialMg?.toString() || '10');
    setBacWaterMl(protocol.reconstitution?.bacWaterMl?.toString() || '2');
    setWasteBufferPercent(protocol.reconstitution?.wasteBufferPercent?.toString() || '10');
    setPhases(protocol.phases || []);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!protocolName.trim()) {
      Alert.alert('Protocol Name Required', 'Please provide a descriptive name for your protocol (e.g. Tirzepatide 12-Week Plan).');
      return;
    }
    if (safeFloat(vialMg) <= 0 || safeFloat(bacWaterMl) <= 0) {
      Alert.alert('Reconstitution Setup Required', 'Please specify valid vial mg and BAC water mL values.');
      return;
    }

    saveProtocol(draftConfig);
    setModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingProtocolId(null);
    setProtocolName('');
    setNotes('');
    setVialMg('10');
    setBacWaterMl('2');
    setWasteBufferPercent('10');
    setPhases([
      { id: '1', phaseName: 'Phase 1 Ramp-Up', durationWeeks: 4, doseAmount: 2.5, doseUnit: 'mg', frequency: 'Specific Days', selectedDays: ['Mon'], injectionsPerWeek: 1 },
      { id: '2', phaseName: 'Phase 2 Step-Up', durationWeeks: 4, doseAmount: 5.0, doseUnit: 'mg', frequency: 'Specific Days', selectedDays: ['Mon'], injectionsPerWeek: 1 },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingHorizontal: 16 }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: c.textMain }}>Peptide Protocol Planner 📋</Text>
            <Text style={{ color: c.textSub, fontSize: 13, marginTop: 2 }}>
              Design titration cycles & calculate required vials, BAC water, & syringes.
            </Text>
          </View>
        </View>

        {/* Create Protocol Button */}
        <TouchableOpacity
          onPress={openCreateModal}
          style={[styles.primaryButton, { marginBottom: 20, marginTop: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }]}
        >
          <Text style={{ fontSize: 18 }}>➕</Text>
          <Text style={styles.buttonText}>Create New Protocol Plan</Text>
        </TouchableOpacity>

        {/* List of Saved Protocols */}
        <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Saved Protocol Plans ({protocols?.length || 0})</Text>

        {!protocols || protocols.length === 0 ? (
          <View style={[styles.card, { padding: 24, alignItems: 'center', borderStyle: 'dashed' }]}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🧪</Text>
            <Text style={{ fontWeight: '700', color: c.textMain, fontSize: 16, textAlign: 'center' }}>No Protocol Plans Created</Text>
            <Text style={{ color: c.textSub, fontSize: 13, textAlign: 'center', marginTop: 4 }}>
              Tap "Create New Protocol Plan" to define titration ramp-ups and calculate your total peptide, water, and syringe supply needs.
            </Text>
          </View>
        ) : (
          protocols.map((protocol: ProtocolConfig) => {
            const supplies = calculateProtocolSupplies(protocol);
            return (
              <View key={protocol.id} style={[styles.card, { marginBottom: 16, padding: 16 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: c.textMain }}>{protocol.name}</Text>
                    {protocol.notes ? <Text style={{ color: c.textSub, fontSize: 12, marginTop: 2 }}>{protocol.notes}</Text> : null}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => openEditModal(protocol)}>
                      <Text style={{ color: c.primary, fontWeight: '700', fontSize: 13 }}>Edit ✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteProtocol(protocol.id)}>
                      <Text style={{ color: c.dangerText, fontWeight: '600', fontSize: 13 }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Embedded Summary Component */}
                <ProtocolSupplySummary supplies={supplies} />

                {/* Action Row */}
                <TouchableOpacity
                  onPress={() => convertProtocolToVials(protocol)}
                  style={{
                    backgroundColor: c.primary,
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
                    🚀 Activate Protocol to Dashboard Tracking
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Protocol Creator & Editor Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: c.textMain }}>
                  {editingProtocolId ? 'Edit Protocol Plan ✏️' : 'New Peptide Protocol Plan'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={{ fontSize: 18, color: c.textSub, fontWeight: '700' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Protocol Name */}
              <Text style={{ fontSize: 13, fontWeight: '700', color: c.textMain, marginBottom: 4 }}>Protocol Name</Text>
              <TextInput
                style={[styles.input, { marginBottom: 12 }]}
                placeholder="e.g. Tirzepatide 12-Week Titration Cycle"
                placeholderTextColor={c.textMuted}
                value={protocolName}
                onChangeText={setProtocolName}
              />

              {/* Notes */}
              <Text style={{ fontSize: 13, fontWeight: '700', color: c.textMain, marginBottom: 4 }}>Protocol Notes (Optional)</Text>
              <TextInput
                style={[styles.input, { marginBottom: 16 }]}
                placeholder="Target goals, subject info, notes..."
                placeholderTextColor={c.textMuted}
                value={notes}
                onChangeText={setNotes}
              />

              {/* Reconstitution & Supply Specs */}
              <Text style={[styles.sectionTitle, { fontSize: 15, marginBottom: 8 }]}>🧪 Compounding & Reconstitution Spec</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: c.textSub, marginBottom: 4 }}>Vial Size (mg)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor={c.textMuted}
                    value={vialMg}
                    onChangeText={setVialMg}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: c.textSub, marginBottom: 4 }}>BAC Water (mL)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="2"
                    placeholderTextColor={c.textMuted}
                    value={bacWaterMl}
                    onChangeText={setBacWaterMl}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: c.textSub, marginBottom: 4 }}>Syringe Buffer %</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor={c.textMuted}
                    value={wasteBufferPercent}
                    onChangeText={setWasteBufferPercent}
                  />
                </View>
              </View>

              {/* Titration Phase Builder */}
              <TitrationPhaseBuilder phases={phases} onChangePhases={setPhases} />

              {/* Live Calculation Preview */}
              <ProtocolSupplySummary supplies={draftSupplies} />

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 10 }}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={{
                    backgroundColor: c.dayPickerInactive,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    flex: 1,
                  }}
                >
                  <Text style={{ color: c.textMain, fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  style={{
                    backgroundColor: c.primary,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    flex: 2,
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '800' }}>
                    {editingProtocolId ? 'Update Protocol Plan' : 'Save Protocol Plan'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
