import React, { useContext } from 'react';
import { Alert, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { VialContext } from '../context/VialContext';
import { getStyles } from '../theme';

export default function VialCard({ vial, isActive, isExpanded, onToggleExpand, onEdit, onLogPast, onStartNextVial }: any) {
  const theme = useColorScheme() ?? 'light';
  const styles = getStyles(theme);
  const { toggleArchive, deleteVial, logInjection, deleteLog } = useContext(VialContext);

  const activePeptides = vial.peptides && vial.peptides.length > 0 ? vial.peptides : [{ name: vial.name, mg: vial.vialMg }];
  const vialTitle = vial.vialName || vial.name || "Unnamed Vial";
  const primaryPeptide = activePeptides[0];

  const currentDoseMg = vial.subjects && vial.subjects.length > 0
    ? vial.subjects.reduce((sum, sub) => sum + (sub.doseUnit === 'mg' ? parseFloat(sub.doseAmount) : parseFloat(sub.doseAmount) / 1000), 0)
    : (vial.doseUnit === 'mg' ? vial.doseAmount : vial.doseAmount / 1000);
    
  const concentrationMgPerMl = primaryPeptide.mg / vial.bacWaterMl;
  const volumeMl = currentDoseMg / concentrationMgPerMl;

  const activeReconDate = vial.reconstitutedDate || vial.startDate;
  const [rYear, rMonth, rDay] = activeReconDate.split('-');
  // Set to midnight of the recon date to catch any logs from that day
  const reconTimestamp = new Date(parseInt(rYear), parseInt(rMonth) - 1, parseInt(rDay)).getTime();
  // Filter the history: ONLY look at logs taken on or after the Recon date
  const logsThisVial = vial.logs.filter(log => {
    // Fallback to the ID for any old test data that missed the timestamp update
    const logTime = log.timestamp || parseInt(log.id); 
    return logTime >= reconTimestamp;
  });

  const totalMcgInVial = (vial.peptides[0]?.mg || 0) * 1000; 
  const mcgUsedThisVial = logsThisVial.reduce((sum, log) => sum + (log.doseMcg || 0), 0);
  const currentDoseMcg = currentDoseMg * 1000;
  const remainingDosesCurrent = Math.floor((totalMcgInVial - mcgUsedThisVial) / (currentDoseMcg || 1));
  
  // CYCLE MATH (Current Remaining Vial + Inventory)
  const totalInventoryMg = (vial.inventory || []).reduce((sum, inv) => sum + (inv.mg * inv.count), 0);
  const inventoryCount = (vial.inventory || []).reduce((sum, inv) => sum + inv.count, 0);
  const completedCount = vial.completedVials || 0;
  const totalCycleMgLeft = ((totalMcgInVial - mcgUsedThisVial) / 1000) + totalInventoryMg;
  const totalCycleDosesLeft = Math.floor(totalCycleMgLeft / (currentDoseMg || 1));

  const sortedLogs = [...vial.logs].sort((a, b) => {
    const timeA = a.timestamp || parseInt(a.id);
    const timeB = b.timestamp || parseInt(b.id);
    return timeB - timeA;
  });
  const logsToShow = isExpanded ? sortedLogs : sortedLogs.slice(0, 1);

  const handleStartNext = () => {
    if (onStartNextVial) {
      onStartNextVial(vial);
    }
  };

  return (
    <View style={[
      styles.vialCard, 
      !isActive && styles.archivedCard, 
      { borderLeftWidth: 6, borderLeftColor: vial.color || '#3b82f6' }
    ]}>
      
      {/* Header */}
      <View style={styles.vialHeader}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.vialName}>{vialTitle}</Text>
          <Text style={styles.vialSub}>{activePeptides.map(p => `${p.name} (${p.mg}mg)`).join(' + ')}</Text>
          <Text style={styles.reconstitutedText}>Started: {vial.startDate}</Text>
          <Text style={styles.reconstitutedText}>Recon: {vial.reconstitutedDate}</Text>
        </View>
        <TouchableOpacity onPress={() => onEdit(vial)}>
          <Text style={styles.editLink}>⚙️ Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Mixing Details */}
      <View style={styles.mixDetailsBox}>
        <View style={[styles.mixItem, { borderRightWidth: 1, borderRightColor: '#bae6fd' }]}>
          <Text style={styles.mixLabel} numberOfLines={1} adjustsFontSizeToFit>💧 BAC WATER</Text>
          <Text style={styles.mixValue} numberOfLines={1} adjustsFontSizeToFit>{vial.bacWaterMl} ml</Text>
        </View>
        <View style={styles.mixItem}>
          <Text style={styles.mixLabel} numberOfLines={1} adjustsFontSizeToFit>🧪 PRIMARY CONC.</Text>
          <Text style={styles.mixValue} numberOfLines={1} adjustsFontSizeToFit>{concentrationMgPerMl.toFixed(2)} mg/ml</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Current Vial</Text>
          <Text style={[styles.statValue, isActive && remainingDosesCurrent <= 0 && { color: '#ef4444' }]}>{Math.max(0, remainingDosesCurrent)}</Text>
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={styles.statLabelSub} numberOfLines={1} adjustsFontSizeToFit>Doses left</Text>
          </View>
        </View>
        <View style={styles.statBox}>
           <Text style={styles.statLabel}>Full Cycle Left</Text>
           <Text style={styles.statValue}>{totalCycleDosesLeft}</Text>
           <View style={{ width: '100%', alignItems: 'center' }}>
             <Text style={styles.statLabelSub} numberOfLines={1} adjustsFontSizeToFit>Total Doses</Text>
           </View>
        </View>
      </View>

      {/* Syringe Result */}
      {isActive && (
        <View style={styles.resultBox}>
          <Text style={[styles.resultLabel, { marginBottom: 10 }]}>Syringe Measurement:</Text>
          {vial.subjects && vial.subjects.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15 }}>
              {vial.subjects.map((s, idx) => {
                const sVolumeMl = (s.doseMcg / 1000) / concentrationMgPerMl;
                return (
                  <View key={idx} style={{ alignItems: 'center' }}>
                    <Text style={[styles.resultLabel, { marginBottom: 2, textTransform: 'none', letterSpacing: 0 }]}>{s.name}</Text>
                    <Text style={styles.resultValue}>{(sVolumeMl * 100).toFixed(1)} Units</Text>
                    <View style={{ width: '100%', alignItems: 'center' }}>
                      <Text style={[styles.resultSub, { marginTop: 2 }]} numberOfLines={1} adjustsFontSizeToFit>({s.doseAmount}{s.doseUnit})</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.resultValue}>{(volumeMl * 100).toFixed(1)} Units</Text>
              <View style={{ width: '100%', alignItems: 'center' }}>
                <Text style={[styles.resultSub, { marginTop: 2 }]} numberOfLines={1} adjustsFontSizeToFit>({volumeMl.toFixed(3)} ml)</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Action Row */}
      {isActive && (
        <View style={styles.actionRow}>
            {vial.subjects && vial.subjects.length > 0 ? (
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', flex: 1 }}>
                {vial.subjects.map(s => (
                  <TouchableOpacity key={s.id} style={[styles.actionButton, styles.logNowButton, { flex: 1, minWidth: '45%' }]} onPress={() => {
                    const today = new Date().toISOString().split('T')[0];
                    logInjection(vial.id, s.doseAmount, s.doseUnit, s.doseMcg, today, s.id, s.name);
                  }}>
                    <Text style={styles.actionButtonText}>✓ Log {s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TouchableOpacity style={[styles.actionButton, styles.logNowButton]} onPress={() => {
                const today = new Date().toISOString().split('T')[0];
                logInjection(vial.id, vial.doseAmount, vial.doseUnit, vial.doseMcg, today);
              }}>
                <Text style={styles.actionButtonText}>✓ Log Now</Text>
              </TouchableOpacity>
            )}
          <TouchableOpacity style={[styles.actionButton, styles.logPastButton]} onPress={() => onLogPast(vial)}>
            <Text style={styles.actionButtonText}>📅 Log Past</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Logs */}
      {vial.logs.length > 0 && (
        <View style={styles.logContainer}>
          <Text style={styles.logHeader}>History:</Text>
          {logsToShow.map(log => {
              let cleanDate = typeof log.date === 'string' ? log.date.split(' - ')[0] : 'Invalid Date';            return (
              <View key={log.id} style={styles.logEntryRow}>
                <View style={styles.logTextContainer}>
                  <View style={styles.doseBadge}><Text style={styles.doseBadgeText}>{log.doseAmount}{log.doseUnit}</Text></View>
                  <Text style={styles.logDate} numberOfLines={1} adjustsFontSizeToFit>{cleanDate}</Text>
                  {log.subjectName && (
                    <Text style={{ fontSize: 13, color: '#6b7280', marginLeft: 8, fontStyle: 'italic' }}>({log.subjectName})</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => deleteLog(vial.id, log.id)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.deleteLogText}>x</Text>
                </TouchableOpacity>
              </View>
            );
          })}
          {vial.logs.length > 1 && (
            <TouchableOpacity style={styles.expandButton} onPress={() => onToggleExpand(vial.id)}>
              <Text style={styles.expandButtonText}>{isExpanded ? "Show Less" : `View ${vial.logs.length - 1} More`}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* INVENTORY FOOTER */}
      <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#e5e7eb', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 13, color: '#4b5563', fontWeight: 'bold' }}>
          📦 {inventoryCount} Available  |  🏁 {completedCount} Completed
        </Text>
        {isActive && (
          <TouchableOpacity onPress={handleStartNext} style={{ backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#d1d5db' }}>
             <Text style={{ fontSize: 12, color: '#1f2937', fontWeight: 'bold' }}>Next Vial 🔄</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Footer */}
      <View style={styles.footerRow}>
        <TouchableOpacity onPress={() => toggleArchive(vial.id)}>
          <Text style={styles.archiveText}>{isActive ? "⏸️ Pause Protocol" : "▶️ Resume Protocol"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteVial(vial.id)}>
          <Text style={styles.deleteText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}