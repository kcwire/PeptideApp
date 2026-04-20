import { useRouter } from 'expo-router';
import DateInput from '../components/DateInput';
import React, { useContext, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VialContext } from '../_context/VialContext';
import { getStyles, vialColors } from '../theme';

export default function AddScreen() {
  const theme = useColorScheme() ?? 'light';
  const styles = getStyles(theme);
  const [color, setColor] = useState(vialColors[0]);
  const { addVial } = useContext(VialContext);
  const router = useRouter();

  const [vialName, setVialName] = useState('');
  const [peptides, setPeptides] = useState([{ id: '1', name: '', mg: '' }]);
  const [bacWaterMl, setBacWaterMl] = useState('');
  const [inventory, setInventory] = useState([{ id: '1', mg: '', count: '0' }]);
  
  const [doseAmount, setDoseAmount] = useState('');
  const [doseUnit, setDoseUnit] = useState('mcg'); 
  const [frequency, setFrequency] = useState('Daily');
  
  const [isMultiSubject, setIsMultiSubject] = useState(false);
  const [subjects, setSubjects] = useState([{ id: '1', name: '', doseAmount: '', doseUnit: 'mcg' }]);
  
  // Date Picker State
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reconstitutedDate, setReconstitutedDate] = useState('');
  const frequencyOptions = ['Daily', 'Mon-Fri', 'Specific Days'];

  const [selectedDays, setSelectedDays] = useState(['Mon', 'Thu']);

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) setSelectedDays(selectedDays.filter(d => d !== day));
    else setSelectedDays([...selectedDays, day]);
  };

  const [timeOfDay, setTimeOfDay] = useState('AM');
  const timeOptions = ['AM', 'PM', 'Any'];

  const handleAddPeptideRow = () => setPeptides([...peptides, { id: Date.now().toString(), name: '', mg: '' }]);
  const handleRemovePeptideRow = (id) => {
    if (peptides.length === 1) return;
    setPeptides(peptides.filter(p => p.id !== id));
  };
  const updatePeptide = (id, field, value) => setPeptides(peptides.map(p => p.id === id ? { ...p, [field]: value } : p));

  const handleAddInventoryRow = () => setInventory([...inventory, { id: Date.now().toString(), mg: '', count: '0' }]);
  const handleRemoveInventoryRow = (id) => {
    if (inventory.length === 1) return;
    setInventory(inventory.filter(i => i.id !== id));
  };
  const updateInventory = (id, field, value) => setInventory(inventory.map(i => i.id === id ? { ...i, [field]: value } : i));

  const handleAddSubject = () => setSubjects([...subjects, { id: Date.now().toString(), name: '', doseAmount: '', doseUnit: 'mcg' }]);
  const handleRemoveSubject = (id) => {
    if (subjects.length === 1) return;
    setSubjects(subjects.filter(s => s.id !== id));
  };
  const updateSubject = (id, field, value) => setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));


  const handleAdd = () => {
    const hasEmptyPeptides = peptides.some(p => !p.name || !p.mg);
    const hasEmptySubjects = isMultiSubject && subjects.some(s => !s.name || !s.doseAmount);
    
    if (!vialName || hasEmptyPeptides || !bacWaterMl || (!isMultiSubject && !doseAmount) || hasEmptySubjects) {
      Alert.alert("Missing Info", "Please fill out all required fields.");
      return;
    }

    const newVial = {
      id: Date.now().toString(),
      vialName: vialName,
      peptides: peptides.map(p => ({ name: p.name, mg: parseFloat(p.mg) })),
      bacWaterMl: parseFloat(bacWaterMl),
      doseAmount: isMultiSubject ? 0 : parseFloat(doseAmount),
      doseUnit: isMultiSubject ? 'mcg' : doseUnit,
      doseMcg: isMultiSubject ? 0 : (doseUnit === 'mg' ? parseFloat(doseAmount) * 1000 : parseFloat(doseAmount)),
      subjects: isMultiSubject ? subjects : undefined,
      frequency,
      selectedDays,
      inventory: inventory.filter(i => i.mg && i.count).map(i => ({ mg: parseFloat(i.mg) || 0, count: parseInt(i.count) || 0 })),
      color,
      startDate,
      timeOfDay: timeOfDay,
      reconstitutedDate: reconstitutedDate || new Date().toISOString().split('T')[0],
      logs: [],
      isArchived: false
    };

    addVial(newVial);
    
    setVialName(''); setPeptides([{ id: '1', name: '', mg: '' }]); setBacWaterMl(''); setDoseAmount(''); setReconstitutedDate(''); setInventory([{ id: '1', mg: '', count: '0' }]);
    router.push('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Add New Vial</Text>
            
            <Text style={styles.label}>Vial / Blend Name</Text>
            <TextInput placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#999'} style={styles.input} placeholder="e.g. Glow, Recovery Blend, or BPC-157" value={vialName} onChangeText={setVialName} />

            <View style={{ marginTop: 10, marginBottom: 5, borderTopWidth: 1, borderColor: '#e5e7eb', paddingTop: 10 }}>
              <Text style={styles.label}>Peptides in this Vial</Text>
              {peptides.map((pep) => (
                <View key={pep.id} style={styles.blendRow}>
                  <TextInput placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#999'} style={[styles.input, { flex: 2, marginBottom: 0 }]} placeholder="Name (e.g. GHK-Cu)" value={pep.name} onChangeText={(val) => updatePeptide(pep.id, 'name', val)} />
                  <TextInput placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#999'} style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="mg" keyboardType="numeric" value={pep.mg} onChangeText={(val) => updatePeptide(pep.id, 'mg', val)} />
                  {peptides.length > 1 && (
                    <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemovePeptideRow(pep.id)}>
                      <Text style={{color: '#ef4444', fontWeight: 'bold'}}>X</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addBlendBtn} onPress={handleAddPeptideRow}>
                <Text style={styles.addBlendText}>+ Add another peptide to blend</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Bac Water (ml)</Text>
            <TextInput placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#999'} style={styles.input} placeholder="2" keyboardType="numeric" value={bacWaterMl} onChangeText={setBacWaterMl} />

            {/* Multi Subject Toggle */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 10 }}>
              <Text style={styles.label}>Track for multiple people?</Text>
              <TouchableOpacity onPress={() => setIsMultiSubject(!isMultiSubject)}>
                <View style={{ width: 50, height: 28, borderRadius: 14, backgroundColor: isMultiSubject ? '#3b82f6' : (theme === 'dark' ? '#374151' : '#e5e7eb'), justifyContent: 'center', padding: 2 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', transform: [{ translateX: isMultiSubject ? 22 : 0 }] }} />
                </View>
              </TouchableOpacity>
            </View>

            {isMultiSubject ? (
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>Add a name and custom target dose for everyone taking this injection.</Text>
                {subjects.map((sub, index) => (
                  <View key={sub.id} style={{ marginBottom: 10, padding: 10, backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb', borderRadius: 8, borderWidth: 1, borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <Text style={{ fontWeight: 'bold', color: theme === 'dark' ? '#e5e7eb' : '#374151' }}>Subject {index + 1}</Text>
                      {subjects.length > 1 && (
                        <TouchableOpacity onPress={() => handleRemoveSubject(sub.id)}>
                          <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Remove</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <TextInput placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#999'} style={[styles.input, { marginBottom: 10 }]} placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#999'} placeholder="Name (e.g. John)" value={sub.name} onChangeText={(val) => updateSubject(sub.id, 'name', val)} />
                    <View style={styles.doseInputRow}>
                      <TextInput placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#999'} style={styles.doseAmountInput} placeholder="Target Dose (e.g. 2.5)" keyboardType="numeric" value={sub.doseAmount} onChangeText={(val) => updateSubject(sub.id, 'doseAmount', val)} />
                      <View style={styles.unitToggleContainer}>
                        <TouchableOpacity style={[styles.unitToggleBtn, sub.doseUnit === 'mcg' && styles.unitToggleBtnActive]} onPress={() => updateSubject(sub.id, 'doseUnit', 'mcg')}>
                          <Text style={[styles.unitButtonText, sub.doseUnit === 'mcg' && styles.unitButtonTextActive]}>mcg</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.unitToggleBtn, sub.doseUnit === 'mg' && styles.unitToggleBtnActive]} onPress={() => updateSubject(sub.id, 'doseUnit', 'mg')}>
                          <Text style={[styles.unitButtonText, sub.doseUnit === 'mg' && styles.unitButtonTextActive]}>mg</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={[styles.addBlendBtn, { backgroundColor: theme === 'dark' ? '#374151' : '#ffffff' }]} onPress={handleAddSubject}>
                  <Text style={styles.addBlendText}>+ Add another person</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.label}>Target Dose for {peptides[0].name || 'Primary Peptide'}</Text>
                <View style={styles.doseInputRow}>
                  <TextInput placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#999'} style={styles.doseAmountInput} placeholder="e.g. 2.5" keyboardType="numeric" value={doseAmount} onChangeText={setDoseAmount} />
                  <View style={styles.unitToggleContainer}>
                    <TouchableOpacity style={[styles.unitToggleBtn, doseUnit === 'mcg' && styles.unitToggleBtnActive]} onPress={() => setDoseUnit('mcg')}>
                      <Text style={[styles.unitButtonText, doseUnit === 'mcg' && styles.unitButtonTextActive]}>mcg</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.unitToggleBtn, doseUnit === 'mg' && styles.unitToggleBtnActive]} onPress={() => setDoseUnit('mg')}>
                      <Text style={[styles.unitButtonText, doseUnit === 'mg' && styles.unitButtonTextActive]}>mg</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            <Text style={styles.label}>Injection Frequency</Text>
            {/* Custom Day Picker */}
            <View style={styles.unitToggleRow}>
              {frequencyOptions.map(freq => (
                <TouchableOpacity key={freq} style={[styles.unitButton, frequency === freq && styles.unitButtonActive]} onPress={() => setFrequency(freq)}>
                  <Text style={[styles.unitButtonText, frequency === freq && styles.unitButtonTextActive]}>{freq}</Text>
                </TouchableOpacity>
              ))}
            </View>
            { frequency === 'Specific Days' && (
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

            

            <Text style={styles.label}>Time of Day</Text>
            <View style={styles.unitToggleRow}>
              {timeOptions.map(time => (
                <TouchableOpacity key={time} style={[styles.unitButton, timeOfDay === time && styles.unitButtonActive]} onPress={() => setTimeOfDay(time)}>
                  <Text style={[styles.unitButtonText, timeOfDay === time && styles.unitButtonTextActive]}>{time}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ marginTop: 10, marginBottom: 5, borderTopWidth: 1, borderColor: '#e5e7eb', paddingTop: 10 }}>
              <Text style={styles.label}>Inventory</Text>
              {inventory.map((inv) => (
                <View key={inv.id} style={styles.blendRow}>
                  <TextInput placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#999'} style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Size (mg)" keyboardType="numeric" value={inv.mg} onChangeText={(val) => updateInventory(inv.id, 'mg', val)} />
                  <TextInput placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#999'} style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Count" keyboardType="numeric" value={inv.count} onChangeText={(val) => updateInventory(inv.id, 'count', val)} />
                  {inventory.length > 1 && (
                    <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveInventoryRow(inv.id)}>
                      <Text style={{color: '#ef4444', fontWeight: 'bold'}}>X</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addBlendBtn} onPress={handleAddInventoryRow}>
                <Text style={styles.addBlendText}>+ Add another inventory size</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Vial Color Tag</Text>
            <View style={styles.colorPickerRow}>
              {vialColors.map(c => (
                <TouchableOpacity 
                  key={c} 
                  style={[styles.colorSwatch, { backgroundColor: c }, color === c && styles.colorSwatchSelected]} 
                  onPress={() => setColor(c)}
                />
              ))}
            </View>

            <DateInput 
              label="Protocol Start Date" 
              value={startDate} 
              onChange={setStartDate} 
              placeholder="Select Date (Defaults to Today)" 
            />

            <DateInput 
              label="Date Reconstituted" 
              value={reconstitutedDate} 
              onChange={setReconstitutedDate} 
              placeholder="Select Date (Defaults to Today)" 
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleAdd}>
              <Text style={styles.buttonText}>Calculate & Save</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}