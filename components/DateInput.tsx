import React, { useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getStyles } from '../theme';

interface DateInputProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
}

export default function DateInput({ label, value, onChange, placeholder }: DateInputProps) {
  const [showPicker, setShowPicker] = useState(false);
  const theme = useColorScheme() ?? 'light';
  const styles = getStyles(theme);

  const dateObj = value ? new Date(
    parseInt(value.split('-')[0]), 
    parseInt(value.split('-')[1]) - 1, 
    parseInt(value.split('-')[2])
  ) : new Date();

  const handleChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    }
  };

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowPicker(true)}>
        <Text style={[styles.datePickerText, !value && { color: '#9ca3af' }]}>
          {value || placeholder || 'Select Date'}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
}
