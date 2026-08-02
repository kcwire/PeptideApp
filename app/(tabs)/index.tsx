import React, { useContext, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VialContext } from '../../context/VialContext';
import { getStyles } from '../../theme';
import { getProtocolPhaseForDate } from '../../utils/protocolMath';
import ProtocolProgressBanner from '../../components/ProtocolProgressBanner';

export default function ScheduleScreen() {
  const theme = useColorScheme() ?? 'light';
  const styles = getStyles(theme);

  const { vials, logInjection } = useContext(VialContext);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0); 

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const activeWeekDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeWeekStart = new Date(today);
    activeWeekStart.setDate(today.getDate() - today.getDay() + (weekOffset * 7));

    for (let i = 0; i < 7; i++) {
      const d = new Date(activeWeekStart);
      d.setDate(activeWeekStart.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [weekOffset]);

  const handleJumpToToday = () => {
    setWeekOffset(0);
    setSelectedDate(new Date());
  };

  const currentDayName = days[selectedDate.getDay()];
  const isWeekday = selectedDate.getDay() >= 1 && selectedDate.getDay() <= 5;
  const selectedDateString = `${currentDayName}, ${months[selectedDate.getMonth()]} ${selectedDate.getDate()}`;

  const realTodayMidnight = new Date();
  realTodayMidnight.setHours(0, 0, 0, 0);
  const selectedMidnight = new Date(selectedDate);
  selectedMidnight.setHours(0, 0, 0, 0);
  
  const isFutureDate = selectedMidnight > realTodayMidnight;
  const isSelectedToday = selectedMidnight.getTime() === realTodayMidnight.getTime();

  // DYNAMIC TITRATION SCHEDULE FILTER
  const scheduledVials = useMemo(() => {
    return vials.filter(vial => {
      if (vial.isArchived) return false;

      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      const protocolStart = vial.startDate || vial.dateReconstituted; 
    
      if (selectedDateStr < protocolStart) {
        return false; 
      }
      
      const hasLogged = vial.logs?.some((log: any) => typeof log.date === 'string' && log.date.split(' - ')[0] === selectedDateString);
      if (hasLogged) return true;

      // Compute active titration phase info for the selected calendar date
      const phaseInfo = getProtocolPhaseForDate(vial, selectedDate);
      const freq = phaseInfo.frequency || 'Daily';
      const customDays = phaseInfo.selectedDays || [];

      if (freq === 'Daily') return true;
      if (freq === 'Mon-Fri' && isWeekday) return true;
      if ((freq === 'Specific Days' || freq === 'Bi-Weekly') && customDays.includes(currentDayName)) return true;
      
      return false;
    });
  }, [vials, currentDayName, isWeekday, selectedDateString, selectedDate]);

  const amVials = scheduledVials.filter(v => v.timeOfDay === 'AM');
  const pmVials = scheduledVials.filter(v => v.timeOfDay === 'PM');
  const anyVials = scheduledVials.filter(v => !v.timeOfDay || v.timeOfDay === 'Any');

  // Filter active protocol vials to render progress cards
  const protocolVialsForDate = useMemo(() => {
    return scheduledVials.filter(v => Array.isArray(v.protocolPhases) && v.protocolPhases.length > 0);
  }, [scheduledVials]);

  const handleQuickLog = (vial: any, subject: any = null) => {
    const phaseInfo = getProtocolPhaseForDate(vial, selectedDate);
    const rawDoseAmount = subject ? subject.doseAmount : phaseInfo.doseAmount;
    const unit = subject ? subject.doseUnit : phaseInfo.doseUnit;
    const mcg = subject ? subject.doseMcg : phaseInfo.doseMcg;
    const dateToLog = isSelectedToday ? null : selectedDate.toISOString();
    const whoText = subject ? ` for ${subject.name}` : '';
    
    Alert.alert("Log Injection", `Log ${rawDoseAmount}${unit} of ${vial.vialName || vial.name}${whoText} for ${selectedDateString}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Log It", onPress: () => logInjection(vial.id, rawDoseAmount, unit, mcg, dateToLog, subject ? subject.id : null, subject ? subject.name : null) }
    ]);
  };

  const renderVialRow = (vial: any, borderStyle: any) => {
    const activePeptides = vial.peptides && vial.peptides.length > 0 ? vial.peptides : [{ name: vial.name, mg: vial.vialMg }];
    const primaryPeptide = activePeptides[0];
    const concentrationMgPerMl = primaryPeptide.mg / vial.bacWaterMl;

    const hasLoggedOnSelectedDate = vial.logs?.some((log: any) => typeof log.date === 'string' && log.date.split(' - ')[0] === selectedDateString);

    if (vial.subjects && vial.subjects.length > 0) {
      // MULTI-SUBJECT RENDER
      const hasAnyLogged = vial.logs?.some((log: any) => typeof log.date === 'string' && log.date.split(' - ')[0] === selectedDateString);

      return (
        <View key={vial.id} style={[
          styles.dashCard, 
          { borderLeftColor: hasAnyLogged ? styles.dashCardDone.borderLeftColor : (vial.color || '#3b82f6') },
          hasAnyLogged && styles.dashCardDone
        ]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.dashVialName, hasAnyLogged && styles.dashTextDone]}>{vial.vialName || vial.name}</Text>
            {vial.subjects.map((s: any) => {
              const volumeMl = (s.doseMcg / 1000) / concentrationMgPerMl;
              const units = (volumeMl * 100).toFixed(1);
              const hasSubjectLogged = vial.logs?.some((log: any) => typeof log.date === 'string' && log.date.split(' - ')[0] === selectedDateString && log.subjectId === s.id);
              return (
                <View key={s.id} style={{ marginBottom: 6 }}>
                  <Text style={[styles.dashDose, hasSubjectLogged && styles.dashTextDone]}>{s.name}: {s.doseAmount}{s.doseUnit} ({primaryPeptide.name})</Text>
                  <Text style={[styles.dashUnits, hasSubjectLogged && styles.dashTextDone]}>Pull: {units} Units</Text>
                </View>
              );
            })}
          </View>
          
          <View style={{ justifyContent: 'center', gap: 5 }}>
            {vial.subjects.map((s: any) => {
              const hasSubjectLogged = vial.logs?.some((log: any) => typeof log.date === 'string' && log.date.split(' - ')[0] === selectedDateString && log.subjectId === s.id);
              if (hasSubjectLogged) {
                return <View key={s.id} style={styles.dashLogBtnDone}><Text style={styles.dashLogTextDone}>✓ {s.name}</Text></View>;
              } else if (isFutureDate) {
                return <View key={s.id} style={styles.dashUpcomingBadge}><Text style={styles.dashUpcomingText}>Upcoming</Text></View>;
              } else {
                return (
                  <TouchableOpacity key={s.id} style={styles.dashLogBtn} onPress={() => handleQuickLog(vial, s)}>
                    <Text style={styles.dashLogText}>✓ {s.name}</Text>
                  </TouchableOpacity>
                );
              }
            })}
          </View>
        </View>
      );
    }

    // SINGLE SUBJECT RENDER WITH DYNAMIC TITRATION DOSE
    const phaseInfo = getProtocolPhaseForDate(vial, selectedDate);
    const rawDoseAmount = phaseInfo.doseAmount;
    const unit = phaseInfo.doseUnit;
    const volumeMl = (phaseInfo.doseMcg / 1000) / concentrationMgPerMl;
    const units = (volumeMl * 100).toFixed(1);

    return (
      <View key={vial.id} style={[
        styles.dashCard, 
        { borderLeftColor: hasLoggedOnSelectedDate ? styles.dashCardDone.borderLeftColor : (vial.color || '#3b82f6') },
        hasLoggedOnSelectedDate && styles.dashCardDone
      ]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.dashVialName, hasLoggedOnSelectedDate && styles.dashTextDone]}>
            {vial.vialName || vial.name}
            {phaseInfo.phaseName ? <Text style={{ fontSize: 12, fontWeight: 'normal', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}> ({phaseInfo.phaseName})</Text> : null}
          </Text>
          <Text style={[styles.dashDose, hasLoggedOnSelectedDate && styles.dashTextDone]}>{rawDoseAmount}{unit} ({primaryPeptide.name})</Text>
          <Text style={[styles.dashUnits, hasLoggedOnSelectedDate && styles.dashTextDone]}>Pull: {units} Units</Text>
        </View>
        
        {hasLoggedOnSelectedDate ? (
          <View style={styles.dashLogBtnDone}><Text style={styles.dashLogTextDone}>✓ Done</Text></View>
        ) : isFutureDate ? (
          <View style={styles.dashUpcomingBadge}><Text style={styles.dashUpcomingText}>Upcoming</Text></View>
        ) : (
          <TouchableOpacity style={styles.dashLogBtn} onPress={() => handleQuickLog(vial)}>
            <Text style={styles.dashLogText}>✓ Log</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const getIndicatorDots = (dateObj: Date) => {
    const dayName = days[dateObj.getDay()];
    const isWkdy = dateObj.getDay() >= 1 && dateObj.getDay() <= 5;
    const dateFormatted = `${dayName}, ${months[dateObj.getMonth()]} ${dateObj.getDate()}`;
    const isPast = dateObj.setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
    const dateStr = dateObj.toISOString().split('T')[0];

    let scheduledCount = 0;
    let loggedCount = 0;

    vials.forEach((vial: any) => {
      if (vial.isArchived) return;
      
      const protocolStart = vial.startDate || vial.dateReconstituted;
      if (dateStr < protocolStart) return;

      const phaseInfo = getProtocolPhaseForDate(vial, dateObj);
      const freq = phaseInfo.frequency || 'Daily';
      const customDays = phaseInfo.selectedDays || [];
      
      let isScheduled = false;
      if (freq === 'Daily') isScheduled = true;
      if (freq === 'Mon-Fri' && isWkdy) isScheduled = true;
      if ((freq === 'Specific Days' || freq === 'Bi-Weekly') && customDays.includes(dayName)) isScheduled = true;
      
      const hasLogged = vial.logs?.some((log: any) => typeof log.date === 'string' && log.date.split(' - ')[0] === dateFormatted);
      if (hasLogged) loggedCount++;

      if (isScheduled || hasLogged) scheduledCount++;
    });

    const dots = [];
    for (let i = 0; i < loggedCount; i++) dots.push(<View key={`g${i}`} style={[styles.dot, styles.dotGreen]} />);
    
    const remaining = Math.max(0, scheduledCount - loggedCount);
    for (let i = 0; i < remaining; i++) {
      if (isPast) dots.push(<View key={`r${i}`} style={[styles.dot, styles.dotRed]} />);
      else dots.push(<View key={`gry${i}`} style={[styles.dot, styles.dotGray]} />);
    }

    return dots;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Calendar Header */}
      <View style={{ paddingTop: 10 }}>
        <View style={styles.calHeaderRow}>
          <TouchableOpacity style={styles.calArrowBtn} onPress={() => setWeekOffset(w => w - 1)}><Text style={styles.calArrowText}>{"<"}</Text></TouchableOpacity>
          <Text style={styles.calMonthText}>{fullMonths[activeWeekDates[0].getMonth()]} {activeWeekDates[0].getFullYear()}</Text>
          <TouchableOpacity style={styles.calArrowBtn} onPress={() => setWeekOffset(w => w + 1)}><Text style={styles.calArrowText}>{">"}</Text></TouchableOpacity>
        </View>
        {(weekOffset !== 0 || !isSelectedToday) && (
          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <TouchableOpacity style={styles.jumpTodayBtn} onPress={handleJumpToToday}><Text style={styles.jumpTodayText}>Jump to Today</Text></TouchableOpacity>
          </View>
        )}
      </View>

      {/* 7-Day Week Strip */}
      <View style={styles.weekRow}>
        {activeWeekDates.map((date, index) => {
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const isActualToday = date.toDateString() === new Date().toDateString();
          return (
            <TouchableOpacity key={index} style={[styles.dayBlock, isSelected && styles.dayBlockSelected, isActualToday && !isSelected && styles.dayBlockToday]} onPress={() => setSelectedDate(date)}>
              <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{days[date.getDay()]}</Text>
              <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>{date.getDate()}</Text>
              <View style={styles.dotRow}>{getIndicatorDots(date)}</View>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.dashHeader}>{isSelectedToday ? "Today's Schedule" : selectedDateString}</Text>
        <Text style={styles.dashSub}>{isFutureDate ? "Upcoming Injections" : isSelectedToday ? "Don't forget to log!" : "Past Injections"}</Text>

        {/* PER-PROTOCOL PROGRESS BANNERS */}
        {protocolVialsForDate.map((vial: any) => (
          <ProtocolProgressBanner key={vial.id} vial={vial} targetDate={selectedDate} />
        ))}

        {scheduledVials.length === 0 ? <Text style={styles.emptyText}>No injections scheduled for this date. 🎉</Text> : (
          <>
            {amVials.length > 0 && <View style={styles.timeSection}><Text style={styles.timeHeader}>🌅 Morning (AM)</Text>{amVials.map(v => renderVialRow(v, styles.dashCardAM))}</View>}
            {pmVials.length > 0 && <View style={styles.timeSection}><Text style={styles.timeHeader}>🌙 Evening (PM)</Text>{pmVials.map(v => renderVialRow(v, styles.dashCardPM))}</View>}
            {anyVials.length > 0 && <View style={styles.timeSection}><Text style={styles.timeHeader}>⏱️ Anytime</Text>{anyVials.map(v => renderVialRow(v, styles.dashCardAny))}</View>}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}