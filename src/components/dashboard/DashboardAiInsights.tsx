// src/components/dashboard/DashboardAiInsights.tsx
// ============================================================
// AIMS — the compact "AI Insights" strip that follows the stat cards on
// every persona dashboard. It replaces the oversized insight panels so the
// order reads: stat cards first, then a quiet, actionable AI summary.
// ============================================================

import { AIPanel } from '@/components/ai/AIPanel';
import { useLiveData } from '@/lib/useLiveData';
import {
  cashFlowForecast, contractRenewalAdvice, funderMatches, pipelineTrendSummary,
  sentimentSummary, type AiInsight,
} from '@/lib/aiEngine';
import { grantService } from '@/services/grantService';
import { financeService } from '@/services/financeService';
import { innovationService, isExecutingProject } from '@/services/innovationService';
import { userOpsGet } from '@/services/userOpsService';
import { listPendingSubmissions } from '@/services/employeeService';
import { inventoryGet } from '@/services/inventoryService';
import { contractGet } from '@/services/contractService';
import { daysUntil } from '@/data/grants';

export type InsightScope = 'exec' | 'admin' | 'finance' | 'grants' | 'innovations' | 'hr' | 'inventory' | 'system';

const COMPACT_LIMIT = 3;

function buildInsights(scope: InsightScope): AiInsight[] {
  const out: AiInsight[] = [];
  const grants = grantService.getAllGrants();
  const openGrants = grants.filter((g) => !['awarded', 'declined'].includes(g.stage));
  const dueSoon = openGrants.filter((g) => daysUntil(g.deadline) <= 7);
  const projects = innovationService.getAllProjects().filter(isExecutingProject);
  const stalled = projects.filter((p) => p.daysInStage > 14);
  const forecast = cashFlowForecast();
  const pipeline = userOpsGet.onboardees();
  const openHires = pipeline.filter((o) => o.steps.some((s) => !s.done));
  const pendingForms = listPendingSubmissions();
  const budgets = financeService.getBudgets();
  const hotBudgets = budgets.filter((b) => b.budget > 0 && (b.actual / b.budget) * 100 >= 90);
  const renewals = contractGet().filter((c) => c.status === 'expiring' || c.status === 'expired');

  const grantsInsight = (): AiInsight =>
    dueSoon.length > 0
      ? { id: 'g-due', module: 'grants', severity: 'warning', title: `${dueSoon.length} grant deadline(s) within 7 days`, detail: dueSoon.slice(0, 2).map((g) => g.title.split(' ').slice(0, 4).join(' ')).join('; ') }
      : { id: 'g-clear', module: 'grants', severity: 'success', title: 'No grant deadlines inside 7 days', detail: `${openGrants.length} proposal(s) active in the pipeline` };

  switch (scope) {
    case 'exec':
      out.push(grantsInsight());
      out.push(stalled.length > 0
        ? { id: 'p-stall', module: 'innovations', severity: 'warning', title: `${stalled.length} innovation(s) stalled in stage`, detail: stalled.slice(0, 2).map((p) => `${p.title} (${p.daysInStage}d)`).join('; ') }
        : { id: 'p-ok', module: 'innovations', severity: 'success', title: 'Innovation pipeline is moving', detail: `${projects.length} project(s) executing without stalls` });
      out.push({ id: 'c-run', module: 'finance', severity: forecast.gapWarning ? 'warning' : 'success', title: `${forecast.monthsOfRunway} months of cash runway`, detail: forecast.gapWarning ? 'Burn is above inflow — new disbursements needed.' : 'Burn is below inflow — cash position is sustainable.' });
      break;
    case 'admin':
      out.push(pendingForms.length > 0
        ? { id: 'a-forms', module: 'hr', severity: 'warning', title: `${pendingForms.length} employee form(s) awaiting your verification`, detail: 'Verify the submitted FORM-HR-02 to start onboarding' }
        : { id: 'a-forms-ok', module: 'hr', severity: 'success', title: 'No employee submissions waiting', detail: 'All submitted forms have been reviewed' });
      out.push(openHires.length > 0
        ? { id: 'a-pipe', module: 'hr', severity: 'info', title: `${openHires.length} hire(s) mid-onboarding`, detail: `${openHires.filter((o) => !o.account).length} still need a login, ${openHires.filter((o) => !o.account?.mfaEnabled).length} need 2FA` }
        : { id: 'a-pipe-ok', module: 'hr', severity: 'success', title: 'Onboarding pipeline is clear', detail: 'Every hire has a login, role, 2FA and equipment' });
      out.push(renewals.length > 0
        ? { id: 'a-ctr', module: 'hr', severity: 'warning', title: `${renewals.length} contract(s) expiring or expired`, detail: 'Draft renewals in HR → Contracts before the end date' }
        : { id: 'a-ctr-ok', module: 'hr', severity: 'success', title: 'No contracts awaiting renewal', detail: 'All employment contracts are current' });
      break;
    case 'finance':
      out.push(grantsInsight());
      out.push(hotBudgets.length > 0
        ? { id: 'f-bud', module: 'finance', severity: 'warning', title: `${hotBudgets.length} department(s) above 90% budget`, detail: hotBudgets.slice(0, 2).map((b) => `${b.dept} ${Math.round((b.actual / Math.max(1, b.budget)) * 100)}%`).join(' · ') }
        : { id: 'f-bud-ok', module: 'finance', severity: 'success', title: 'Budgets inside the healthy range', detail: `${budgets.length} department budget(s) tracked` });
      out.push({ id: 'f-run', module: 'finance', severity: forecast.gapWarning ? 'warning' : 'success', title: `Cash runway: ${forecast.monthsOfRunway} months`, detail: forecast.gapWarning ? 'Expenditure is outpacing income.' : 'Income covers current burn.' });
      break;
    case 'grants':
      out.push(grantsInsight());
      out.push(...funderMatches().slice(0, 2));
      break;
    case 'innovations':
      out.push(...pipelineTrendSummary().slice(0, 3));
      break;
    case 'hr': {
      const morale = sentimentSummary();
      out.push({ id: 'h-morale', module: 'hr', severity: morale.morale === 'concern' ? 'warning' : morale.morale === 'positive' ? 'success' : 'info', title: `Team morale: ${morale.morale}`, detail: morale.detail });
      out.push(...contractRenewalAdvice().slice(0, 1));
      out.push(openHires.length > 0
        ? { id: 'h-pipe', module: 'hr', severity: 'warning', title: `${openHires.length} hire(s) mid-onboarding`, detail: 'Complete login, role, 2FA and assets to activate them' }
        : { id: 'h-pipe-ok', module: 'hr', severity: 'success', title: 'Onboarding pipeline is clear', detail: 'No hire is waiting on a provisioning step' });
      break;
    }
    case 'inventory': {
      const low = inventoryGet.lowStock();
      const maint = inventoryGet.maintenance();
      out.push(low.length > 0
        ? { id: 'i-low', module: 'finance', severity: 'warning', title: `${low.length} stock item(s) below threshold`, detail: low.slice(0, 3).map((s) => s.name).join(', ') }
        : { id: 'i-low-ok', module: 'finance', severity: 'success', title: 'Stock levels are healthy', detail: 'No item is below its reorder threshold' });
      out.push(maint.length > 0
        ? { id: 'i-maint', module: 'finance', severity: 'info', title: `${maint.length} maintenance record(s) on file`, detail: maint.slice(0, 2).map((m) => m.asset).join(', ') }
        : { id: 'i-maint-ok', module: 'finance', severity: 'success', title: 'No assets under maintenance', detail: 'All registered assets are serviceable' });
      break;
    }
    case 'system': {
      const users = userOpsGet.users();
      const unprovisioned = users.filter((u) => !u.provisioned);
      out.push({ id: 's-audit', module: 'hr', severity: 'info', title: `${userOpsGet.audit().length} security event(s) logged`, detail: 'Role changes, credential resets and provisioning are all recorded' });
      out.push(unprovisioned.length > 0
        ? { id: 's-unprov', module: 'hr', severity: 'warning', title: `${unprovisioned.length} account(s) not provisioned`, detail: unprovisioned.slice(0, 3).map((u) => u.name).join(', ') }
        : { id: 's-unprov-ok', module: 'hr', severity: 'success', title: 'Every account is provisioned', detail: `${users.length} managed account(s), ${users.filter((u) => u.mfaEnabled).length} with 2FA` });
      out.push({ id: 's-mfa', module: 'hr', severity: users.filter((u) => u.mfaEnabled).length === 0 ? 'warning' : 'info', title: `${users.filter((u) => u.mfaEnabled).length}/${users.length} accounts have 2FA`, detail: 'Issue credentials in the onboarding pipeline to enable it' });
      break;
    }
  }

  return out.filter(Boolean).slice(0, COMPACT_LIMIT);
}

export function DashboardAiInsights({ scope, title }: { scope: InsightScope; title?: string }) {
  useLiveData(); // re-derive the insight set whenever any AIMS store changes
  const insights = buildInsights(scope);
  if (insights.length === 0) return null;
  return <AIPanel compact title={title ?? 'AI Insights'} insights={insights} />;
}
