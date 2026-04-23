import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

export const VialContext = createContext(null);

export const safeFloat = (val) => { const n = parseFloat(val); return isNaN(n) ? 0 : n; };
export const safeInt = (val) => { const n = parseInt(val, 10); return isNaN(n) ? 0 : n; };

// Custom Date Formatter for React Native
const formatDateTime = (inputDate) => {
  const d = inputDate ? new Date(inputDate) : new Date();
  
  if (isNaN(d.getTime())) return inputDate; 

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const day = days[d.getDay()];
  const month = months[d.getMonth()];
  const date = d.getDate();

  // Completely removed the hours/minutes/ampm math!
  return `${day}, ${month} ${date}`;
};

export const VialProvider = ({ children }) => {
  const [vials, setVials] = useState([]);

  useEffect(() => {
    loadVials();
  }, []);

  const loadVials = async () => {
    try {
      const savedVials = await AsyncStorage.getItem('@peptide_vials');
      if (savedVials !== null) {
        let parsed = JSON.parse(savedVials);
        
        // Fetch separate logs for vials that don't have them embedded (backward compatibility)
        const keysToFetch = parsed.filter(v => !v.logs).map(v => `@peptide_logs_${v.id}`);
        let logsMap = {};
        if (keysToFetch.length > 0) {
           const fetchedLogs = await AsyncStorage.multiGet(keysToFetch);
           fetchedLogs.forEach(([key, value]) => {
              logsMap[key] = value ? JSON.parse(value) : [];
           });
        }

        parsed = parsed.map(vial => {
          if (!vial.inventory) {
            vial.inventory = [];
            if (vial.unopenedVials && vial.unopenedVials > 0) {
              const mainMg = vial.peptides && vial.peptides.length > 0 ? vial.peptides[0].mg : (vial.vialMg || 0);
              vial.inventory.push({ mg: mainMg, count: vial.unopenedVials });
            }
          }
          // Restore logs
          if (!vial.logs) {
             vial.logs = logsMap[`@peptide_logs_${vial.id}`] || [];
          }
          return vial;
        });
        setVials(parsed);
      }
    } catch (error) {
      console.error('Failed to load vials', error);
    }
  };

  const saveVials = async (updatedVials) => {
    try {
      const metadataOnly = updatedVials.map(({logs, ...rest}) => rest);
      const multiSetPairs = [['@peptide_vials', JSON.stringify(metadataOnly)]];
      updatedVials.forEach(vial => {
         multiSetPairs.push([`@peptide_logs_${vial.id}`, JSON.stringify(vial.logs || [])]);
      });
      await AsyncStorage.multiSet(multiSetPairs);
    } catch (error) {
      console.error('Failed to save vials', error);
    }
  };

  const addVial = (newVial) => {
    // Grab today's date in YYYY-MM-DD format
    const todayStr = new Date().toISOString().split('T')[0]; 
    
    const inventory = newVial.inventory || [];
    
    // Process subjects if any
    const processedSubjects = (newVial.subjects || []).map(s => ({
      ...s,
      doseMcg: s.doseUnit === 'mg' ? safeFloat(s.doseAmount) * 1000 : safeFloat(s.doseAmount)
    }));
    
    const vialWithInventory = {
      ...newVial,
      startDate: newVial.startDate || todayStr, // Protocol Start Date
      dateReconstituted: newVial.dateReconstituted || todayStr, // The physical bottle date
      color: newVial.color || '#3b82f6',
      inventory: inventory,
      subjects: processedSubjects.length > 0 ? processedSubjects : undefined,
      completedVials: 0
    };
    
    const updatedVials = [vialWithInventory, ...vials];
    setVials(updatedVials);
    saveVials(updatedVials);
  };

  // ADDED color to the end of the arguments!
  const updateVial = (id, doseAmount, doseUnit, frequency, timeOfDay, selectedDays, inventory, color, startDate, subjects) => {
    const doseMcg = doseUnit === 'mg' ? safeFloat(doseAmount) * 1000 : safeFloat(doseAmount);
    
    const processedSubjects = (subjects || []).map(s => ({
      ...s,
      doseMcg: s.doseUnit === 'mg' ? safeFloat(s.doseAmount) * 1000 : safeFloat(s.doseAmount)
    }));

    const updatedVials = vials.map(v => 
      v.id === id ? { 
        ...v, doseAmount: safeFloat(doseAmount), doseUnit, doseMcg, frequency, timeOfDay, selectedDays, color,
        startDate: startDate || v.startDate, 
        inventory: inventory || v.inventory || [],
        subjects: processedSubjects.length > 0 ? processedSubjects : undefined
      } : v
    );
    setVials(updatedVials);
    saveVials(updatedVials);
  };

  const startNextVial = (id, inventoryIndex, newBacWaterMl, newDoseAmount, newDoseUnit) => {
    // 1. Get a timezone-safe YYYY-MM-DD string for "today"
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // 2. Update the specific vial's lifecycle data
    const updatedVials = vials.map(vial => {
      if (vial.id === id) {
        let updatedInventory = [...(vial.inventory || [])];
        let primaryMg = vial.peptides && vial.peptides.length > 0 ? vial.peptides[0].mg : 0;
        
        if (inventoryIndex !== undefined && inventoryIndex !== null && inventoryIndex >= 0 && updatedInventory[inventoryIndex]) {
          const selectedInv = updatedInventory[inventoryIndex];
          primaryMg = selectedInv.mg;
          if (selectedInv.count > 0) {
            updatedInventory[inventoryIndex] = { ...selectedInv, count: selectedInv.count - 1 };
          }
        } else if (inventoryIndex === -1) {
          // Selected "Other (Not in Inventory)" so we don't decrement any inventory count, but the size could have changed?
          // Actually, if we allow changing size without inventory, we'd need another parameter. 
          // For now, if -1, we assume no inventory change and user keeps current size.
        }

        let newPeptides = [...(vial.peptides || [])];
        if (newPeptides.length > 0) {
          newPeptides[0] = { ...newPeptides[0], mg: primaryMg };
        }

        const parsedDoseAmount = safeFloat(newDoseAmount) || vial.doseAmount;
        const doseMcg = newDoseUnit === 'mg' ? parsedDoseAmount * 1000 : parsedDoseAmount;

        return {
          ...vial,
          inventory: updatedInventory,
          peptides: newPeptides,
          bacWaterMl: safeFloat(newBacWaterMl) || vial.bacWaterMl,
          doseAmount: parsedDoseAmount,
          doseUnit: newDoseUnit || vial.doseUnit,
          doseMcg: doseMcg,
          completedVials: (vial.completedVials || 0) + 1,
          reconstitutedDate: todayStr 
        };
      }
      return vial;
    });

    setVials(updatedVials);
    saveVials(updatedVials);
  };

  const toggleArchive = (id) => {
    // We will still use 'isArchived' under the hood, but in the UI we treat it as Active/Inactive
    const updatedVials = vials.map(v => v.id === id ? { ...v, isArchived: !v.isArchived } : v);
    setVials(updatedVials);
    saveVials(updatedVials);
  };

  const deleteVial = (id) => {
    Alert.alert("Permanently Delete", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          const updatedVials = vials.filter(v => v.id !== id);
          setVials(updatedVials);
          await saveVials(updatedVials);
          await AsyncStorage.removeItem(`@peptide_logs_${id}`);
        }
      }
    ]);
  };

  const logInjection = (id, doseAmount, doseUnit, doseMcg, customDate = null, subjectId = null, subjectName = null) => {
    let targetDateObj = new Date();
    if (customDate && typeof customDate === 'string' && customDate.includes('-')) {
      const parts = customDate.split('-');
      if (parts.length === 3) {
        targetDateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    
    // Pass the pristine Date object to your formatter
    const logDate = formatDateTime(targetDateObj);
    const sortableTimestamp = targetDateObj.getTime();
    const newLog = { 
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5), 
      date: logDate, 
      timestamp: sortableTimestamp, 
      doseAmount, 
      doseUnit, 
      doseMcg,
      subjectId,
      subjectName
    };
    const updatedVials = vials.map(v => v.id === id ? { ...v, logs: [newLog, ...v.logs] } : v);
    setVials(updatedVials);
    saveVials(updatedVials);
  };

  const deleteLog = (vialId, logId) => {
    const updatedVials = vials.map(v => v.id === vialId ? { ...v, logs: v.logs.filter(l => l.id !== logId) } : v);
    setVials(updatedVials);
    saveVials(updatedVials);
  };
  
  const restoreData = (importedVials) => {
    const validated = importedVials.map(vial => ({
        ...vial,
        id: vial.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
        vialName: vial.vialName || vial.name || "Imported Vial",
        peptides: Array.isArray(vial.peptides) ? vial.peptides : [],
        inventory: Array.isArray(vial.inventory) ? vial.inventory : [],
        logs: Array.isArray(vial.logs) ? vial.logs : [],
        subjects: Array.isArray(vial.subjects) ? vial.subjects : undefined
    }));
    setVials(validated);
    saveVials(validated);
  };

  return (
    <VialContext.Provider value={{ vials, addVial, updateVial, startNextVial, toggleArchive, deleteVial, logInjection, deleteLog, restoreData }}>
      {children}
    </VialContext.Provider>
  );
};