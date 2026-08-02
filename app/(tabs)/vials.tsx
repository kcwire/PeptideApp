import React, { useContext, useState } from 'react';
import DateInput from '../../components/DateInput';
import FrequencyPicker from '../../components/FrequencyPicker';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VialContext, safeFloat, safeInt } from '../../context/VialContext';
import VialCard from '../../components/VialCard';
import { getStyles, vialColors, colors } from '../../theme';

export default function VialsScreen() {
  const theme = useColorScheme() ?? 'light';
  const styles = getStyles(theme);
  const c = colors[theme];
  const [editColor, setEditColor] = useState(vialColors[0]);

  const { vials, updateVial, logInjection, startNextVial } = useContext(VialContext);
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [activeVial, setActiveVial] = useState<any>(null);
  
  const [editDose, setEditDose] = useState('');
  const [editUnit, setEditUnit] = useState('mcg');
  const [editFreq, setEditFreq] = useState('');
  const [editTime, setEditTime] = useState('Any');
  const [editInventory, setEditInventory] = useState([{ id: '1', mg: '', count: '0' }]);
  const [editIsMultiSubject, setEditIsMultiSubject] = useState(false);
  const [editSubjects, setEditSubjects] = useState([{ id: '1', name: '', doseAmount: '', doseUnit: 'mcg' }]);
  
  const [nextVialModalVisible, setNextVialModalVisible] = useState(false);
  const [nextVialInventoryIndex, setNextVialInventoryIndex] = useState(-1);
  const [nextVialBacWaterMl, setNextVialBacWaterMl] = useState('');
  const [nextVialDoseAmount, setNextVialDoseAmount] = useState('');
  const [nextVialDoseUnit, setNextVialDoseUnit] = useState('mcg');

  // Quick Add Stock Modal State
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [stockVialId, setStockVialId] = useState<string | null>(null);
  const [addStockMg, setAddStockMg] = useState('10');
  const [addStockCount, setAddStockCount] = useState('1');

  const timeOptions = ['AM', 'PM', 'Any'];
  
  // Date Picker State for Logs
  const [pastDateInput, setPastDateInput] = useState('');
  const [pastLogSubjectId, setPastLogSubjectId] = useState('');
  const [pastDoseAmount, setPastDoseAmount] = useState('');
  const [pastDoseUnit, setPastDoseUnit] = useState('mcg');

  const [editStartDate, setEditStartDate] = useState('');
  
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const frequencyOptions = ['Daily', 'Mon-Fri', 'Specific Days'];

  const [selectedDays, setSelectedDays] = useState(['Mon', 'Thu']);

  const toggleExpandLog = (vialId: string) => setExpandedLogs(prev => ({ ...prev, [vialId]: !prev[vialId] }));

  const openEditModal = (vial: any) => {
    setActiveVial(vial);
    setEditDose((vial.doseAmount || vial.doseMcg).toString());
    setEditUnit(vial.doseUnit || 'mcg');
    setEditFreq(vial.frequency || 'Daily');
    setSelectedDays(vial.selectedDays || (vial.frequency === 'Bi-Weekly' ? ['Mon', 'Thu'] : []));
    setEditTime(vial.timeOfDay || 'Any');
    
    if (vial.subjects && vial.subjects.length > 0) {
      setEditIsMultiSubject(true);
      setEditSubjects(vial.subjects.map((s: any) => ({ ...s, doseAmount: s.doseAmount.toString() })));
    } else {
      setEditIsMultiSubject(false);
      setEditSubjects([{ id: '1', name: '', doseAmount: '', doseUnit: 'mcg' }]);
    }
    
    if (vial.inventory && vial.inventory.length > 0) {
      setEditInventory(vial.inventory.map((i: any, idx: number) => ({ id: idx.toString(), mg: i.mg.toString(), count: i.count.toString() })));
    } else {
      setEditInventory([{ id: '1', mg: '', count: '0' }]);
    }
    setEditColor(vial.color || vialColors[0]);
    setEditStartDate(vial.startDate || new Date().toISOString().split('T')[0]);
    setEditModalVisible(true);
  };

  const handleAddEditInventoryRow = () => setEditInventory([...editInventory, { id: Date.now().toString(), mg: '', count: '0' }]);
  const handleRemoveEditInventoryRow = (id: string) => {
    if (editInventory.length === 1) return;
    setEditInventory(editInventory.filter(i => i.id !== id));
  };
  const updateEditInventory = (id: string, field: string, value: string) => setEditInventory(editInventory.map(i => i.id === id ? { ...i, [field]: value } : i));

  const handleAddEditSubject = () => setEditSubjects([...editSubjects, { id: Date.now().toString(), name: '', doseAmount: '', doseUnit: 'mcg' }]);
  const handleRemoveEditSubject = (id: string) => {
    if (editSubjects.length === 1) return;
    setEditSubjects(editSubjects.filter(s => s.id !== id));
  };
  const updateEditSubject = (id: string, field: string, value: string) => setEditSubjects(editSubjects.map(s => s.id === id ? { ...s, [field]: value } : s));

  const openNextVialModal = (vial: any) => {
    setActiveVial(vial);
    const defaultIndex = vial.inventory ? vial.inventory.findIndex((i: any) => i.count > 0) : -1;
    setNextVialInventoryIndex(defaultIndex);
    setNextVialBacWaterMl(vial.bacWaterMl ? vial.bacWaterMl.toString() : '');
    setNextVialDoseAmount(vial.doseAmount ? vial.doseAmount.toString() : '');
    setNextVialDoseUnit(vial.doseUnit || 'mcg');
    setNextVialModalVisible(true);
  };

  const openLogPastModal = (vial: any) => {
    setActiveVial(vial);
    setPastDateInput(new Date().toISOString().split('T')[0]); 
    setPastLogSubjectId('');
    setPastDoseAmount((vial.doseAmount || vial.doseMcg).toString());
    setPastDoseUnit(vial.doseUnit || 'mcg');
    setLogModalVisible(true);
  };

  const handleQuickAddStock = (vial: any) => {
    setStockVialId(vial.id);
    setActiveVial(vial);
    const existingMg = vial.peptides?.[0]?.mg || vial.inventory?.[0]?.mg || 10;
    setAddStockMg(existingMg.toString());
    setAddStockCount('1');
    setStockModalVisible(true);
  };

  const saveQuickAddStock = () => {
    if (!activeVial) return;
    const mg = safeFloat(addStockMg) || 10;
    const countToAdd = safeInt(addStockCount) || 1;

    let updatedInventory = [...(activeVial.inventory || [])];
    const existingIdx = updatedInventory.findIndex((i: any) => safeFloat(i.mg) === mg);
    
    if (existingIdx >= 0) {
      updatedInventory[existingIdx] = {
        ...updatedInventory[existingIdx],
        count: safeInt(updatedInventory[existingIdx].count) + countToAdd,
      };
    } else {
      updatedInventory.push({ mg, count: countToAdd });
    }

    updateVial(
      activeVial.id,
      activeVial.doseAmount,
      activeVial.doseUnit,
      activeVial.frequency,
      activeVial.timeOfDay,
      activeVial.selectedDays,
      updatedInventory,
      activeVial.color,
      activeVial.startDate,
      activeVial.subjects
    );
    setStockModalVisible(false);
    Alert.alert('Inventory Added 📦', `Added ${countToAdd} unopened vial(s) of ${mg}mg to ${activeVial.vialName || activeVial.name}.`);
  };

  const activeVialsList = vials.filter((v: any) => !v.isArchived);

  // Compute Inventory Totals
  const totalUnopenedStockCount = activeVialsList.reduce((sum: number, v: any) => {
    return sum + (v.inventory || []).reduce((invSum: number, i: any) => invSum + safeInt(i.count), 0);
  }, 0);

  const completedVialsCount = vials.reduce((sum: number, v: any) => sum + (safeInt(v.completedVials) || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* PHYSICAL INVENTORY HEADER */}
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.dashHeader}>Physical Inventory & Stock 📦</Text>
          <Text style={styles.dashSub}>Manage unopened stock, reconstituted bottles, and supplies.</Text>
        </View>

        {/* METRICS SUMMARY CARDS */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: c.card, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: c.primary }}>{totalUnopenedStockCount}</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: c.textSub, marginTop: 2, textTransform: 'uppercase' }}>Unopened Stock</Text>
          </View>

          <View style={{ flex: 1, backgroundColor: c.card, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: c.textMain }}>{activeVialsList.length}</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: c.textSub, marginTop: 2, textTransform: 'uppercase' }}>Mixed Bottles</Text>
          </View>

          <View style={{ flex: 1, backgroundColor: c.card, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: c.textSub }}>{completedVialsCount}</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: c.textSub, marginTop: 2, textTransform: 'uppercase' }}>Completed</Text>
          </View>
        </View>

        {/* UNOPENED STOCK MANAGEMENT HUB */}
        <View style={{ backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 20 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: c.textMain, marginBottom: 10 }}>📦 Unopened Vial Stock</Text>

          {activeVialsList.length === 0 ? (
            <Text style={{ color: c.textSub, fontStyle: 'italic', fontSize: 13 }}>No stock items found.</Text>
          ) : (
            activeVialsList.map((vial: any) => {
              const invCount = (vial.inventory || []).reduce((sum: number, i: any) => sum + safeInt(i.count), 0);
              return (
                <View key={vial.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: c.textMain, fontSize: 14 }}>{vial.vialName || vial.name}</Text>
                    <Text style={{ fontSize: 12, color: c.textSub, marginTop: 2 }}>
                      {invCount > 0 ? `📦 ${invCount} Unopened Vial(s) in Stock` : '⚠️ Out of Stock'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => handleQuickAddStock(vial)} style={{ backgroundColor: c.primaryBg, borderColor: c.primary, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                      <Text style={{ color: c.primary, fontWeight: '700', fontSize: 12 }}>+ Add Stock</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openEditModal(vial)}>
                      <Text style={{ color: c.textSub, fontWeight: '600', fontSize: 12 }}>Edit ✏️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* RECONSTITUTED ACTIVE BOTTLES */}
        <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>🧪 Active Reconstituted Bottles ({activeVialsList.length})</Text>

        {activeVialsList.length === 0 ? (
          <Text style={styles.emptyText}>No active mixed bottles. Tap "+ New Plan" in Planner or add a bottle to get started.</Text>
        ) : (
          activeVialsList.map((vial: any) => (
            <VialCard 
              key={vial.id}
              vial={vial}
              isActive={true}
              isExpanded={expandedLogs[vial.id]}
              onToggleExpand={toggleExpandLog}
              onEdit={openEditModal}
              onLogPast={openLogPastModal}
              onStartNextVial={openNextVialModal}
            />
          ))
        )}
      </ScrollView>

      {/* QUICK ADD STOCK MODAL */}
      <Modal visible={stockModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Add Unopened Inventory Stock</Text>
            <Text style={{ color: c.textSub, fontSize: 13, marginBottom: 12 }}>
              Add new unopened vials for {activeVialsList.find((v: any) => v.id === stockVialId)?.vialName || 'Peptide'}.
            </Text>

            <Text style={styles.label}>Vial Mass Size (mg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={addStockMg}
              onChangeText={setAddStockMg}
              placeholder="10"
            />

            <Text style={styles.label}>Quantity to Add</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={addStockCount}
              onChangeText={setAddStockCount}
              placeholder="1"
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setStockModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={saveQuickAddStock}>
                <Text style={styles.saveText}>+ Add Stock</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={editModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          {activeVial && (
            <View style={[styles.modalContent, { maxHeight: '90%' }]}>
              <Text style={styles.sectionTitle}>Edit Protocol</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
              
              <DateInput 
                label="Protocol Start Date" 
                value={editStartDate} 
                onChange={setEditStartDate} 
              />
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 10 }}>
                <Text style={styles.label}>Track for multiple people?</Text>
                <TouchableOpacity onPress={() => setEditIsMultiSubject(!editIsMultiSubject)}>
                  <View style={{ width: 50, height: 28, borderRadius: 14, backgroundColor: editIsMultiSubject ? '#3b82f6' : (theme === 'dark' ? '#374151' : '#e5e7eb'), justifyContent: 'center', padding: 2 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', transform: [{ translateX: editIsMultiSubject ? 22 : 0 }] }} />
                  </View>
                </TouchableOpacity>
              </View>

              {editIsMultiSubject ? (
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.label}>Subjects & Doses</Text>
                  {editSubjects.map((sub, index) => (
                    <View key={sub.id} style={{ marginBottom: 10, padding: 10, backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb', borderRadius: 8, borderWidth: 1, borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <Text style={{ fontWeight: 'bold', color: theme === 'dark' ? '#e5e7eb' : '#374151' }}>Subject {index + 1}</Text>
                        {editSubjects.length > 1 && (
                          <TouchableOpacity onPress={() => handleRemoveEditSubject(sub.id)}>
                            <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Remove</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <TextInput placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#999'} style={[styles.input, { marginBottom: 10 }]} placeholder="Name" value={sub.name} onChangeText={(val) => updateEditSubject(sub.id, 'name', val)} />
                      <View style={styles.doseInputRow}>
                        <TextInput placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#999'} style={styles.doseAmountInput} placeholder="Target Dose" keyboardType="numeric" value={sub.doseAmount} onChangeText={(val) => updateEditSubject(sub.id, 'doseAmount', val)} />
                        <View style={styles.unitToggleContainer}>
                          <TouchableOpacity style={[styles.unitToggleBtn, sub.doseUnit === 'mcg' && styles.unitToggleBtnActive]} onPress={() => updateEditSubject(sub.id, 'doseUnit', 'mcg')}>
                            <Text style={[styles.unitButtonText, sub.doseUnit === 'mcg' && styles.unitButtonTextActive]}>mcg</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.unitToggleBtn, sub.doseUnit === 'mg' && styles.unitToggleBtnActive]} onPress={() => updateEditSubject(sub.id, 'doseUnit', 'mg')}>
                            <Text style={[styles.unitButtonText, sub.doseUnit === 'mg' && styles.unitButtonTextActive]}>mg</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                  <TouchableOpacity style={{ padding: 10, backgroundColor: theme === 'dark' ? '#374151' : '#ffffff', borderRadius: 8, alignItems: 'center', marginBottom: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db' }} onPress={handleAddEditSubject}>
                    <Text style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontWeight: '600', fontSize: 13 }}>+ Add another person</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.label}>Target Dose Amount</Text>
                  <View style={styles.doseInputRow}>
                    <TextInput placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#999'} 
                      style={styles.doseAmountInput} 
                      value={editDose} 
                      onChangeText={setEditDose} 
                      keyboardType="numeric" 
                      placeholder="e.g. 2.5"
                    />
                    <View style={styles.unitToggleContainer}>
                      <TouchableOpacity 
                        style={[styles.unitToggleBtn, editUnit === 'mcg' && styles.unitToggleBtnActive]}
                        onPress={() => setEditUnit('mcg')}
                      >
                        <Text style={[styles.unitButtonText, editUnit === 'mcg' && styles.unitButtonTextActive]}>mcg</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.unitToggleBtn, editUnit === 'mg' && styles.unitToggleBtnActive]}
                        onPress={() => setEditUnit('mg')}
                      >
                        <Text style={[styles.unitButtonText, editUnit === 'mg' && styles.unitButtonTextActive]}>mg</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

            <View style={{ marginTop: 10, marginBottom: 5, borderTopWidth: 1, borderColor: '#e5e7eb', paddingTop: 10 }}>
              <Text style={styles.label}>Inventory</Text>
              {editInventory.length > 0 && (
                <View style={{ flexDirection: 'row', marginBottom: 5, gap: 8, paddingHorizontal: 2 }}>
                  <Text style={{ flex: 1, fontSize: 12, color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontWeight: '600', paddingLeft: 4 }}>Size (mg)</Text>
                  <Text style={{ flex: 1, fontSize: 12, color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontWeight: '600', paddingLeft: 4 }}>Quantity</Text>
                  {editInventory.length > 1 && <View style={{ paddingHorizontal: 10 }}><Text style={{fontWeight: 'bold', color: 'transparent'}}>X</Text></View>}
                </View>
              )}
              {editInventory.map((inv) => (
                <View key={inv.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                  <TextInput placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#999'} style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Size (mg)" keyboardType="numeric" value={inv.mg} onChangeText={(val) => updateEditInventory(inv.id, 'mg', val)} />
                  <TextInput placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#999'} style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Count" keyboardType="numeric" value={inv.count} onChangeText={(val) => updateEditInventory(inv.id, 'count', val)} />
                  {editInventory.length > 1 && (
                    <TouchableOpacity style={{ paddingHorizontal: 10, paddingVertical: 12, backgroundColor: '#fee2e2', borderRadius: 8, justifyContent: 'center' }} onPress={() => handleRemoveEditInventoryRow(inv.id)}>
                      <Text style={{color: '#ef4444', fontWeight: 'bold'}}>X</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={{ padding: 10, backgroundColor: '#ffffff', borderRadius: 8, alignItems: 'center', marginBottom: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#d1d5db' }} onPress={handleAddEditInventoryRow}>
                <Text style={{ color: '#6b7280', fontWeight: '600', fontSize: 13 }}>+ Add another inventory size</Text>
              </TouchableOpacity>
            </View>

              <FrequencyPicker
                label="Frequency"
                frequency={editFreq}
                selectedDays={selectedDays}
                options={frequencyOptions}
                onFrequencyChange={setEditFreq}
                onSelectedDaysChange={setSelectedDays}
              />

              <Text style={styles.label}>Time of Day</Text>
              <View style={styles.unitToggleRow}>
                {timeOptions.map(time => (
                  <TouchableOpacity key={time} style={[styles.unitButton, editTime === time && styles.unitButtonActive]} onPress={() => setEditTime(time)}>
                    <Text style={[styles.unitButtonText, editTime === time && styles.unitButtonTextActive, {fontSize: 12}]}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Vial Color Tag</Text>
            <View style={styles.colorPickerRow}>
              {vialColors.map(c => (
                <TouchableOpacity 
                  key={c} 
                  style={[styles.colorSwatch, { backgroundColor: c }, editColor === c && styles.colorSwatchSelected]} 
                  onPress={() => setEditColor(c)}
                />
              ))}
            </View>
              </ScrollView>

              <View style={styles.modalActionRow}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setEditModalVisible(false)}>
                  <Text style={{color: '#6b7280', fontWeight:'bold'}}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={() => { 
                  const mappedInventory = editInventory.filter(i => i.mg && i.count).map(i => ({ mg: safeFloat(i.mg) || 0, count: safeInt(i.count) || 0 }));
                  const finalDose = editIsMultiSubject ? 0 : editDose;
                  const finalUnit = editIsMultiSubject ? 'mcg' : editUnit;
                  const finalSubjects = editIsMultiSubject ? editSubjects : undefined;
                  updateVial(activeVial.id, finalDose, finalUnit, editFreq, editTime, selectedDays, mappedInventory, editColor, editStartDate, finalSubjects); 
                  setEditModalVisible(false); 
                }}>
                  <Text style={{color:'#fff', fontWeight:'bold'}}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* LOG PAST MODAL */}
      <Modal visible={logModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          {activeVial && (
            <View style={styles.modalContent}>
              <Text style={styles.sectionTitle}>Log Past Injection</Text>

              <DateInput 
                label="Injection Date" 
                value={pastDateInput} 
                onChange={setPastDateInput} 
              />

              {activeVial.subjects && activeVial.subjects.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.label}>Select Who Took This Injection</Text>
                  {activeVial.subjects.map((sub: any) => (
                    <TouchableOpacity 
                      key={sub.id} 
                      style={{ 
                        padding: 10, 
                        borderWidth: 1, 
                        borderColor: pastLogSubjectId === sub.id ? '#3b82f6' : (theme === 'dark' ? '#374151' : '#e5e7eb'), 
                        borderRadius: 8, 
                        marginBottom: 6,
                        backgroundColor: pastLogSubjectId === sub.id ? (theme === 'dark' ? '#1e3a8a' : '#eff6ff') : 'transparent' 
                      }}
                      onPress={() => {
                        setPastLogSubjectId(sub.id);
                        setPastDoseAmount(sub.doseAmount.toString());
                        setPastDoseUnit(sub.doseUnit || 'mcg');
                      }}
                    >
                      <Text style={{ fontWeight: 'bold', color: theme === 'dark' ? '#e5e7eb' : '#1f2937' }}>{sub.name}</Text>
                      <Text style={{ fontSize: 12, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>Default Target: {sub.doseAmount}{sub.doseUnit}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.label}>Dose Amount Taken</Text>
              <View style={styles.doseInputRow}>
                <TextInput placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#999'} 
                  style={styles.doseAmountInput} 
                  value={pastDoseAmount} 
                  onChangeText={setPastDoseAmount} 
                  keyboardType="numeric" 
                  placeholder="e.g. 2.5"
                />
                <View style={styles.unitToggleContainer}>
                  <TouchableOpacity 
                    style={[styles.unitToggleBtn, pastDoseUnit === 'mcg' && styles.unitToggleBtnActive]}
                    onPress={() => setPastDoseUnit('mcg')}
                  >
                    <Text style={[styles.unitButtonText, pastDoseUnit === 'mcg' && styles.unitButtonTextActive]}>mcg</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.unitToggleBtn, pastDoseUnit === 'mg' && styles.unitToggleBtnActive]}
                    onPress={() => setPastDoseUnit('mg')}
                  >
                    <Text style={[styles.unitButtonText, pastDoseUnit === 'mg' && styles.unitButtonTextActive]}>mg</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalActionRow}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setLogModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.modalSave} onPress={() => { 
                  if (activeVial.subjects && activeVial.subjects.length > 0) {
                    if (!pastLogSubjectId) {
                      Alert.alert("Missing Subject", "Please select who took the injection.");
                      return;
                    }
                    const subject = activeVial.subjects.find((s: any) => s.id === pastLogSubjectId);
                    const numericAmount = safeFloat(pastDoseAmount) || 0;
                    const calculatedMcg = pastDoseUnit === 'mg' ? numericAmount * 1000 : numericAmount;
                    logInjection(activeVial.id, numericAmount, pastDoseUnit, calculatedMcg, pastDateInput, subject.id, subject.name);
                  } else {
                    const numericAmount = safeFloat(pastDoseAmount) || 0;
                    const calculatedMcg = pastDoseUnit === 'mg' ? numericAmount * 1000 : numericAmount;
                    logInjection(activeVial.id, numericAmount, pastDoseUnit, calculatedMcg, pastDateInput); 
                  }
                  
                  setLogModalVisible(false); 
                }}>
                  <Text style={styles.saveText}>Save Log</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* NEXT VIAL MODAL */}
      <Modal visible={nextVialModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          {activeVial && (
            <View style={styles.modalContent}>
              <Text style={styles.sectionTitle}>Start Next Vial</Text>
              
              <Text style={styles.label}>Select from Inventory</Text>
              {activeVial.inventory && activeVial.inventory.length > 0 ? (
                activeVial.inventory.map((inv: any, idx: number) => (
                  <TouchableOpacity 
                    key={idx}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderWidth: 1, borderColor: nextVialInventoryIndex === idx ? '#3b82f6' : '#e5e7eb', borderRadius: 8, marginBottom: 8, backgroundColor: nextVialInventoryIndex === idx ? '#eff6ff' : '#fff' }}
                    onPress={() => setNextVialInventoryIndex(idx)}
                    disabled={inv.count <= 0}
                  >
                    <Text style={{ flex: 1, color: inv.count <= 0 ? '#9ca3af' : '#1f2937' }}>{inv.mg}mg Size</Text>
                    <Text style={{ color: inv.count <= 0 ? '#9ca3af' : '#6b7280' }}>{inv.count} Available</Text>
                  </TouchableOpacity>
                ))
              ) : <Text style={{color: '#6b7280', fontStyle: 'italic', marginBottom: 10}}>No inventory listed.</Text>}

              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderWidth: 1, borderColor: nextVialInventoryIndex === -1 ? '#3b82f6' : '#e5e7eb', borderRadius: 8, marginBottom: 15, backgroundColor: nextVialInventoryIndex === -1 ? '#eff6ff' : '#fff' }}
                onPress={() => setNextVialInventoryIndex(-1)}
              >
                <Text style={{ flex: 1, color: '#1f2937' }}>Keep Current Size (Not from inventory)</Text>
              </TouchableOpacity>

              <Text style={styles.label}>Bac Water (ml)</Text>
              <TextInput placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#999'} 
                style={styles.input} 
                keyboardType="numeric" 
                value={nextVialBacWaterMl} 
                onChangeText={setNextVialBacWaterMl} 
                placeholder="e.g. 2"
              />

              <Text style={styles.label}>Target Dose Amount</Text>
              <View style={styles.doseInputRow}>
                <TextInput placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#999'} 
                  style={styles.doseAmountInput} 
                  value={nextVialDoseAmount} 
                  onChangeText={setNextVialDoseAmount} 
                  keyboardType="numeric" 
                  placeholder="e.g. 2.5"
                />
                <View style={styles.unitToggleContainer}>
                  <TouchableOpacity 
                    style={[styles.unitToggleBtn, nextVialDoseUnit === 'mcg' && styles.unitToggleBtnActive]}
                    onPress={() => setNextVialDoseUnit('mcg')}
                  >
                    <Text style={[styles.unitButtonText, nextVialDoseUnit === 'mcg' && styles.unitButtonTextActive]}>mcg</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.unitToggleBtn, nextVialDoseUnit === 'mg' && styles.unitToggleBtnActive]}
                    onPress={() => setNextVialDoseUnit('mg')}
                  >
                    <Text style={[styles.unitButtonText, nextVialDoseUnit === 'mg' && styles.unitButtonTextActive]}>mg</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalActionRow}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setNextVialModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={() => { 
                  startNextVial(activeVial.id, nextVialInventoryIndex, nextVialBacWaterMl, nextVialDoseAmount, nextVialDoseUnit); 
                  setNextVialModalVisible(false); 
                }}>
                  <Text style={styles.saveText}>Save & Start</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}