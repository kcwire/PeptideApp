import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useEffect, useState, useContext } from 'react';
import { Alert } from 'react-native';
import { ProtocolConfig } from '../types/protocol';
import { safeFloat, safeInt, VialContext } from './VialContext';
import { calculateProtocolSupplies } from '../utils/protocolMath';

export const ProtocolContext = createContext<any>(null);

const STORAGE_KEY = '@peptide_protocols';

export const ProtocolProvider = ({ children }: { children: React.ReactNode }) => {
  const [protocols, setProtocols] = useState<ProtocolConfig[]>([]);
  const { vials, addVial } = useContext(VialContext) || {};

  useEffect(() => {
    loadProtocols();
  }, []);

  const loadProtocols = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed: ProtocolConfig[] = JSON.parse(saved);
        setProtocols(parsed);
      }
    } catch (error) {
      console.error('Failed to load protocols from storage', error);
    }
  };

  const persistProtocols = async (updated: ProtocolConfig[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save protocols to storage', error);
    }
  };

  const saveProtocol = (newProtocol: Partial<ProtocolConfig>) => {
    const todayStr = new Date().toISOString().split('T')[0];

    const peptidesList = (newProtocol.peptides && newProtocol.peptides.length > 0)
      ? newProtocol.peptides.map(p => ({ name: p.name || 'Peptide', mg: safeFloat(p.mg) }))
      : [{ name: newProtocol.name || 'Peptide', mg: safeFloat(newProtocol.reconstitution?.vialMg) || 10 }];

    const totalCalculatedMg = peptidesList.reduce((sum, p) => sum + p.mg, 0);
    const vialMg = safeFloat(newProtocol.reconstitution?.vialMg) || totalCalculatedMg || 10;

    const formatted: ProtocolConfig = {
      id: newProtocol.id || Date.now().toString() + Math.random().toString(36).substring(2, 6),
      name: newProtocol.name || 'New Peptide Protocol',
      notes: newProtocol.notes || '',
      isMultiSubject: !!newProtocol.isMultiSubject,
      subjects: newProtocol.isMultiSubject && Array.isArray(newProtocol.subjects) ? newProtocol.subjects : undefined,
      peptides: peptidesList,
      phases: (newProtocol.phases || []).map((p, idx) => {
        const selectedDays = Array.isArray(p.selectedDays) && p.selectedDays.length > 0 ? p.selectedDays : ['Mon'];
        return {
          id: p.id || `phase_${idx}_${Date.now()}`,
          phaseName: p.phaseName || `Phase ${idx + 1}`,
          durationWeeks: safeFloat(p.durationWeeks) || 1,
          doseAmount: safeFloat(p.doseAmount),
          doseUnit: p.doseUnit || 'mcg',
          subjectDoses: p.subjectDoses,
          frequency: p.frequency || 'Specific Days',
          selectedDays,
          injectionsPerWeek: p.frequency === 'Specific Days' ? selectedDays.length : (safeFloat(p.injectionsPerWeek) || 1),
        };
      }),
      reconstitution: {
        vialMg,
        bacWaterMl: safeFloat(newProtocol.reconstitution?.bacWaterMl),
        syringeCapacityUnits: safeInt(newProtocol.reconstitution?.syringeCapacityUnits) || 100,
        wasteBufferPercent: safeFloat(newProtocol.reconstitution?.wasteBufferPercent) || 10,
      },
      createdAt: newProtocol.createdAt || todayStr,
      isArchived: false,
    };

    const updated = [formatted, ...protocols.filter(p => p.id !== formatted.id)];
    setProtocols(updated);
    persistProtocols(updated);
    return formatted;
  };

  const duplicateProtocol = (id: string) => {
    const target = protocols.find(p => p.id === id);
    if (!target) return;
    const duplicated: ProtocolConfig = {
      ...target,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      name: `${target.name} (Copy)`,
      createdAt: new Date().toISOString().split('T')[0],
      phases: target.phases.map((p, idx) => ({
        ...p,
        id: `phase_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 4)}`,
      })),
    };
    const updated = [duplicated, ...protocols];
    setProtocols(updated);
    persistProtocols(updated);
    Alert.alert('Protocol Duplicated 📑', `Created template copy "${duplicated.name}".`);
    return duplicated;
  };

  const deleteProtocol = (id: string) => {
    Alert.alert('Delete Protocol', 'Are you sure you want to delete this protocol plan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = protocols.filter(p => p.id !== id);
          setProtocols(updated);
          await persistProtocols(updated);
        },
      },
    ]);
  };

  const toggleArchiveProtocol = (id: string) => {
    const updated = protocols.map(p => (p.id === id ? { ...p, isArchived: !p.isArchived } : p));
    setProtocols(updated);
    persistProtocols(updated);
  };

  const restoreProtocols = (importedProtocols: ProtocolConfig[]) => {
    if (!Array.isArray(importedProtocols)) return;
    const sanitized = importedProtocols.map(p => ({
      ...p,
      id: p.id || Date.now().toString() + Math.random().toString(36).substring(2, 6),
      name: p.name || 'Restored Protocol',
      phases: Array.isArray(p.phases) ? p.phases : [],
    }));
    setProtocols(sanitized);
    persistProtocols(sanitized);
  };

  /**
   * Converts a Protocol Plan into an active tracked Vial on the Dashboard & Protocols screen.
   * Prompts user with Smart Inventory Deduction checking existing unopened stock of matching mg.
   */
  const convertProtocolToVials = (protocol: ProtocolConfig, startDateStr?: string) => {
    if (!addVial) {
      console.warn('VialContext addVial handler unavailable');
      return;
    }

    const supplies = calculateProtocolSupplies(protocol);
    const initialPhase = protocol.phases[0] || { doseAmount: 0, doseUnit: 'mcg', frequency: 'Specific Days', selectedDays: ['Mon'] };
    const todayStr = startDateStr || new Date().toISOString().split('T')[0];

    const vialMg = protocol.reconstitution.vialMg;
    const totalRequiredVials = supplies.vialsRequired;

    const activePeptides = (protocol.peptides && protocol.peptides.length > 0)
      ? protocol.peptides
      : [{ name: protocol.name, mg: vialMg }];

    const processedSubjects = (protocol.isMultiSubject && protocol.subjects && protocol.subjects.length > 0)
      ? protocol.subjects.map(s => {
          const sDoseObj = (initialPhase.subjectDoses || []).find((sd: any) => sd.subjectId === s.id) || {
            doseAmount: initialPhase.doseAmount,
            doseUnit: initialPhase.doseUnit,
          };
          const doseMcg = sDoseObj.doseUnit === 'mg' ? safeFloat(sDoseObj.doseAmount) * 1000 : safeFloat(sDoseObj.doseAmount);
          return {
            id: s.id,
            name: s.name,
            doseAmount: sDoseObj.doseAmount,
            doseUnit: sDoseObj.doseUnit,
            doseMcg,
          };
        })
      : undefined;

    // Smart Inventory Deduction - Query current unopened stock matching vialMg
    let unopenedInStock = 0;
    (vials || []).forEach((v: any) => {
      (v.inventory || []).forEach((inv: any) => {
        if (safeFloat(inv.mg) === safeFloat(vialMg)) {
          unopenedInStock += safeInt(inv.count);
        }
      });
    });

    const netExtraVialsNeeded = Math.max(0, totalRequiredVials - unopenedInStock - 1);

    const executeActivation = (inventoryToAdd: number) => {
      const activeVialPayload = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        vialName: protocol.name,
        notes: `Active Titration Protocol (${supplies.totalDurationWeeks} Weeks total)`,
        protocolId: protocol.id,
        peptides: activePeptides,
        subjects: processedSubjects,
        bacWaterMl: protocol.reconstitution.bacWaterMl,
        doseAmount: initialPhase.doseAmount,
        doseUnit: initialPhase.doseUnit,
        frequency: initialPhase.frequency,
        selectedDays: initialPhase.selectedDays || ['Mon'],
        timeOfDay: 'Any',
        startDate: todayStr,
        dateReconstituted: todayStr,
        color: '#3b82f6',
        inventory: inventoryToAdd > 0 ? [{ mg: vialMg, count: inventoryToAdd }] : [],
        logs: [],
        protocolPhases: protocol.phases,
        protocolSupplies: supplies,
      };

      addVial(activeVialPayload);
      Alert.alert('Protocol Activated! 🚀', `Successfully created active tracking for "${protocol.name}". 1 Vial reconstituted today. ${inventoryToAdd} additional unopened vial(s) added to stock.`);
    };

    if (unopenedInStock > 0) {
      Alert.alert(
        '📦 Smart Inventory Deduction',
        `This protocol requires ${totalRequiredVials} total vial(s).\n\nYou currently have ${unopenedInStock} unopened vial(s) of ${vialMg}mg in stock.\n\nWould you like to subtract your existing stock?`,
        [
          { text: 'Use Inventory (Add ' + netExtraVialsNeeded + ' Extra)', onPress: () => executeActivation(netExtraVialsNeeded) },
          { text: 'Add All ' + Math.max(0, totalRequiredVials - 1) + ' Fresh Vials', onPress: () => executeActivation(Math.max(0, totalRequiredVials - 1)) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      executeActivation(Math.max(0, totalRequiredVials - 1));
    }
  };

  return (
    <ProtocolContext.Provider
      value={{
        protocols,
        saveProtocol,
        duplicateProtocol,
        deleteProtocol,
        toggleArchiveProtocol,
        convertProtocolToVials,
        restoreProtocols,
        loadProtocols,
      }}
    >
      {children}
    </ProtocolContext.Provider>
  );
};
