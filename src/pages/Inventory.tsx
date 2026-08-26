// src/pages/Inventory.tsx
// ============================================================
// AIMS — Inventory Management (Company Admin hub; legacy view for others)
// ============================================================

import { useAuth } from '@/context/AuthContext';
import { InventoryManager } from '@/components/inventory/InventoryManager';
import { InventoryHub } from '@/components/inventory/InventoryHub';

export function Inventory() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Inventory & Asset Management</h1>
        <p className="text-base font-medium text-white">Assets, stock & consumables, reorders, assignment, maintenance and stock-take</p>
      </div>
      {user?.role === 'COMPANY_ADMIN' ? <InventoryHub /> : <InventoryManager />}
    </div>
  );
}
