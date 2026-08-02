# PeptideApp Protocol Planner & Inventory Redesign - Master Execution Plan (`PLAN.md`)

This document outlines the architectural roadmap, design decisions, and modular task breakdown for implementing **Peptide Protocols, Per-Protocol Progress Tracking, Inventory Architecture Redesign, and Protocol Template Sharing** in PeptideApp.

---

## Confirmed User Specifications & Directives

1. **Vials Tab Architecture (Inventory Focus)**: Re-architect `app/(tabs)/vials.tsx` to serve as the **Physical Inventory & Stock Manager** (unopened vial inventory, reconstituted bottle stock, and stock adjustments), decoupling active protocol schedule tracking to the **Dashboard** and **Planner** tabs.
2. **Per-Protocol Progress Tracking**: Progress tracking (`Week X of Y (Z% Complete) • Phase N`) and escalation alert banners must be calculated **per active protocol instance**.
3. **45-Day Shelf-Life Warning Threshold**: Reconstituted vial shelf-life expiration warning threshold set to **$> 45$ days**.
4. **Smart Inventory Deduction**: When activating a protocol, check existing unopened inventory stock of matching mg and prompt the user to subtract available stock before adding new required inventory.
5. **Protocol Duplication & Sharing**: Support cloning protocol templates and exporting/importing single protocol JSON files.

---

## Task Board & Execution Plan

### Phase 1: Completed Core Engine & Protocol Planner
- [x] **TASK-101**: Core Types & Pure Calculation Engine (`types/protocol.ts`, `utils/protocolMath.ts`)
- [x] **TASK-102**: Protocol State Provider & Active Vial Integration (`context/ProtocolContext.tsx`, `app/_layout.tsx`)
- [x] **TASK-103**: Titration Builder & Supply Summary Components (`components/TitrationPhaseBuilder.tsx`, `components/ProtocolSupplySummary.tsx`)
- [x] **TASK-104**: Router Screen & Navigation (`app/(tabs)/protocol.tsx`, `app/(tabs)/_layout.tsx`)
- [x] **TASK-105**: Multi-Day Persistence & Dynamic Date Titration Engine (`utils/protocolMath.ts`, `app/(tabs)/index.tsx`)
- [x] **TASK-106**: Full V2 Database Backup & Restore Engine (`app/(tabs)/settings.tsx`, `context/ProtocolContext.tsx`)

### Phase 2: Feature Enhancements & Inventory Redesign (In Progress)
- [ ] **TASK-201**: Update Shelf-Life Expiration Threshold to 45 Days (`utils/protocolMath.ts`)
- [ ] **TASK-202**: Protocol Duplication & Single-Protocol Sharing / Import (`context/ProtocolContext.tsx`, `app/(tabs)/protocol.tsx`)
- [ ] **TASK-203**: Smart Inventory Deduction Prompt on Protocol Activation (`context/ProtocolContext.tsx`)
- [ ] **TASK-204**: Per-Protocol Progress Cards & Escalation Banners (`components/ProtocolProgressBanner.tsx`, `app/(tabs)/index.tsx`)
- [ ] **TASK-205**: Vials Tab Architecture Redesign as Physical Inventory Manager (`app/(tabs)/vials.tsx`)
- [ ] **TASK-206**: End-to-End Verification & Automated Test Suite Execution
