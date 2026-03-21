import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useContext, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VialContext } from '../_context/VialContext';
import VialCard from '../components/VialCard';
import { getStyles, vialColors } from '../theme';

export default function VialsScreen() {
  const theme = useColorScheme() ?? 'light';
  const styles = getStyles(theme);
  const [editColor, setEditColor] = useState(vialColors[0]);

  const { vials, updateVial, logInjection } = useContext(VialContext);
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [activeVial, setActiveVial] = useState(null);
  
  const [editDose, setEditDose] = useState('');
  const [editUnit, setEditUnit] = useState('mcg');
  const [editFreq, setEditFreq] = useState('');
  const [editTime, setEditTime] = useState('Any');
  const [editInventory, setEditInventory] = useState ('0');

  const timeOptions = ['AM', 'PM', 'Any'];
  
  // Date Picker State for Logs
  const [pastDateInput, setPastDateInput] = useState('');
  const [pastDateObj, setPastDateObj] = useState(new Date());
  const [showPastDatePicker, setShowPastDatePicker] = useState(false);
  
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
    setEditTime(vial.timeOfDay || 'Any'); // Loads the current time setting!
    setEditInventory((vial.unopenedVials || 0).toString());
    setEditColor(vial.color || vialColors[0]);
    setEditModalVisible(true);
  };

  const openLogPastModal = (vial) => {
    setActiveVial(vial);
    const today = new Date();
    setPastDateObj(today);
    setPastDateInput(today.toISOString().split('T')[0]);
    setLogModalVisible(true);
  };

  const handlePastDateChange = (event, selectedDate) => {
    setShowPastDatePicker(false);
    if (selectedDate) {
      setPastDateObj(selectedDate);
      setPastDateInput(selectedDate.toISOString().split('T')[0]);
    }
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

              <Text style={styles.label}>Frequency</Text>
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

              {/* NEW: Inventory Input */}
              <Text style={styles.label}>Inventory (Unopened Vials)</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                value={editInventory} 
                onChangeText={setEditInventory} 
                placeholder="e.g. 2"
              />

              <View style={styles.unitToggleRow}>
                {frequencyOptions.map(freq => (
                  <TouchableOpacity key={freq} style={[styles.unitButton, editFreq === freq && styles.unitButtonActive]} onPress={() => setEditFreq(freq)}>
                    <Text style={[styles.unitButtonText, editFreq === freq && styles.unitButtonTextActive, {fontSize: 12}]}>{freq}</Text>
                  </TouchableOpacity>
                ))}
              </View>

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
                  updateVial(activeVial.id, editDose, editUnit, editFreq, editTime, selectedDays, editInventory, editColor); 
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
              
              <Text style={styles.label}>Select Date</Text>
              <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={() => setShowPastDatePicker(true)}>
                <Text style={{ color: '#1f2937', fontSize: 15 }}>{pastDateInput}</Text>
              </TouchableOpacity>

              {showPastDatePicker && (
                <DateTimePicker
                  value={pastDateObj}
                  mode="date"
                  display="default"
                  onChange={handlePastDateChange}
                />
              )}

              <View style={styles.modalActionRow}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setLogModalVisible(false)}><Text style={{color: '#6b7280', fontWeight:'bold'}}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={() => { 
                  logInjection(activeVial.id, activeVial.doseAmount || activeVial.doseMcg, activeVial.doseUnit || 'mcg', activeVial.doseMcg, pastDateInput); 
                  setLogModalVisible(false); 
                }}>
                  <Text style={{color:'#fff', fontWeight:'bold'}}>Save Log</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}