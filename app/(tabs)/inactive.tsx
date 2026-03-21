import React, { useContext, useState } from 'react';
import { ScrollView, Text, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VialContext } from '../_context/VialContext';
import VialCard from '../components/VialCard';
import { getStyles } from '../theme';

export default function ArchiveScreen() {
  const theme = useColorScheme() ?? 'light';
  const styles = getStyles(theme);
  const { vials } = useContext(VialContext);
  const [expandedLogs, setExpandedLogs] = useState({});

  const toggleExpandLog = (vialId) => setExpandedLogs(prev => ({ ...prev, [vialId]: !prev[vialId] }));
  const archivedVialsList = vials.filter(v => v.isArchived);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {archivedVialsList.length === 0 ? <Text style={styles.emptyText}>No archived vials.</Text> : 
          archivedVialsList.map(vial => (
            <VialCard 
              key={vial.id}
              vial={vial}
              isActive={false} // Hides the syringe math and logging buttons automatically!
              isExpanded={expandedLogs[vial.id]}
              onToggleExpand={toggleExpandLog}
            />
          ))
        }
      </ScrollView>
    </SafeAreaView>
  );
}