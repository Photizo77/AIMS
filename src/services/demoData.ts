// src/services/demoData.ts
// ============================================================
// AIMS — Demo dataset loader.
// The system is CLEAN by default (no dummy records). Calling
// loadDemoDataset() opts this browser into demo content so features
// can be reviewed: it sets the demo marker and reseeds every module
// store. "Flash / factory reset" removes it all again.
// ============================================================

import { setDemoMode } from '@/lib/storage';
import { loadDemoDocs } from './docService';
import { loadDemoCrm } from './crmService';
import { loadDemoInventory } from './inventoryService';
import { loadDemoAttendance } from './attendanceService';
import { loadDemoLeave } from './leaveService';
import { loadDemoOffboarding } from './offboardingService';
import { loadDemoContracts } from './contractService';
import { loadDemoGrants } from './grantService';
import { loadDemoProjects } from './innovationService';
import { loadDemoRequisitions } from './requisitionService';
import { loadDemoFinance } from './financeService';

/** Load the demo dataset into every persisted module store */
export function loadDemoDataset(): void {
  setDemoMode(true);
  loadDemoDocs();
  loadDemoCrm();
  loadDemoInventory();
  loadDemoAttendance();
  loadDemoLeave();
  loadDemoOffboarding();
  loadDemoContracts();
  loadDemoGrants();
  loadDemoProjects();
  loadDemoRequisitions();
  loadDemoFinance();
}
