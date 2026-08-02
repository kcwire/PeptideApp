import React, { useContext, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  Switch,
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
import { VialContext, safeFloat, safeInt } from '../../context/VialContext';
import { getStyles, colors } from '../../theme';
import { ProtocolConfig, ProtocolPeptideItem, ProtocolSubject, TitrationPhase } from '../../types/protocol';
import ProtocolSupplySummary from '../../components/ProtocolSupplySummary';
import TitrationPhaseBuilder from '../../components/TitrationPhaseBuilder';
import { calculateProtocolSupplies } from '../../utils/protocolMath';

export default function ProtocolPlannerScreen() {
  const theme = useColorScheme() ?? 'light';
  const styles = getStyles(theme);
  const c = colors[theme];

  const { protocols, saveProtocol, duplicateProtocol, deleteProtocol, convertProtocolToVials } = useContext(ProtocolContext);
  const { vials } = useContext(VialContext) || {};

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProtocolId, setEditingProtocolId] = useState<string | null>(null);

  // Form State
  const [protocolName, setProtocolName] = useState('');
  const [notes, setNotes] = useState('');
  const [vialMg, setVialMg] = useState('10');
  const [bacWaterMl, setBacWaterMl] = useState('2');
  const [wasteBufferPercent, setWasteBufferPercent] = useState('10');

  // Multi-Subject State
  const [isMultiSubject, setIsMultiSubject] = useState(false);
  const [subjects, setSubjects] = useState<ProtocolSubject[]>([
    { id: 'sub_1', name: 'Self' },
    { id: 'sub_2', name: 'Partner' },
  ]);

  // Peptides List State (Supports single peptide or mixed vials / multi-peptide blends)
  const [peptides, setPeptides] = useState<ProtocolPeptideItem[]>([
    { name: 'Retatrutide', mg: 10 }
  ]);

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

  // Extract unique peptides / blends from existing inventory for quick-select
  const existingInventoryItems = useMemo(() => {
    if (!vials || !Array.isArray(vials)) return [];
    const itemsMap = new Map();
    vials.forEach((v: any) => {
      const name = v.vialName || v.name;
      const mg = safeFloat(v.vialMg) || (v.peptides ? v.peptides.reduce((s: number, p: any) => s + safeFloat(p.mg), 0) : 10);
      const key = `${name}_${mg}`;
      if (!itemsMap.has(key)) {
        itemsMap.set(key, {
          name,
          mg,
          peptides: v.peptides && v.peptides.length > 0 ? v.peptides : [{ name, mg }],
        });
      }
    });
    return Array.from(itemsMap.values());
  }, [vials]);

  const openCreateModal = () => {
    setEditingProtocolId(null);
    setProtocolName('');
    setNotes('');
    setIsMultiSubject(false);
    setSubjects([
      { id: 'sub_1', name: 'Self' },
      { id: 'sub_2', name: 'Partner' },
    ]);
    setPeptides([{ name: 'Retatrutide', mg: 10 }]);
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
    setProtocolName(protocol.name);
    setNotes(protocol.notes || '');
    setIsMultiSubject(!!protocol.isMultiSubject);
    setSubjects(protocol.subjects && protocol.subjects.length > 0 ? protocol.subjects : [
      { id: 'sub_1', name: 'Self' },
      { id: 'sub_2', name: 'Partner' },
    ]);
    setPeptides(protocol.peptides && protocol.peptides.length > 0 ? protocol.peptides : [{ name: protocol.name, mg: protocol.reconstitution.vialMg }]);
    setVialMg((protocol.reconstitution.vialMg || 10).toString());
    setBacWaterMl((protocol.reconstitution.bacWaterMl || 2).toString());
    setWasteBufferPercent((protocol.reconstitution.wasteBufferPercent || 10).toString());
    setPhases(protocol.phases);
    setModalVisible(true);
  };

  const handleAddSubject = () => {
    const newSub: ProtocolSubject = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      name: `Subject ${subjects.length + 1}`,
    };
    setSubjects([...subjects, newSub]);
  };

  const handleRemoveSubject = (id: string) => {
    if (subjects.length <= 1) return;
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const handleUpdateSubjectName = (id: string, name: string) => {
    setSubjects(subjects.map(s => (s.id === id ? { ...s, name } : s)));
  };

  const handleAddPeptideToBlend = () => {
    const updated = [...peptides, { name: '', mg: 5 }];
    setPeptides(updated);
    recalculateTotalVialMg(updated);
  };

  const handleRemovePeptideFromBlend = (index: number) => {
    if (peptides.length <= 1) return;
    const updated = peptides.filter((_, i) => i !== index);
    setPeptides(updated);
    recalculateTotalVialMg(updated);
  };

  const handlePeptideChange = (index: number, field: 'name' | 'mg', value: string) => {
    const updated = [...peptides];
    if (field === 'mg') {
      updated[index].mg = safeFloat(value);
    } else {
      updated[index].name = value;
    }
    setPeptides(updated);
    recalculateTotalVialMg(updated);
  };

  const recalculateTotalVialMg = (pepList: ProtocolPeptideItem[]) => {
    const totalMg = pepList.reduce((sum, p) => sum + (safeFloat(p.mg) || 0), 0);
    if (totalMg > 0) {
      setVialMg(totalMg.toString());
    }
  };

  const handleSelectFromInventory = (item: any) => {
    setProtocolName(`${item.name} Protocol`);
    setPeptides(item.peptides);
    setVialMg(item.mg.toString());
  };

  const handleSave = () => {
    if (!protocolName.trim()) {
      Alert.alert('Validation Error', 'Please enter a protocol name.');
      return;
    }

    if (phases.length === 0) {
      Alert.alert('Validation Error', 'Please configure at least one titration phase.');
      return;
    }

    const payload: Partial<ProtocolConfig> = {
      id: editingProtocolId || undefined,
      name: protocolName.trim(),
      notes: notes.trim(),
      isMultiSubject,
      subjects: isMultiSubject ? subjects : undefined,
      peptides,
      phases,
      reconstitution: {
        vialMg: safeFloat(vialMg) || 10,
        bacWaterMl: safeFloat(bacWaterMl) || 2,
        syringeCapacityUnits: 100,
        wasteBufferPercent: safeFloat(wasteBufferPercent) || 10,
      },
    };

    saveProtocol(payload);
    setModalVisible(false);
  };

  const handleShareProtocol = async (protocol: ProtocolConfig) => {
    try {
      const supplies = calculateProtocolSupplies(protocol);
      const exportData = {
        version: 2,
        exportedAt: new Date().toISOString(),
        protocol,
        calculatedSupplies: supplies,
      };

      const jsonStr = JSON.stringify(exportData, null, 2);
      const filename = `${protocol.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_protocol.json`;
      const fileUri = `${Paths.document.uri}/${filename}`;

      const file = new File(fileUri);
      await file.write(jsonStr);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: `Share Protocol: ${protocol.name}`,
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Sharing Unavailable', `Protocol saved locally to: ${fileUri}`);
      }
    } catch (err: any) {
      Alert.alert('Sharing Error', err.message || 'Failed to export protocol template.');
    }
  };

  // Preview live supply calculations in modal
  const previewSupplies = useMemo(() => {
    const dummyConfig: ProtocolConfig = {
      id: 'preview',
      name: protocolName || 'Preview',
      isMultiSubject,
      subjects: isMultiSubject ? subjects : undefined,
      peptides,
      phases,
      reconstitution: {
        vialMg: safeFloat(vialMg) || 10,
        bacWaterMl: safeFloat(bacWaterMl) || 2,
        syringeCapacityUnits: 100,
        wasteBufferPercent: safeFloat(wasteBufferPercent) || 10,
      },
      createdAt: '',
    };
    return calculateProtocolSupplies(dummyConfig);
  }, [protocolName, isMultiSubject, subjects, peptides, phases, vialMg, bacWaterMl, wasteBufferPercent]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HEADER & NEW PLAN BUTTON */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={styles.dashHeader}>Protocol Planner 📋</Text>
            <Text style={styles.dashSub}>Design custom titration schedules and supply math.</Text>
          </View>
          <TouchableOpacity onPress={openCreateModal} style={[styles.primaryButton, { paddingHorizontal: 14, paddingVertical: 10 }]}>
            <Text style={[styles.buttonText, { fontSize: 13 }]}>+ New Plan</Text>
          </TouchableOpacity>
        </View>

        {/* PROTOCOLS LIST */}
        {protocols.length === 0 ? (
          <View style={{ backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: c.textMain, marginBottom: 6 }}>No Protocol Plans Created</Text>
            <Text style={{ color: c.textSub, textAlign: 'center', fontSize: 13, marginBottom: 16 }}>
              Tap "+ New Plan" above to create a titration schedule (e.g. 24-Week Retatrutide Ramp-Up Plan).
            </Text>
            <TouchableOpacity onPress={openCreateModal} style={styles.primaryButton}>
              <Text style={styles.buttonText}>+ Create First Protocol Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          protocols.map((protocol: ProtocolConfig) => {
            const supplies = calculateProtocolSupplies(protocol);
            const peptideNamesText = protocol.peptides && protocol.peptides.length > 0 
              ? protocol.peptides.map(p => `${p.name} (${p.mg}mg)`).join(' + ')
              : `${protocol.name} (${protocol.reconstitution.vialMg}mg)`;

            return (
              <View key={protocol.id} style={[styles.card, { marginBottom: 16, padding: 16 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: c.textMain }}>{protocol.name}</Text>
                      {protocol.isMultiSubject && (
                        <View style={{ backgroundColor: c.primaryBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: c.primary }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: c.primary }}>👥 Multi-Subject ({protocol.subjects?.length})</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: c.primary, marginTop: 2 }}>
                      🧪 Compound(s): {peptideNamesText}
                    </Text>
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

            {/* QUICK SELECT FROM INVENTORY */}
            {existingInventoryItems.length > 0 && (
              <View style={{ backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 16 }}>
                <Text style={{ fontWeight: '700', color: c.textMain, fontSize: 14, marginBottom: 8 }}>
                  📦 Select Peptide from Inventory
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {existingInventoryItems.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleSelectFromInventory(item)}
                      style={{ backgroundColor: c.primaryBg, borderWidth: 1, borderColor: c.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
                    >
                      <Text style={{ color: c.primary, fontWeight: '700', fontSize: 12 }}>
                        {item.name} ({item.mg}mg)
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

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

            {/* MULTI-SUBJECT TOGGLE & SUBJECT MANAGER */}
            <View style={{ backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <View>
                  <Text style={{ fontWeight: '800', color: c.textMain, fontSize: 15 }}>👥 Multi-Subject Protocol</Text>
                  <Text style={{ fontSize: 12, color: c.textSub, marginTop: 2 }}>Track multiple subjects sharing this protocol & vial stock.</Text>
                </View>
                <Switch
                  value={isMultiSubject}
                  onValueChange={setIsMultiSubject}
                  trackColor={{ false: c.border, true: c.primary }}
                  thumbColor="#fff"
                />
              </View>

              {isMultiSubject && (
                <View style={{ marginTop: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: c.textMain }}>Protocol Subjects</Text>
                    <TouchableOpacity onPress={handleAddSubject}>
                      <Text style={{ color: c.primary, fontWeight: '700', fontSize: 12 }}>+ Add Subject</Text>
                    </TouchableOpacity>
                  </View>

                  {subjects.map((sub, idx) => (
                    <View key={sub.id} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder={`Subject ${idx + 1} Name`}
                        placeholderTextColor={c.textMuted}
                        value={sub.name}
                        onChangeText={val => handleUpdateSubjectName(sub.id, val)}
                      />
                      {subjects.length > 1 && (
                        <TouchableOpacity onPress={() => handleRemoveSubject(sub.id)}>
                          <Text style={{ color: c.dangerText, fontWeight: '800', fontSize: 16 }}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* PEPTIDE & MULTI-PEPTIDE BLEND BUILDER */}
            <View style={{ backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontWeight: '800', color: c.textMain, fontSize: 15 }}>
                  🧪 Peptides & Mixed Vial Blend
                </Text>
                <TouchableOpacity onPress={handleAddPeptideToBlend}>
                  <Text style={{ color: c.primary, fontWeight: '700', fontSize: 12 }}>+ Add Peptide to Blend</Text>
                </TouchableOpacity>
              </View>

              {peptides.map((pep, index) => (
                <View key={index} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ flex: 2 }}>
                    <Text style={{ fontSize: 11, color: c.textSub, marginBottom: 2 }}>Peptide Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Retatrutide or BPC-157"
                      placeholderTextColor={c.textMuted}
                      value={pep.name}
                      onChangeText={(val) => handlePeptideChange(index, 'name', val)}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: c.textSub, marginBottom: 2 }}>Mass (mg)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="10"
                      placeholderTextColor={c.textMuted}
                      value={pep.mg ? pep.mg.toString() : ''}
                      onChangeText={(val) => handlePeptideChange(index, 'mg', val)}
                    />
                  </View>

                  {peptides.length > 1 && (
                    <TouchableOpacity onPress={() => handleRemovePeptideFromBlend(index)} style={{ paddingTop: 16 }}>
                      <Text style={{ color: c.dangerText, fontWeight: '800', fontSize: 16 }}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Reconstitution Specs */}
            <View style={{ backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 16 }}>
              <Text style={{ fontWeight: '700', color: c.textMain, fontSize: 15, marginBottom: 12 }}>💧 Reconstitution Specifications</Text>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: c.textSub, marginBottom: 4 }}>Total Vial Mass (mg)</Text>
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
            <TitrationPhaseBuilder phases={phases} subjects={isMultiSubject ? subjects : []} onChangePhases={setPhases} />

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
