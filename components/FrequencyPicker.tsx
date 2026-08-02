import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { getStyles, colors } from '../theme';

interface FrequencyPickerProps {
  frequency: string;
  selectedDays?: string[];
  onFrequencyChange: (freq: string) => void;
  onSelectedDaysChange?: (days: string[]) => void;
  options?: string[];
  label?: string;
}

const DEFAULT_OPTIONS = ['Daily', 'Mon-Fri', 'Specific Days'];
const ALL_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function FrequencyPicker({
  frequency,
  selectedDays = ['Mon', 'Thu'],
  onFrequencyChange,
  onSelectedDaysChange,
  options = DEFAULT_OPTIONS,
  label,
}: FrequencyPickerProps) {
  const theme = useColorScheme() ?? 'light';
  const styles = getStyles(theme);
  const c = colors[theme];

  const handleToggleDay = (day: string) => {
    if (!onSelectedDaysChange) return;
    if (selectedDays.includes(day)) {
      onSelectedDaysChange(selectedDays.filter(d => d !== day));
    } else {
      onSelectedDaysChange([...selectedDays, day]);
    }
  };

  return (
    <View style={{ marginVertical: 6 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {/* Frequency Options Pill Row */}
      <View style={styles.unitToggleRow}>
        {options.map(freq => {
          const isActive = frequency === freq;
          return (
            <TouchableOpacity
              key={freq}
              style={[styles.unitButton, isActive && styles.unitButtonActive]}
              onPress={() => onFrequencyChange(freq)}
            >
              <Text style={[styles.unitButtonText, isActive && styles.unitButtonTextActive]}>
                {freq}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Day Circles Row for 'Specific Days' */}
      {frequency === 'Specific Days' && (
        <View style={styles.dayPickerRow}>
          {ALL_DAYS.map(d => {
            const isSelected = selectedDays.includes(d);
            return (
              <TouchableOpacity
                key={d}
                style={[styles.dayPickerCircle, isSelected && styles.dayPickerCircleActive]}
                onPress={() => handleToggleDay(d)}
              >
                <Text style={[styles.dayPickerText, isSelected && styles.dayPickerTextActive]}>
                  {d.charAt(0)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
