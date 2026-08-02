import React, { useContext } from 'react';
import { Alert, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { VialContext } from '../context/VialContext';
import { getStyles } from '../theme';
import { getProtocolPhaseForDate } from '../utils/protocolMath';

export default function VialCard({ vial, isActive, isExpanded, onToggleExpand, onEdit, onLogPast, onStartNextVial }: any) {
  const theme = useColorScheme() ?? 'light';
  const styles = getStyles(theme);
  const { toggleArchive, deleteVial, logInjection, deleteLog } = useContext(VialContext);

  const activePeptides = vial.peptides && vial.peptides.length > 0 ? vial.peptides : [{ name: vial.name, mg: vial.vialMg }];
  const vialTitle = vial.vialName || vial.name || "Unnamed Vial";
  const primaryPeptide = activePeptides[0];

  // Dynamic titration phase for today
  const phaseInfo = getProtocolPhaseForDate(vial, new Date());

  const currentDoseMg = vial.subjects && vial.subjects.length > 0
    ? vial.subjects.reduce((sum: number, sub: any) => sum + (sub.doseUnit === 'mg' ? parseFloat(sub.doseAmount) : parseFloat(sub.doseAmount) / 1000), 0)
    : (phaseInfo.doseUnit === 'mg' ? phaseInfo.doseAmount : phaseInfo.doseAmount / 1000);
    
  const concentrationMgPerMl = primaryPeptide.mg / vial.bacWaterMl;
  const volumeMl = currentDoseMg / concentrationMgPerMl;

  const activeReconDate = vial.reconstitutedDate || vial.startDate;
  const [rYear, rMonth, rDay] = activeReconDate ? activeReconDate.split('-') : new Date().toISOString().split('T')[0].split('-');
  const reconTimestamp = new Date(parseInt(rYear), parseInt(rMonth) - 1, parseInt(rDay)).getTime();

  // Defensively fallback vial.logs to empty array if missing
  const rawLogs: any[] = Array.isArray(vial.logs) ? vial.logs : [];

  const logsThisVial = rawLogs.filter(log => {
    const logTime = log.timestamp || parseInt(log.id); 
    return logTime >= reconTimestamp;
  });

  const totalMcgInVial = (vial.peptides?.[0]?.mg || 0) * 1000; 
  const mcgUsedThisVial = logsThisVial.reduce((sum: number, log: any) => sum + (log.doseMcg || 0), 0);
  const currentDoseMcg = currentDoseMg * 1000;
  const remainingDosesCurrent = Math.floor((totalMcgInVial - mcgUsedThisVial) / (currentDoseMcg || 1));
  
  // CYCLE MATH (Current Remaining Vial + Inventory)
  const totalInventoryMg = (vial.inventory || []).reduce((sum: number, inv: any) => sum + (inv.mg * inv.count), 0);
  const inventoryCount = (vial.inventory || []).reduce((sum: number, inv: any) => sum + inv.count, 0);
  const completedCount = vial.completedVials || 0;
  const totalCycleMgLeft = ((totalMcgInVial - mcgUsedThisVial) / 1000) + totalInventoryMg;
  const totalCycleDosesLeft = Math.floor(totalCycleMgLeft / (currentDoseMg || 1));

  const sortedLogs = [...rawLogs].sort((a, b) => {
    const timeA = a.timestamp || parseInt(a.id);
    const timeB = b.timestamp || parseInt(b.id);
    return timeB - timeA;
  });
  const logsToShow = isExpanded ? sortedLogs : sortedLogs.slice(0, 1);

  const handleStartNext = () => {
    if (vial.inventory && vial.inventory.length > 0) {
      if (onStartNextVial) {
        onStartNextVial(vial);
      }
    } else {
      Alert.alert(
        "No Inventory Available",
        "You don't have any unopened vials in your inventory. Would you like to add some now or start a new vial anyway?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Add Inventory", onPress: () => onEdit(vial) }
        ]
      );
    }
  };

  return (
    <View style={[styles.vialCard, !isActive && styles.archivedCard, { borderLeftWidth: 6, borderLeftColor: vial.color || '#3b82f6' }]}>
      {/* HEADER ROW */}
      <View style={styles.vialHeader}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={styles.vialName}>{vialTitle}</Text>
            {phaseInfo.phaseName ? <Text style={{ fontSize: 12, color: '#2563eb', marginLeft: 8, fontWeight: '700' }}>({phaseInfo.phaseName})</Text> : null}
            {vial.notes ? <Text style={{ fontSize: 12, color: '#6b7280', marginLeft: 8, fontStyle: 'italic' }}>({vial.notes})</Text> : null}
          </View>
          
          <View style={{ marginTop: 4 }}>
            {activePeptides.map((p: any, idx: number) => (
               <Text key={idx} style={{ fontSize: 13, color: '#4b5563', fontWeight: '500' }}>
                 🧪 {p.name}: <Text style={{ fontWeight: 'bold' }}>{p.mg}mg</Text>
               </Text>
            ))}
          </View>

          <Text style={styles.reconstitutedText}>
             💧 Mixed: {vial.bacWaterMl}mL BAC ({concentrationMgPerMl.toFixed(2)}mg/mL)
          </Text>
        </View>

        {/* Action Menu Links */}
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <TouchableOpacity onPress={() => toggleArchive(vial.id)}>
             <Text style={styles.editLink}>{isActive ? "Pause ⏸️" : "Reactivate 🔄"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onEdit(vial)}>
             <Text style={styles.editLink}>Edit ✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteVial(vial.id)}>
             <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: 'bold' }}>Delete 🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* DOSE & SCHEDULE SUMMARY */}
      <View style={styles.statsGrid}>
         <View style={styles.statBox}>
           <Text style={styles.statLabel}>Current Target Dose</Text>
           {vial.subjects && vial.subjects.length > 0 ? (
             <View style={{ alignItems: 'center' }}>
               <Text style={[styles.statValue, { color: '#2563eb' }]}>{currentDoseMg.toFixed(2)} mg total</Text>
               <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>({vial.subjects.length} subjects split)</Text>
             </View>
           ) : (
             <Text style={[styles.statValue, { color: '#2563eb' }]}>
               {phaseInfo.doseAmount} {phaseInfo.doseUnit}
             </Text>
           )}
         </View>

         <View style={styles.statBox}>
           <Text style={styles.statLabel}>Syringe Pull (U-100)</Text>
           <Text style={[styles.statValue, { color: '#059669' }]}>
             {(volumeMl * 100).toFixed(1)} Units
           </Text>
           <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>({volumeMl.toFixed(2)} mL)</Text>
         </View>
      </View>

      {/* MULTI-SUBJECT EXPANDED DOSE BREAKDOWN */}
      {vial.subjects && vial.subjects.length > 0 && (
        <View style={{ backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 6 }}>👥 Multi-Subject Split:</Text>
          {vial.subjects.map((s: any, idx: number) => {
             const subDoseMg = s.doseUnit === 'mg' ? parseFloat(s.doseAmount) : parseFloat(s.doseAmount) / 1000;
             const subVol = subDoseMg / concentrationMgPerMl;
             return (
               <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                 <Text style={{ fontSize: 12, color: '#334155', fontWeight: '600' }}>• {s.name || `Subject ${idx+1}`}:</Text>
                 <Text style={{ fontSize: 12, color: '#0f172a', fontWeight: 'bold' }}>
                   {s.doseAmount} {s.doseUnit} <Text style={{ color: '#059669', fontWeight: 'normal' }}>({(subVol * 100).toFixed(1)} Units)</Text>
                 </Text>
               </View>
             );
          })}
        </View>
      )}

      {/* VIAL REMAINING & CYCLE CAPACITY */}
      <View style={{ backgroundColor: '#f0fdf4', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#bbf7d0', flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 11, color: '#166534', fontWeight: 'bold', textTransform: 'uppercase' }}>Active Bottle Left</Text>
          <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#15803d', marginTop: 2 }}>
            ~{remainingDosesCurrent} Doses <Text style={{ fontSize: 12, fontWeight: 'normal', color: '#166534' }}>({((totalMcgInVial - mcgUsedThisVial) / 1000).toFixed(1)}mg)</Text>
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 11, color: '#166534', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Cycle Stock</Text>
          <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#15803d', marginTop: 2 }}>
            ~{totalCycleDosesLeft} Doses <Text style={{ fontSize: 12, fontWeight: 'normal', color: '#166534' }}>({totalCycleMgLeft.toFixed(1)}mg total)</Text>
          </Text>
        </View>
      </View>

      {/* QUICK LOG BUTTON (ACTIVE VIAL ONLY) */}
      {isActive && (
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <TouchableOpacity 
            style={[styles.primaryButton, { flex: 2, marginTop: 0, paddingVertical: 12, backgroundColor: vial.color || '#3b82f6' }]} 
            onPress={() => logInjection(vial.id, phaseInfo.doseAmount, phaseInfo.doseUnit, currentDoseMcg)}
          >
            <Text style={styles.buttonText}>💉 Log Today's Dose ({phaseInfo.doseAmount}{phaseInfo.doseUnit})</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.primaryButton, { flex: 1, marginTop: 0, paddingVertical: 12, backgroundColor: '#4b5563' }]} 
            onPress={() => onLogPast(vial)}
          >
            <Text style={styles.actionButtonText}>📅 Log Past</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* LOGS HISTORY */}
      {rawLogs.length > 0 && (
        <View style={styles.logContainer}>
          <Text style={styles.logHeader}>History:</Text>
          {logsToShow.map((log: any) => {
            let cleanDate = typeof log.date === 'string' ? log.date.split(' - ')[0] : 'Invalid Date';
            return (
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
          {rawLogs.length > 1 && (
            <TouchableOpacity style={styles.expandButton} onPress={() => onToggleExpand(vial.id)}>
              <Text style={styles.expandButtonText}>{isExpanded ? "Show Less" : `View ${rawLogs.length - 1} More`}</Text>
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
    </View>
  );
}