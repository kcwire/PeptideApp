import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // Base Layout
  container: { flex: 1, backgroundColor: '#fff' }, // Changed to white for a seamless status bar
  scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100 }, // Tightened the padding
  
  // Cards & Layout (Reduced Padding)
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  vialCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderLeftWidth: 5, borderLeftColor: '#3b82f6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  archivedCard: { backgroundColor: '#f9fafb', borderLeftColor: '#9ca3af', opacity: 0.9 },
  
  // Typography (Tighter Margins)
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#1f2937' },
  vialName: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  vialSub: { fontSize: 14, fontWeight: 'normal', color: '#6b7280' },
  reconstitutedText: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 40, fontSize: 16, fontStyle: 'italic' },
  editLink: { color: '#2563eb', fontWeight: '600', fontSize: 14, padding: 5 },
  
  // Forms & Inputs
  label: { fontSize: 13, fontWeight: '500', color: '#4b5563', marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, backgroundColor: '#f9fafb', fontSize: 15, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  
  // Mixing Details Box (Hardcoded 50% columns, foolproof sizing)
  mixDetailsBox: { backgroundColor: '#e0f2fe', paddingVertical: 12, borderRadius: 6, marginBottom: 12, flexDirection: 'row', width: '100%' },
  mixItem: { width: '50%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  mixLabel: { fontSize: 11, color: '#0369a1', marginBottom: 2, textAlign: 'center', flexShrink: 1 },
  mixValue: { fontSize: 15, fontWeight: 'bold', color: '#0c4a6e', textAlign: 'center', flexShrink: 1 },

  // Stats Grid (Increased paddingVertical to 12)
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statBox: { backgroundColor: '#f3f4f6', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, width: '48%', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 11, color: '#6b7280', marginBottom: 2, textAlign: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#1f2937', textAlign: 'center' },
  statLabelSub: { fontSize: 11, color: '#9ca3af', marginTop: 4, textAlign: 'center' },
  emptyAlert: { color: '#ef4444' },
  
  // Syringe Result Box (Increased paddingVertical to 14)
  resultBox: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1, paddingVertical: 14, paddingHorizontal: 15, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  resultLabel: { fontSize: 13, color: '#166534', marginBottom: 2, textAlign: 'center' },
  resultValue: { fontSize: 22, fontWeight: 'bold', color: '#15803d', textAlign: 'center' },
  resultSub: { fontSize: 12, color: '#166534', marginTop: 4, textAlign: 'center' },
  
  // Buttons (Slightly shorter)
  primaryButton: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  logNowButton: { backgroundColor: '#10b981' },
  amberButton: { backgroundColor: '#f59e0b' },
  logPastButton: { backgroundColor: '#6b7280' },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  
  // Logs & History (Tighter padding)
  logContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  logHeader: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  logEntryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, backgroundColor: '#f9fafb', padding: 6, borderRadius: 6 },
  logTextContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  doseBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
  doseBadgeText: { color: '#1e40af', fontWeight: 'bold', fontSize: 11 },
  logDate: { fontSize: 13, color: '#4b5563', flexShrink: 1 },
  deleteLogText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold', paddingHorizontal: 10 },
  
  // Expand Button
  expandButton: { paddingVertical: 6, alignItems: 'center', marginTop: 2 },
  expandButtonText: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  
  // Footer Links (Tighter)
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  archiveText: { color: '#4b5563', fontSize: 13, fontWeight: '600' },
  deleteText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  modalCancel: { padding: 12, flex: 1, alignItems: 'center' },
  modalSave: { backgroundColor: '#2563eb', padding: 12, flex: 1, borderRadius: 8, alignItems: 'center' },

  // Toggles
  unitToggleRow: { flexDirection: 'row', marginTop: 5, marginBottom: 12, backgroundColor: '#f3f4f6', borderRadius: 8, padding: 4 },
  unitButton: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
  unitButtonActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  unitButtonText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  unitButtonTextActive: { color: '#2563eb' }, 

  // Blends & Dynamic Rows
  blendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  removeBtn: { paddingHorizontal: 10, paddingVertical: 12, backgroundColor: '#fee2e2', borderRadius: 8, justifyContent: 'center' },
  addBlendBtn: { padding: 10, backgroundColor: '#f3f4f6', borderRadius: 8, alignItems: 'center', marginBottom: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#d1d5db' },
  addBlendText: { color: '#4b5563', fontWeight: '600', fontSize: 13 },
  
  // Blend Yield Box (Yellow)
  yieldBox: { backgroundColor: '#fef3c7', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#fde68a', alignItems: 'center' },
  yieldTitle: { fontSize: 12, fontWeight: 'bold', color: '#92400e', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  yieldText: { fontSize: 14, color: '#b45309', fontWeight: '600' },

  // Dashboard Styles
  dashHeader: { fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 5 },
  dashSub: { fontSize: 16, color: '#6b7280', marginBottom: 20 },
  timeSection: { marginTop: 15, marginBottom: 10 },
  timeHeader: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 5 },
  dashCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dashCardAM: { borderLeftColor: '#f59e0b' }, // Amber for AM
  dashCardPM: { borderLeftColor: '#3b82f6' }, // Blue for PM
  dashCardAny: { borderLeftColor: '#10b981' }, // Green for Any
  dashVialName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  dashDose: { fontSize: 14, color: '#4b5563', marginTop: 2 },
  dashUnits: { fontSize: 13, color: '#15803d', fontWeight: '600', marginTop: 2 },
  dashLogBtn: { backgroundColor: '#10b981', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8 },
  dashLogText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // Dashboard 'Done' States (High Legibility)
  dashCardDone: { backgroundColor: '#f9fafb', borderLeftColor: '#e5e7eb', shadowOpacity: 0, elevation: 0 },
  dashTextDone: { color: '#6b7280'}, // Soft gray, readable, NO strikethrough
  dashLogBtnDone: { backgroundColor: '#d1fae5', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8 }, // Soft emerald background
  dashLogTextDone: { color: '#065f46', fontWeight: 'bold', fontSize: 14 }, // Dark emerald text

  // Horizontal Calendar Strip
  calendarContainer: { backgroundColor: '#fff', paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
  dayBlock: { width: 55, height: 70, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginHorizontal: 6, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  dayBlockSelected: { backgroundColor: '#2563eb', borderColor: '#1d4ed8', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  dayText: { fontSize: 12, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  dayTextSelected: { color: '#bfdbfe' },
  dateText: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  dateTextSelected: { color: '#fff' },
  
  // Future State Badge
  dashUpcomingBadge: { backgroundColor: '#f3f4f6', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  dashUpcomingText: { color: '#6b7280', fontWeight: 'bold', fontSize: 14 },

  // Calendar Paging Header
  calHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingBottom: 10, backgroundColor: '#fff' },
  calMonthText: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  calArrowBtn: { paddingHorizontal: 15, paddingVertical: 5, backgroundColor: '#f3f4f6', borderRadius: 8 },
  calArrowText: { fontSize: 16, color: '#4b5563', fontWeight: 'bold' },
  jumpTodayBtn: { backgroundColor: '#dbeafe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  jumpTodayText: { color: '#2563eb', fontWeight: 'bold', fontSize: 12 },

  // Updated Day Blocks
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, backgroundColor: '#fff', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
  dayBlock: { flex: 1, height: 75, alignItems: 'center', justifyContent: 'center', borderRadius: 10, marginHorizontal: 4, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb' },
  dayBlockSelected: { backgroundColor: '#2563eb', borderColor: '#1d4ed8', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  dayBlockToday: { borderColor: '#3b82f6', borderWidth: 2 }, // Highlights the current physical day
  dayText: { fontSize: 11, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  dayTextSelected: { color: '#bfdbfe' },
  dateText: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  dateTextSelected: { color: '#fff' },
  
  // Status Indicator Dots
  dotRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 4, gap: 2, paddingHorizontal: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotGreen: { backgroundColor: '#10b981' }, // Logged
  dotRed: { backgroundColor: '#ef4444' },   // Missed
  dotGray: { backgroundColor: '#d1d5db' },  // Upcoming
  
  // Future State Badge
  dashUpcomingBadge: { backgroundColor: '#f3f4f6', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  dashUpcomingText: { color: '#6b7280', fontWeight: 'bold', fontSize: 14 },

  // Day Picker Styles
  dayPickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, marginBottom: 15 },
  dayPickerCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  dayPickerCircleActive: { backgroundColor: '#2563eb', borderColor: '#1d4ed8' },
  dayPickerText: { fontSize: 13, color: '#6b7280', fontWeight: 'bold' },
  dayPickerTextActive: { color: '#fff' },
});