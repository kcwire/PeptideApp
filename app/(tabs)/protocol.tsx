import React, { useContext, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ProtocolContext } from '../../context/ProtocolContext';
import { getStyles, colors } from '../../theme';
import { ProtocolConfig, TitrationPhase } from '../../types/protocol';
import ProtocolSupplySummary from '../../components/ProtocolSupplySummary';
import TitrationPhaseBuilder from '../../components/TitrationPhaseBuilder';
import { safeFloat, safeInt } from '../../context/VialContext';
import { calculateProtocolSupplies } from '../../utils/protocolMath';

export default function ProtocolPlannerScreen() {
  const theme = useColorScheme() ?? 'light';
  const styles = getStyles(theme);
  const c = colors[theme];

  const { protocols, saveProtocol, duplicateProtocol, deleteProtocol, convertProtocolToVials } = useContext(ProtocolContext);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProtocolId, setEditingProtocolId] = useState<string | null>(null);

  // Form State
  const [protocolName, setProtocolName] = useState('');
  const [notes, setNotes] = useState('');
  const [vialMg, setVialMg] = useState('10');
  const [bacWaterMl, setBacWaterMl] = useState('2');
  const [wasteBufferPercent, setWasteBufferPercent] = useState('10');

  // Phases List State
  const [phases, setPhases] = useState<TitrationPhase[]>([
    {
      id: 'phase_init',
      phaseName: 'Phase 1: Initiation',
      durationWeeks: 4,
      doseAmount: 2.5,
      doseUnit: 'mg',
      frequency: 'Specific Days',
      selectedDays: ['Mon'],
      injectionsPerWeek: 1,
    },
  ]);

  const openCreateModal = () => {
    setEditingProtocolId(null);
    setProtocolName('');
    setNotes('');
    setVialMg('10');
    setBacWaterMl('2');
    setWasteBufferPercent('10');
    setPhases([
      {
        id: 'phase_init',
        phaseName: 'Phase 1: Initiation',
        durationWeeks: 4,
        doseAmount: 2.5,
        doseUnit: 'mg',
        frequency: 'Specific Days',
        selectedDays: ['Mon'],
        injectionsPerWeek: 1,
      },
    ]);
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

  const handleShareProtocol = async (protocol: ProtocolConfig) => {
    try {
      const payloadStr = JSON.stringify(protocol, null, 2);
      const cleanName = (protocol.name || 'Protocol').replace(/[^a-zA-Z0-9]/g, '_');
      const file = new File(Paths.cache, `${cleanName}_Protocol.json`);
      if (!file.exists) file.create();
      file.write(payloadStr);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: `Share Protocol Template: ${protocol.name}`
        });
      } else {
        Alert.alert('Protocol Template Shared', payloadStr);
      }
    } catch (err: any) {
      Alert.alert('Share Failed', err?.message || 'Could not share protocol template.');
    }
  };

  const handleSave = () => {
    if (!protocolName.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for this peptide protocol.');
      return;
    }
    if (phases.length === 0) {
      Alert.alert('Missing Phases', 'Please add at least one titration phase.');
      return;
    }

    const payload: Partial<ProtocolConfig> = {
      id: editingProtocolId || undefined,
      name: protocolName.trim(),
      notes: notes.trim(),
      phases,
      reconstitution: {
        vialMg: safeFloat(vialMg),
        bacWaterMl: safeFloat(bacWaterMl),
        syringeCapacityUnits: 100,
        wasteBufferPercent: safeFloat(wasteBufferPercent),
      },
    };

    saveProtocol(payload);
    setModalVisible(false);
  };

  // Preview real-time calculation inside modal
  const previewProtocol: ProtocolConfig = {
    id: 'preview',
    name: protocolName || 'Preview Plan',
    phases,
    reconstitution: {
      vialMg: safeFloat(vialMg),
      bacWaterMl: safeFloat(bacWaterMl),
      syringeCapacityUnits: 100,
      wasteBufferPercent: safeFloat(wasteBufferPercent),
    },
    createdAt: new Date().toISOString(),
  };
  const previewSupplies = calculateProtocolSupplies(previewProtocol);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <View>
            <Text style={styles.dashHeader}>Protocol Planner 📋</Text>
            <Text style={styles.dashSub}>Design titration schedules & supply needs.</Text>
          </View>

          <TouchableOpacity onPress={openCreateModal} style={styles.primaryButton}>
            <Text style={styles.buttonText}>+ New Plan</Text>
          </TouchableOpacity>
        </View>

        {/* List of Saved Protocols */}
        <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Saved Protocol Plans ({protocols?.length || 0})</Text>

        {!protocols || protocols.length === 0 ? (
          <View style={[styles.card, { padding: 24, alignItems: 'center', borderStyle: 'dashed' }]}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🧪</Text>
            <Text style={{ fontWeight: '700', color: c.textMain, fontSize: 16, textAlign: 'center' }}>No Protocol Plans Created</Text>
            <Text style={{ color: c.textSub, fontSize: 13, textAlign: 'center', marginTop: 4 }}>
              Tap "+ New Plan" to define titration ramp-ups and calculate your total peptide, water, and syringe supply needs.
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

                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => duplicateProtocol(protocol.id)}>
                      <Text style={{ color: c.primary, fontWeight: '700', fontSize: 13 }}>Duplicate 📑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleShareProtocol(protocol)}>
                      <Text style={{ color: c.primary, fontWeight: '700', fontSize: 13 }}>Share 📤</Text>
                    </TouchableOpacity>
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

      {/* CREATE / EDIT PROTOCOL MODAL */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.container, { paddingHorizontal: 16, paddingTop: 16 }]}>
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: c.textMain }}>
                {editingProtocolId ? 'Edit Protocol Plan' : 'Create Protocol Plan'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: c.textSub }}>Close ✕</Text>
              </TouchableOpacity>
            </View>

            {/* Protocol Meta */}
            <View style={{ backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 16 }}>
              <Text style={{ fontWeight: '700', color: c.textMain, marginBottom: 4 }}>Protocol Name</Text>
              <TextInput
                style={[styles.input, { marginBottom: 12 }]}
                placeholder="e.g. Retatrutide Phase 3 Escalation"
                placeholderTextColor={c.textMuted}
                value={protocolName}
                onChangeText={setProtocolName}
              />

              <Text style={{ fontWeight: '700', color: c.textMain, marginBottom: 4 }}>Notes / Description</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                placeholder="e.g. 24-Week study escalation protocol"
                placeholderTextColor={c.textMuted}
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Reconstitution Specs */}
            <View style={{ backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 16 }}>
              <Text style={{ fontWeight: '700', color: c.textMain, fontSize: 15, marginBottom: 12 }}>💧 Reconstitution Specifications</Text>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: c.textSub, marginBottom: 4 }}>Vial Mass (mg)</Text>
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
            </View>

            {/* Titration Phases Builder */}
            <TitrationPhaseBuilder phases={phases} onChangePhases={setPhases} />

            {/* Live Supply Summary Preview */}
            <ProtocolSupplySummary supplies={previewSupplies} />

            {/* Save Button */}
            <TouchableOpacity onPress={handleSave} style={[styles.primaryButton, { paddingVertical: 14, marginTop: 12 }]}>
              <Text style={[styles.buttonText, { fontSize: 16 }]}>
                {editingProtocolId ? 'Update Protocol Plan' : 'Save Protocol Plan'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
