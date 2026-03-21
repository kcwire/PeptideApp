import { StyleSheet } from 'react-native';

// The Master Color Palette
export const colors = {
  light: {
    bg: '#ffffff',
    card: '#ffffff',
    cardDone: '#f9fafb',
    textMain: '#1f2937',
    textSub: '#6b7280',
    textMuted: '#9ca3af',
    border: '#e5e7eb',
    borderStrong: '#d1d5db',
    inputBg: '#ffffff',
    primary: '#2563eb',
    primaryBg: '#eff6ff',
    primaryBtnText: '#ffffff',
    successText: '#065f46',
    successBg: '#d1fae5',
    dangerText: '#ef4444',
    dangerBg: '#fee2e2',
    warningBg: '#fef3c7',
    warningBorder: '#fde68a',
    warningTextMain: '#92400e',
    warningTextSub: '#b45309',
    mixBg: '#e0f2fe',
    mixBorder: '#bae6fd',
    mixLabel: '#0369a1',
    mixValue: '#0c4a6e',
    statBg: '#f3f4f6',
    resultBg: '#f0fdf4',
    resultBorder: '#bbf7d0',
    resultLabel: '#166534',
    resultValue: '#15803d',
    dayPickerActive: '#2563eb',
    dayPickerInactive: '#f3f4f6',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    bg: '#111827',          // Deep gray/black
    card: '#1f2937',        // Elevated dark gray
    cardDone: '#111827',    // Sinks into background
    textMain: '#f9fafb',    // Off-white
    textSub: '#d1d5db',     // bright light-gray
    textMuted: '#9ca3af',   // solid mid-gray
    border: '#374151',      // Subtle dark border
    borderStrong: '#4b5563',
    inputBg: '#374151',
    primary: '#3b82f6',
    primaryBg: '#1e3a8a',
    primaryBtnText: '#ffffff',
    successText: '#6ee7b7', // Mint green
    successBg: '#064e3b',   // Deep emerald
    dangerText: '#f87171',
    dangerBg: '#7f1d1d',
    warningBg: '#78350f',   // Dark amber
    warningBorder: '#b45309',
    warningTextMain: '#fef3c7',
    warningTextSub: '#fde68a',
    mixBg: '#0c4a6e',       // Deep sky
    mixBorder: '#075985',
    mixLabel: '#7dd3fc',
    mixValue: '#e0f2fe',
    statBg: '#374151',
    resultBg: '#064e3b',
    resultBorder: '#047857',
    resultLabel: '#6ee7b7',
    resultValue: '#a7f3d0',
    dayPickerActive: '#3b82f6',
    dayPickerInactive: '#374151',
    modalOverlay: 'rgba(0, 0, 0, 0.8)',
  }
};

// Premium Vial Colors (Look great in both Light and Dark mode)
export const vialColors = [
  '#ef4444', // Rose Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#0ea5e9', // Sky Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#64748b'  // Slate
];

// The Dynamic Style Generator
export const getStyles = (theme) => {
  const c = colors[theme]; // Grabs the correct palette based on the phone's setting

  return StyleSheet.create({
    // Base Layout
    container: { flex: 1, backgroundColor: c.bg },
    scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100 },
    sectionTitle: { fontSize: 22, fontWeight: 'bold', color: c.textMain, marginBottom: 15 },
    emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16, color: c.textSub, fontStyle: 'italic' },
    
    // Cards
    card: { backgroundColor: c.card, padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme === 'dark' ? 0.3 : 0.05, shadowRadius: 4, elevation: 3, marginBottom: 20, borderWidth: theme === 'dark' ? 1 : 0, borderColor: c.border },
    vialCard: { backgroundColor: c.card, padding: 15, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme === 'dark' ? 0.3 : 0.05, shadowRadius: 4, elevation: 3, borderWidth: theme === 'dark' ? 1 : 0, borderColor: c.border },
    archivedCard: { opacity: 0.6 },
    vialHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: 10 },
    vialName: { fontSize: 18, fontWeight: 'bold', color: c.textMain },
    vialSub: { fontSize: 13, color: c.textSub, marginTop: 2 },
    reconstitutedText: { fontSize: 12, color: c.textMuted, marginTop: 4, fontStyle: 'italic' },
    editLink: { color: c.primary, fontWeight: 'bold', fontSize: 14 },
    
    // Inputs & Forms
    label: { fontSize: 14, fontWeight: 'bold', color: c.textMain, marginBottom: 8, marginTop: 10 },
    input: { backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.border, borderRadius: 8, padding: 12, fontSize: 16, color: c.textMain, marginBottom: 15 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    primaryButton: { backgroundColor: c.primary, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    buttonText: { color: c.primaryBtnText, fontWeight: 'bold', fontSize: 16 },
    
    // Toggles
    unitToggleRow: { flexDirection: 'row', backgroundColor: c.inputBg, borderRadius: 8, borderWidth: 1, borderColor: c.border, overflow: 'hidden', marginBottom: 15, marginTop: 5 },
    unitButton: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    unitButtonActive: { backgroundColor: c.primary },
    unitButtonText: { color: c.textSub, fontWeight: 'bold' },
    unitButtonTextActive: { color: c.primaryBtnText },

    // Day Picker
    dayPickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, marginBottom: 15 },
    dayPickerCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.dayPickerInactive, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
    dayPickerCircleActive: { backgroundColor: c.dayPickerActive, borderColor: c.primary },
    dayPickerText: { fontSize: 13, color: c.textSub, fontWeight: 'bold' },
    dayPickerTextActive: { color: c.primaryBtnText },

    // Color Picker
    colorPickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, marginBottom: 15 },
    colorSwatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: 'transparent' },
    colorSwatchSelected: { borderColor: c.textMain, transform: [{ scale: 1.1 }] },

    // Blends
    blendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    removeBtn: { paddingHorizontal: 10, paddingVertical: 12, backgroundColor: c.dangerBg, borderRadius: 8, justifyContent: 'center' },
    addBlendBtn: { padding: 10, backgroundColor: c.inputBg, borderRadius: 8, alignItems: 'center', marginBottom: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: c.borderStrong },
    addBlendText: { color: c.textSub, fontWeight: '600', fontSize: 13 },
    yieldBox: { backgroundColor: c.warningBg, padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: c.warningBorder, alignItems: 'center' },
    yieldTitle: { fontSize: 12, fontWeight: 'bold', color: c.warningTextMain, marginBottom: 4, textTransform: 'uppercase' },
    yieldText: { fontSize: 14, color: c.warningTextSub, fontWeight: '600' },
    
    // Stats & Math Boxes
    mixDetailsBox: { backgroundColor: c.mixBg, paddingVertical: 12, borderRadius: 6, marginBottom: 12, flexDirection: 'row', width: '100%' },
    mixItem: { width: '50%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    mixLabel: { fontSize: 11, color: c.mixLabel, marginBottom: 2, textAlign: 'center', flexShrink: 1 },
    mixValue: { fontSize: 15, fontWeight: 'bold', color: c.mixValue, textAlign: 'center', flexShrink: 1 },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    statBox: { backgroundColor: c.statBg, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 8, width: '48%', alignItems: 'center', justifyContent: 'center', minHeight: 85 },
    statLabel: { fontSize: 11, color: c.textSub, marginBottom: 2, textAlign: 'center' },
    statValue: { fontSize: 16, fontWeight: '700', color: c.textMain, textAlign: 'center' },
    statLabelSub: { fontSize: 11, color: c.textMuted, marginTop: 4, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
    emptyAlert: { color: c.dangerText },
    resultBox: { backgroundColor: c.resultBg, borderColor: c.resultBorder, borderWidth: 1, paddingVertical: 16, paddingHorizontal: 15, borderRadius: 8, alignItems: 'center', marginBottom: 12, minHeight: 100 },
    resultLabel: { fontSize: 13, color: c.resultLabel, marginBottom: 2, textAlign: 'center' },
    resultValue: { fontSize: 22, fontWeight: 'bold', color: c.resultValue, textAlign: 'center' },
    resultSub: { fontSize: 12, color: c.resultLabel, marginTop: 4, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
    
    // Action Buttons
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 5 },
    actionButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    logNowButton: { backgroundColor: c.successBg },
    logPastButton: { backgroundColor: c.statBg, borderWidth: 1, borderColor: c.border },
    actionButtonText: { fontWeight: 'bold', fontSize: 14, color: c.textMain },
    
    // Logs
    logContainer: { marginTop: 15, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 15 },
    logHeader: { fontSize: 14, fontWeight: 'bold', color: c.textMain, marginBottom: 10 },
    logEntryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border },
    logTextContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
    doseBadge: { backgroundColor: c.primaryBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
    doseBadgeText: { color: c.primary, fontWeight: 'bold', fontSize: 11 },
    logDate: { fontSize: 13, color: c.textSub, flexShrink: 1 },
    deleteLogText: { color: c.dangerText, fontSize: 18, fontWeight: 'bold', paddingHorizontal: 10 },
    expandButton: { alignItems: 'center', marginTop: 10, paddingVertical: 8, backgroundColor: c.statBg, borderRadius: 6 },
    expandButtonText: { color: c.textSub, fontSize: 13, fontWeight: 'bold' },
    
    // Footer Actions
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: c.border },
    archiveText: { color: c.primary, fontWeight: 'bold' },
    deleteText: { color: c.dangerText, fontWeight: 'bold' },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: c.modalOverlay, justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: c.card, width: '90%', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
    modalActionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 25, gap: 15 },
    modalCancel: { paddingVertical: 10, paddingHorizontal: 15 },
    modalSave: { backgroundColor: c.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },

    // Dashboard & Calendar
    dashHeader: { fontSize: 28, fontWeight: 'bold', color: c.textMain, marginBottom: 5 },
    dashSub: { fontSize: 16, color: c.textSub, marginBottom: 20 },
    timeSection: { marginTop: 15, marginBottom: 10 },
    timeHeader: { fontSize: 18, fontWeight: 'bold', color: c.textMain, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: 5 },
    
    dashCard: { backgroundColor: c.card, padding: 15, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: theme === 'dark' ? 0.3 : 0.1, shadowRadius: 2, elevation: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dashCardAM: { borderLeftColor: '#f59e0b' }, 
    dashCardPM: { borderLeftColor: c.primary }, 
    dashCardAny: { borderLeftColor: c.successText }, 
    dashVialName: { fontSize: 16, fontWeight: 'bold', color: c.textMain },
    dashDose: { fontSize: 14, color: c.textSub, marginTop: 2 },
    dashUnits: { fontSize: 13, color: c.successText, fontWeight: '600', marginTop: 2 },
    dashLogBtn: { backgroundColor: c.successBg, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8 },
    dashLogText: { color: c.successText, fontWeight: 'bold', fontSize: 14 },
    
    dashCardDone: { backgroundColor: c.cardDone, borderLeftColor: c.border, shadowOpacity: 0, elevation: 0 },
    dashTextDone: { color: c.textMuted },
    dashLogBtnDone: { backgroundColor: c.statBg, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8 },
    dashLogTextDone: { color: c.textMuted, fontWeight: 'bold', fontSize: 14 },
    dashUpcomingBadge: { backgroundColor: c.statBg, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, borderWidth: 1, borderColor: c.border },
    dashUpcomingText: { color: c.textSub, fontWeight: 'bold', fontSize: 14 },

    calHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingBottom: 10, backgroundColor: c.bg },
    calMonthText: { fontSize: 16, fontWeight: 'bold', color: c.textMain },
    calArrowBtn: { paddingHorizontal: 15, paddingVertical: 5, backgroundColor: c.statBg, borderRadius: 8 },
    calArrowText: { fontSize: 16, color: c.textSub, fontWeight: 'bold' },
    jumpTodayBtn: { backgroundColor: c.primaryBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    jumpTodayText: { color: c.primary, fontWeight: 'bold', fontSize: 12 },

    weekRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, backgroundColor: c.bg, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: c.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme === 'dark' ? 0.3 : 0.05, shadowRadius: 3 },
    dayBlock: { flex: 1, height: 75, alignItems: 'center', justifyContent: 'center', borderRadius: 10, marginHorizontal: 4, backgroundColor: c.statBg, borderWidth: 1, borderColor: c.border },
    dayBlockSelected: { backgroundColor: c.primary, borderColor: c.primary, shadowColor: c.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
    dayBlockToday: { borderColor: c.primary, borderWidth: 2 },
    dayText: { fontSize: 11, color: c.textSub, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
    dayTextSelected: { color: c.primaryBtnText },
    dateText: { fontSize: 18, fontWeight: 'bold', color: c.textMain },
    dateTextSelected: { color: c.primaryBtnText },
    
    dotRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 4, gap: 2, paddingHorizontal: 2 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    dotGreen: { backgroundColor: c.successText },
    dotRed: { backgroundColor: c.dangerText },
    dotGray: { backgroundColor: c.textMuted }
  });
};