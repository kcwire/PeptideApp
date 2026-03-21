import React, { useContext } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { VialContext } from '../_context/VialContext';
import { styles } from '../theme';

export default function VialCard({ vial, isActive, isExpanded, onToggleExpand, onEdit, onLogPast }) {
  const { toggleArchive, deleteVial, logInjection, deleteLog, startNextVial } = useContext(VialContext);

  const activePeptides = vial.peptides && vial.peptides.length > 0 ? vial.peptides : [{ name: vial.name, mg: vial.vialMg }];
  const vialTitle = vial.vialName || vial.name || "Unnamed Vial";
  const primaryPeptide = activePeptides[0];

  const rawDoseAmount = vial.doseAmount || vial.doseMcg;
  const unit = vial.doseUnit || 'mcg';
  const displayDose = `${rawDoseAmount} ${unit}`;

  // Current Vial Math
  const primaryConcMgPerMl = primaryPeptide.mg / vial.bacWaterMl;
  const currentDoseMg = vial.doseMcg / 1000;
  const volumeMl = currentDoseMg / primaryConcMgPerMl;
  
  const totalPrimaryMgUsed = vial.logs.reduce((sum, log) => sum + (log.doseMcg / 1000), 0);
  const primaryMgRemaining = Math.max(0, primaryPeptide.mg - totalPrimaryMgUsed);
  const remainingDosesCurrent = Math.floor(primaryMgRemaining / currentDoseMg);

  // CYCLE MATH (Current Vial + Inventory)
  const inventoryCount = vial.unopenedVials || 0;
  const completedCount = vial.completedVials || 0;
  const totalCycleMgLeft = primaryMgRemaining + (inventoryCount * primaryPeptide.mg);
  const totalCycleDosesLeft = Math.floor(totalCycleMgLeft / currentDoseMg);

  const logsToShow = isExpanded ? vial.logs.slice(0, 5) : vial.logs.slice(0, 1);

  const handleStartNext = () => {
    Alert.alert(
      "Start Next Vial", 
      "This will mark your current vial as empty, clear the injection history for this specific vial, and pull one from your inventory. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Start Next", onPress: () => {
            const today = new Date().toISOString().split('T')[0];
            startNextVial(vial.id, today);
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.vialCard, !isActive && styles.archivedCard]}>
      
      {/* Header */}
      <View style={styles.vialHeader}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.vialName}>{vialTitle}</Text>
          <Text style={styles.vialSub}>{activePeptides.map(p => `${p.name} (${p.mg}mg)`).join(' + ')}</Text>
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
          <Text style={styles.mixValue} numberOfLines={1} adjustsFontSizeToFit>{primaryConcMgPerMl.toFixed(2)} mg/ml</Text>
        </View>
      </View>

      {/* Stats Grid - Now shows Current vs Full Cycle */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Current Vial</Text>
          <Text style={[styles.statValue, isActive && remainingDosesCurrent <= 0 && styles.emptyAlert]}>{remainingDosesCurrent}</Text>
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
          <Text style={styles.resultLabel}>Syringe Measurement:</Text>
          <Text style={styles.resultValue}>{(volumeMl * 100).toFixed(1)} Units</Text>
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={styles.resultSub} numberOfLines={1} adjustsFontSizeToFit>({volumeMl.toFixed(3)} ml)</Text>
          </View>
        </View>
      )}

      {/* Action Row */}
      {isActive && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionButton, styles.logNowButton]} onPress={() => logInjection(vial.id, rawDoseAmount, unit, vial.doseMcg)}>
            <Text style={styles.actionButtonText}>✓ Log Now</Text>
          </TouchableOpacity>
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
            const cleanDate = log.date.split(' - ')[0];
            return (
              <View key={log.id} style={styles.logEntryRow}>
                <View style={styles.logTextContainer}>
                  <View style={styles.doseBadge}><Text style={styles.doseBadgeText}>{log.doseAmount || log.doseMcg}{log.doseUnit || 'mcg'}</Text></View>
                  <Text style={styles.logDate} numberOfLines={1} adjustsFontSizeToFit>{cleanDate}</Text>
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