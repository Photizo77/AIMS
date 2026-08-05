// src/pages/Inventory.tsx
// ============================================================
// AIMS — Inventory Management (Admin Only)
// ============================================================

import { InventoryManager } from '@/components/inventory/InventoryManager';

export function Inventory() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">Manage office supplies and equipment (Admin access only)</p>
      </div>
      <InventoryManager />
    </div>
  );
}