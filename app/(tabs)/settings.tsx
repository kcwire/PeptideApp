import React, { useContext, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
// NEW: Using the modern, synchronous Expo File API
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VialContext } from '../_context/VialContext';
import { colors, getStyles } from '../theme';

export default function SettingsScreen() {
  const { vials, restoreData } = useContext(VialContext);
  const theme = useColorScheme() ?? 'light';
  const styles = getStyles(theme);
  const c = colors[theme];
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = async () => {
    try {
      setIsProcessing(true);
      
      const jsonString = JSON.stringify(vials, null, 2);
      const dateStr = new Date().toISOString().split('T')[0];
      
      // MODERN EXPORT: Synchronous file creation and writing
      const backupFile = new File(Paths.cache, `PeptideTracker_Backup_${dateStr}.json`);
      if (!backupFile.exists) {
        backupFile.create();
      }
      backupFile.write(jsonString);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(backupFile.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Save Backup File'
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device.");
      }
    } catch (error) {
      Alert.alert("Export Failed", error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    try {
      setIsProcessing(true);
      
      // 1. ADDED THIS BACK: Google Drive virtual files MUST be copied to the local cache to be read
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain'],
        copyToCacheDirectory: true 
      });

      if (result.canceled) {
        setIsProcessing(false);
        return;
      }

      // 2. ADDED AWAIT: This acts as a bulletproof vest. If the system tries to hand us 
      // an async Promise object, 'await' forces it to unwrap the actual text inside.
      const selectedFile = new File(result.assets[0].uri);
      const fileContents = await selectedFile.text();

      const parsedData = JSON.parse(fileContents);
      
      if (!Array.isArray(parsedData)) {
        throw new Error("Invalid backup file format. Expected an array of vials.");
      }

      Alert.alert(
        "Restore Backup?",
        "This will completely erase your current app data and replace it with the backup. This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Restore Now", 
            style: "destructive",
            onPress: () => {
              restoreData(parsedData);
              Alert.alert("Success", "Your backup has been successfully restored!");
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert("Import Failed", "The selected file is not a valid backup. \n\n" + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.dashHeader}>Data & Settings</Text>
        <Text style={styles.dashSub}>Manage your local database.</Text>

        <View style={[styles.card, { marginTop: 10 }]}>
          <Text style={styles.sectionTitle}>Backup</Text>
          <Text style={[styles.label, { marginTop: 0, fontWeight: 'normal', color: c.textSub }]}>
            Export your entire database, including all active protocols, inactive vials, and injection history, to a secure JSON file.
          </Text>
          
          <TouchableOpacity 
            style={[styles.primaryButton, isProcessing && { opacity: 0.5 }]} 
            onPress={handleExport}
            disabled={isProcessing}
          >
            <Text style={styles.buttonText}>📤 Export Data</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Restore</Text>
          <Text style={[styles.label, { marginTop: 0, fontWeight: 'normal', color: c.textSub }]}>
            Load a previously saved backup file. Warning: This will overwrite any data currently sitting on this device.
          </Text>
          
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: c.statBg }, isProcessing && { opacity: 0.5 }]} 
            onPress={handleImport}
            disabled={isProcessing}
          >
            <Text style={[styles.buttonText, { color: c.textMain }]}>📥 Import Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}