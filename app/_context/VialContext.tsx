import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

export const VialContext = createContext(null);

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
        parsed = parsed.map(vial => {
          if (!vial.inventory) {
            vial.inventory = [];
            if (vial.unopenedVials && vial.unopenedVials > 0) {
              const mainMg = vial.peptides && vial.peptides.length > 0 ? vial.peptides[0].mg : (vial.vialMg || 0);
              vial.inventory.push({ mg: mainMg, count: vial.unopenedVials });
            }
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
      await AsyncStorage.setItem('@peptide_vials', JSON.stringify(updatedVials));
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
      doseMcg: s.doseUnit === 'mg' ? parseFloat(s.doseAmount) * 1000 : parseFloat(s.doseAmount)
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
    const doseMcg = doseUnit === 'mg' ? parseFloat(doseAmount) * 1000 : parseFloat(doseAmount);
    
    const processedSubjects = (subjects || []).map(s => ({
      ...s,
      doseMcg: s.doseUnit === 'mg' ? parseFloat(s.doseAmount) * 1000 : parseFloat(s.doseAmount)
    }));

    const updatedVials = vials.map(v => 
      v.id === id ? { 
        ...v, doseAmount: parseFloat(doseAmount), doseUnit, doseMcg, frequency, timeOfDay, selectedDays, color,
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

        const parsedDoseAmount = parseFloat(newDoseAmount) || vial.doseAmount;
        const doseMcg = newDoseUnit === 'mg' ? parsedDoseAmount * 1000 : parsedDoseAmount;

        return {
          ...vial,
          inventory: updatedInventory,
          peptides: newPeptides,
          bacWaterMl: parseFloat(newBacWaterMl) || vial.bacWaterMl,
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
      { text: "Delete", style: "destructive", onPress: () => {
          const updatedVials = vials.filter(v => v.id !== id);
          setVials(updatedVials);
          saveVials(updatedVials);
        }
      }
    ]);
  };

  const logInjection = (id, doseAmount, doseUnit, doseMcg, customDate = null, subjectId = null, subjectName = null) => {
    let targetDateObj = new Date();
    if (customDate) {
      // Splits "2026-03-21" into raw numbers: [2026, 03, 21]
      const [year, month, day] = customDate.split('-');
      // Builds a perfect local date. (JS months are 0-indexed, so we subtract 1)
      targetDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
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
  
  // NEW: Completely overwrites the database with imported backup data
  const restoreData = (importedVials) => {
    setVials(importedVials);
    saveVials(importedVials);
  };

  return (
    <VialContext.Provider value={{ vials, addVial, updateVial, startNextVial, toggleArchive, deleteVial, logInjection, deleteLog, restoreData }}>
      {children}
    </VialContext.Provider>
  );
};