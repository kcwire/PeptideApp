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
  const { addVial } = useContext(VialContext) || {};

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
    const formatted: ProtocolConfig = {
      id: newProtocol.id || Date.now().toString() + Math.random().toString(36).substring(2, 6),
      name: newProtocol.name || 'New Peptide Protocol',
      notes: newProtocol.notes || '',
      phases: (newProtocol.phases || []).map((p, idx) => {
        const selectedDays = Array.isArray(p.selectedDays) && p.selectedDays.length > 0 ? p.selectedDays : ['Mon'];
        return {
          id: p.id || `phase_${idx}_${Date.now()}`,
          phaseName: p.phaseName || `Phase ${idx + 1}`,
          durationWeeks: safeFloat(p.durationWeeks) || 1,
          doseAmount: safeFloat(p.doseAmount),
          doseUnit: p.doseUnit || 'mcg',
          frequency: p.frequency || 'Specific Days',
          selectedDays,
          injectionsPerWeek: p.frequency === 'Specific Days' ? selectedDays.length : (safeFloat(p.injectionsPerWeek) || 1),
        };
      }),
      reconstitution: {
        vialMg: safeFloat(newProtocol.reconstitution?.vialMg),
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

  /**
   * Converts a Protocol Plan into an active tracked Vial on the Dashboard & Protocols screen.
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
    const extraVialCount = Math.max(0, supplies.vialsRequired - 1);

    const activeVialPayload = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      vialName: protocol.name,
      notes: `Active Titration Protocol (${supplies.totalDurationWeeks} Weeks total)`,
      protocolId: protocol.id,
      peptides: [{ name: protocol.name, mg: vialMg }],
      bacWaterMl: protocol.reconstitution.bacWaterMl,
      doseAmount: initialPhase.doseAmount,
      doseUnit: initialPhase.doseUnit,
      frequency: initialPhase.frequency,
      selectedDays: initialPhase.selectedDays || ['Mon'],
      timeOfDay: 'Any',
      startDate: todayStr,
      dateReconstituted: todayStr,
      color: '#3b82f6',
      inventory: extraVialCount > 0 ? [{ mg: vialMg, count: extraVialCount }] : [],
      logs: [],
      protocolPhases: protocol.phases,
      protocolSupplies: supplies,
    };

    addVial(activeVialPayload);
    Alert.alert('Protocol Activated! 🚀', `Successfully created active tracking for "${protocol.name}". Required Vials (${supplies.vialsRequired}) and Syringes (${supplies.totalSyringesRequired}) added to active plan.`);
  };

  return (
    <ProtocolContext.Provider
      value={{
        protocols,
        saveProtocol,
        deleteProtocol,
        toggleArchiveProtocol,
        convertProtocolToVials,
        loadProtocols,
      }}
    >
      {children}
    </ProtocolContext.Provider>
  );
};
