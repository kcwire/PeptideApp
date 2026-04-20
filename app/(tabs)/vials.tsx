import React, { useContext, useState } from 'react';
import DateInput from '../components/DateInput';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VialContext } from '../_context/VialContext';
import VialCard from '../components/VialCard';
import { getStyles, vialColors } from '../theme';

export default function VialsScreen() {
  const theme = useColorScheme() ?? 'light';
  const styles = getStyles(theme);
  const [editColor, setEditColor] = useState(vialColors[0]);

  const { vials, updateVial, logInjection, startNextVial } = useContext(VialContext);
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [activeVial, setActiveVial] = useState(null);
  
  const [editDose, setEditDose] = useState('');
  const [editUnit, setEditUnit] = useState('mcg');
  const [editFreq, setEditFreq] = useState('');
  const [editTime, setEditTime] = useState('Any');
  const [editInventory, setEditInventory] = useState([{ id: '1', mg: '', count: '0' }]);
  
  const [nextVialModalVisible, setNextVialModalVisible] = useState(false);
  const [nextVialInventoryIndex, setNextVialInventoryIndex] = useState(-1);
  const [nextVialBacWaterMl, setNextVialBacWaterMl] = useState('');
  const [nextVialDoseAmount, setNextVialDoseAmount] = useState('');
  const [nextVialDoseUnit, setNextVialDoseUnit] = useState('mcg');

  const timeOptions = ['AM', 'PM', 'Any'];
  
  // Date Picker State for Logs
  const [pastDateInput, setPastDateInput] = useState('');
  const [pastDoseAmount, setPastDoseAmount] = useState('');
  const [pastDoseUnit, setPastDoseUnit] = useState('mcg');

  const [editStartDate, setEditStartDate] = useState('');
  
  const [expandedLogs, setExpandedLogs] = useState({});
  const frequencyOptions = ['Daily', 'Mon-Fri', 'Specific Days'];

  const [selectedDays, setSelectedDays] = useState(['Mon', 'Thu']);

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) setSelectedDays(selectedDays.filter(d => d !== day));
    else setSelectedDays([...selectedDays, day]);
  };
  const toggleExpandLog = (vialId) => setExpandedLogs(prev => ({ ...prev, [vialId]: !prev[vialId] }));

  const openEditModal = (vial) => {
    setActiveVial(vial);
    setEditDose((vial.doseAmount || vial.doseMcg).toString());
    setEditUnit(vial.doseUnit || 'mcg');
    setEditFreq(vial.frequency || 'Daily');
    setSelectedDays(vial.selectedDays || (vial.frequency === 'Bi-Weekly' ? ['Mon', 'Thu'] : []));
    setEditTime(vial.timeOfDay || 'Any');
    
    if (vial.inventory && vial.inventory.length > 0) {
      setEditInventory(vial.inventory.map((i, idx) => ({ id: idx.toString(), mg: i.mg.toString(), count: i.count.toString() })));
    } else {
      setEditInventory([{ id: '1', mg: '', count: '0' }]);
    }
    setEditColor(vial.color || vialColors[0]);
    setEditStartDate(vial.startDate || new Date().toISOString().split('T')[0]);
    setEditModalVisible(true);
  };

  const handleAddEditInventoryRow = () => setEditInventory([...editInventory, { id: Date.now().toString(), mg: '', count: '0' }]);
  const handleRemoveEditInventoryRow = (id) => {
    if (editInventory.length === 1) return;
    setEditInventory(editInventory.filter(i => i.id !== id));
  };
  const updateEditInventory = (id, field, value) => setEditInventory(editInventory.map(i => i.id === id ? { ...i, [field]: value } : i));

  const openNextVialModal = (vial) => {
    setActiveVial(vial);
    const defaultIndex = vial.inventory ? vial.inventory.findIndex(i => i.count > 0) : -1;
    setNextVialInventoryIndex(defaultIndex);
    setNextVialBacWaterMl(vial.bacWaterMl ? vial.bacWaterMl.toString() : '');
    setNextVialDoseAmount(vial.doseAmount ? vial.doseAmount.toString() : '');
    setNextVialDoseUnit(vial.doseUnit || 'mcg');
    setNextVialModalVisible(true);
  };

  const openLogPastModal = (vial) => {
    setActiveVial(vial);
    setPastDateInput(new Date().toISOString().split('T')[0]); 
    setPastDoseAmount((vial.doseAmount || vial.doseMcg).toString());
    setPastDoseUnit(vial.doseUnit || 'mcg');
    setLogModalVisible(true);
  };


  const activeVialsList = vials.filter(v => !v.isArchived);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeVialsList.length === 0 ? <Text style={styles.emptyText}>No active vials. Add one from the tabs below.</Text> : 
          activeVialsList.map(vial => (
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
        }
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={editModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          {activeVial && (
            <View style={styles.modalContent}>
              <Text style={styles.sectionTitle}>Edit Protocol</Text>
              
              <Text style={styles.label}>New Dose for {activeVial.peptides ? activeVial.peptides[0].name : activeVial.name}</Text>
              <View style={styles.row}>
                <View style={{ width: '60%' }}>
                  <TextInput style={styles.input} keyboardType="numeric" value={editDose} onChangeText={setEditDose} placeholder="Amount"/>
                </View>
                <View style={{ width: '35%' }}>
                  <View style={[styles.unitToggleRow, { marginTop: 0, marginBottom: 0 }]}>
                    <TouchableOpacity style={[styles.unitButton, editUnit === 'mcg' && styles.unitButtonActive]} onPress={() => setEditUnit('mcg')}>
                      <Text style={[styles.unitButtonText, editUnit === 'mcg' && styles.unitButtonTextActive]}>mcg</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.unitButton, editUnit === 'mg' && styles.unitButtonActive]} onPress={() => setEditUnit('mg')}>
                      <Text style={[styles.unitButtonText, editUnit === 'mg' && styles.unitButtonTextActive]}>mg</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>              

              <DateInput 
                label="Protocol Start Date" 
                value={editStartDate} 
                onChange={setEditStartDate} 
              />
              {/* NEW: Inventory Input */}
            <View style={{ marginTop: 10, marginBottom: 5, borderTopWidth: 1, borderColor: '#e5e7eb', paddingTop: 10 }}>
              <Text style={styles.label}>Inventory</Text>
              {editInventory.map((inv) => (
                <View key={inv.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                  <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Size (mg)" keyboardType="numeric" value={inv.mg} onChangeText={(val) => updateEditInventory(inv.id, 'mg', val)} />
                  <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Count" keyboardType="numeric" value={inv.count} onChangeText={(val) => updateEditInventory(inv.id, 'count', val)} />
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

              <Text style={styles.label}>Frequency</Text>
              <View style={styles.unitToggleRow}>
                {frequencyOptions.map(freq => (
                  <TouchableOpacity key={freq} style={[styles.unitButton, editFreq === freq && styles.unitButtonActive]} onPress={() => setEditFreq(freq)}>
                    <Text style={[styles.unitButtonText, editFreq === freq && styles.unitButtonTextActive, {fontSize: 12}]}>{freq}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Custom Day Picker */}
              { (editFreq === 'Specific Days' || editFreq === 'Specific Days') && (
                <View style={styles.dayPickerRow}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <TouchableOpacity 
                      key={d} 
                      style={[styles.dayPickerCircle, selectedDays.includes(d) && styles.dayPickerCircleActive]} 
                      onPress={() => toggleDay(d)}
                    >
                      <Text style={[styles.dayPickerText, selectedDays.includes(d) && styles.dayPickerTextActive]}>
                        {d.charAt(0)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* NEW: Time of Day Toggle */}
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

              <View style={styles.modalActionRow}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setEditModalVisible(false)}>
                  <Text style={{color: '#6b7280', fontWeight:'bold'}}>Cancel</Text>
                </TouchableOpacity>
                {/* NEW: Passed editTime into the update function */}
                <TouchableOpacity style={styles.modalSave} onPress={() => { 
                  const mappedInventory = editInventory.filter(i => i.mg && i.count).map(i => ({ mg: parseFloat(i.mg) || 0, count: parseInt(i.count) || 0 }));
                  updateVial(activeVial.id, editDose, editUnit, editFreq, editTime, selectedDays, mappedInventory, editColor, editStartDate); 
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
              
              {/* DATE SELECTOR */}
              <DateInput 
                label="Select Date" 
                value={pastDateInput} 
                onChange={setPastDateInput} 
              />
              {/* DOSE OVERRIDE INPUTS */}
              <Text style={styles.label}>Dose Administered</Text>
              <View style={styles.doseInputRow}>
                <TextInput 
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
                    <Text style={[styles.unitButtonText, pastDoseUnit === 'mg' && styles.unitButtonActive]}>mg</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* SAVE / CANCEL */}
              <View style={styles.modalActionRow}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setLogModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.modalSave} onPress={() => { 
                  const numericAmount = parseFloat(pastDoseAmount) || 0;
                  const calculatedMcg = pastDoseUnit === 'mg' ? numericAmount * 1000 : numericAmount;
                  
                  logInjection(
                    activeVial.id, 
                    numericAmount, 
                    pastDoseUnit, 
                    calculatedMcg, 
                    pastDateInput
                  ); 
                  
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
                activeVial.inventory.map((inv, idx) => (
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
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                value={nextVialBacWaterMl} 
                onChangeText={setNextVialBacWaterMl} 
                placeholder="e.g. 2"
              />

              <Text style={styles.label}>Target Dose Amount</Text>
              <View style={styles.doseInputRow}>
                <TextInput 
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