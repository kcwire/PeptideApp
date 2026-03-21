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
    const vialWithInventory = {
      ...newVial,
      color: newVial.color || '#3b82f6', // Default to blue if none provided
      unopenedVials: newVial.unopenedVials || 0,
      completedVials: 0
    };
    const updatedVials = [vialWithInventory, ...vials];
    setVials(updatedVials);
    saveVials(updatedVials);
  };

  // ADDED color to the end of the arguments!
  const updateVial = (id, doseAmount, doseUnit, frequency, timeOfDay, selectedDays, unopenedVials, color) => {
    const doseMcg = doseUnit === 'mg' ? parseFloat(doseAmount) * 1000 : parseFloat(doseAmount);
    const updatedVials = vials.map(v => 
      v.id === id ? { 
        ...v, doseAmount: parseFloat(doseAmount), doseUnit, doseMcg, frequency, timeOfDay, selectedDays, color,
        unopenedVials: unopenedVials !== undefined ? parseInt(unopenedVials) || 0 : v.unopenedVials
      } : v
    );
    setVials(updatedVials);
    saveVials(updatedVials);
  };

  // NEW: Finishes the current vial, pulls one from inventory, and resets the logs
  const startNextVial = (id, reconDate) => {
    const updatedVials = vials.map(v => {
      if (v.id === id) {
        return {
          ...v,
          completedVials: (v.completedVials || 0) + 1,
          unopenedVials: Math.max(0, (v.unopenedVials || 0) - 1),
          logs: [], // Clear injection history for the fresh vial
          reconstitutedDate: reconDate
        };
      }
      return v;
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
    const logDate = formatDateTime(customDate);
    const newLog = { id: Date.now().toString(), date: logDate, doseAmount, doseUnit, doseMcg };
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