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
      if (savedVials !== null) setVials(JSON.parse(savedVials));
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
    
    const vialWithInventory = {
      ...newVial,
      startDate: newVial.startDate || todayStr, // Protocol Start Date
      dateReconstituted: newVial.dateReconstituted || todayStr, // The physical bottle date
      color: newVial.color || '#3b82f6',
      unopenedVials: newVial.unopenedVials || 0,
      completedVials: 0
    };
    
    const updatedVials = [vialWithInventory, ...vials];
    setVials(updatedVials);
    saveVials(updatedVials);
  };

  // ADDED color to the end of the arguments!
  const updateVial = (id, doseAmount, doseUnit, frequency, timeOfDay, selectedDays, unopenedVials, color, startDate) => {
    const doseMcg = doseUnit === 'mg' ? parseFloat(doseAmount) * 1000 : parseFloat(doseAmount);
    const updatedVials = vials.map(v => 
      v.id === id ? { 
        ...v, doseAmount: parseFloat(doseAmount), doseUnit, doseMcg, frequency, timeOfDay, selectedDays, color,
        startDate: startDate || v.startDate, 
        unopenedVials: unopenedVials !== undefined ? parseInt(unopenedVials) || 0 : v.unopenedVials
      } : v
    );
    setVials(updatedVials);
    saveVials(updatedVials);
  };

  const startNextVial = (id) => {
    // 1. Get a timezone-safe YYYY-MM-DD string for "today"
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // 2. Update the specific vial's lifecycle data
    const updatedVials = vials.map(vial => {
      if (vial.id === id) {
        return {
          ...vial,
          // Decrement inventory (safeguard against going below 0)
          unopenedVials: Math.max(0, vial.unopenedVials - 1),
          // Increment completed graveyard
          completedVials: (vial.completedVials || 0) + 1,
          // Reset the physical bottle's mix date to right now
          reconstitutedDate: todayStr 
          // Notice we DO NOT touch `startDate` or `logs` so your protocol history is preserved!
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

  const logInjection = (id, doseAmount, doseUnit, doseMcg, customDate = null) => {
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
    const newLog = { id: Date.now().toString(), date: logDate, timestamp: sortableTimestamp, doseAmount, doseUnit, doseMcg };
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